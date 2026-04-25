# AXIS AI Roadmap

A staged plan for an AI opponent in **AXIS: Light & Dark Elemental Dominion**.
Each phase has a clear win criterion and only starts when the previous one is
solid. Designed so a fresh session can drop in cold and act.

## TL;DR — Status

| Phase | What | State | Win criterion |
|-------|------|:-----:|---------------|
| 0 | Foundations: legal moves, pure simulator, public state, match harness | ✅ DONE | All four primitives exist and a `RandomBot` plays end-to-end |
| 1 | One-ply heuristic bot | ✅ DONE | Beats `RandomBot` >55% over 100 games (currently **97.9%**) |
| 2 | Determinized MCTS / UCT search | ⬜ NEXT | Beats `HeuristicBot` >55% |
| 3 | Self-play Deep RL (AlphaZero-style policy/value net) | ⬜ FUTURE | Beats MCTS and trains via self-play loop |

Live integration is also wired:
- Server attaches a `BotRunner` to every Dealer ([server/src/Server/BotRunner.ts](../server/src/Server/BotRunner.ts)).
- PWA has an "Add Bot" button under each empty seat ([pwa/src/app/game/components/seat/](../pwa/src/app/game/components/seat/)).
- A human can sit, click "Add Bot", and play a real `HeuristicBot` opponent.

---

## Architecture invariants

Every phase relies on four primitives. **Don't break these** — every later
phase assumes them.

| Primitive | File | Contract |
|---|---|---|
| `getLegalMoves(state, side)` | [models/src/Selectors/LegalMoves.ts](../models/src/Selectors/LegalMoves.ts) | Pure, returns every valid `GameCommand` for a side. Phase-aware (draft / main-turn / pending-draws). |
| `simulateGameCommand(state, cmd)` | [models/src/Game/simulateCommand.ts](../models/src/Game/simulateCommand.ts) (was `applyCommand`, renamed during PR review) | Pure: `(state, cmd) → { ok, state, events }`. No emitters, no Dealer side effects. Recursively applies follow-up commands. |
| `getPublicState(state, side)` | [models/src/Player/PublicGameState.ts](../models/src/Player/PublicGameState.ts) | Redacted view: opponent hand size only, deck length only. Bots **must** decide from this. |
| `runMatch / runSeries` | [models/src/Player/Bot/runMatch.ts](../models/src/Player/Bot/runMatch.ts) | Headless bot-vs-bot. Drives the whole game start-to-finish. The benchmark harness for every phase. |

Bot interface ([models/src/Player/Bot/Bot.ts](../models/src/Player/Bot/Bot.ts)):
```ts
interface Bot {
  readonly name: string;
  chooseMove(publicState: PublicGameState, legalMoves: GameCommand[]): GameCommand;
}
```

---

## Phase 0 — Foundations ✅

**Goal:** make ANY bot possible. Build the four primitives plus a baseline.

**Delivered:**
- `getLegalMoves` — enumerates every valid command (Draft picks, Inscribes
  across all payment subsets × activation multisets, Draws). Respects
  pending-draw force and Crux cells.
- `simulateGameCommand` — pure state transition. Stops processing follow-ups
  once the game is terminal (winning Inscribe queues an `EndTurn` that fails
  `IS_NOT_GAME_OVER`; we swallow that gracefully).
- `PublicGameState` — redacted view.
- `Bot` interface + `RandomBot`.
- `runMatch` / `runSeries` — drives a full game between two bots, returns
  `{ winner, reason, moveCount, turnCount, events }`.
- `npm run bot:smoke` — RandomBot vs RandomBot baseline (~50/50, ~200ms for
  20 games).

---

## Phase 1 — Heuristic Bot ✅

**Goal:** play noticeably better than random. One-ply lookahead + weighted
state evaluator.

**Delivered:**
- [evaluateState(state, side, weights)](../models/src/Player/Bot/evaluateState.ts) — symmetric scalar score:

  ```
  score =  cruxControl * 100
         + riftDirection * 20
         + auraScore * 8
         + cruxFlux * 5
         + handDelta * 2
  ```

  Plus ±1e6 short-circuits for terminal win/loss.
- [HeuristicBot](../models/src/Player/Bot/HeuristicBot.ts) — for each legal
  move: simulate, score the resulting state from my side, pick max.
  Random tie-break.
- Lifts `PublicGameState` back to a full `GameState` for simulation by stubbing
  the opponent hand empty and the deck with `deckSize` opaque cards.
  Imperfect but eval only reads hand sizes / public board, so simulation
  stays accurate.

**Benchmark (100 games, side-balanced):**
- Random vs Random: 46.7% / 53.3% (baseline ~50/50 ✓)
- Heuristic vs Random: **97.9% / 2.1%** ✅ (target was >55%)

**Run it:** `npm run bot:smoke` from the monorepo root.

---

## Phase 2 — MCTS / UCT search ⬜ NEXT

**Goal:** beat `HeuristicBot` consistently by searching deeper than one ply.

### Why MCTS specifically

AXIS has two properties that rule out plain minimax:

1. **Hidden information** — opponent hand contents.
2. **Stochasticity** — deck order, card draws.

The standard answer is **Determinized MCTS (also called PIMC — Perfect
Information Monte Carlo)**:

1. Sample a determinization: assign cards to the unseen deck and opponent
   hand consistent with public information (hand sizes, discard, display).
2. Run a UCT tree search on that determinization for some budget (e.g.
   N=200 rollouts).
3. Use `HeuristicBot` (Phase 1) as the **rollout policy** to play out leaves
   to a terminal state quickly.
4. Repeat for several determinizations, average action values, pick the move
   with the best expected value.

### Concrete next steps

1. **Determinizer** — `models/src/Player/Bot/MCTS/determinize.ts`
   - Input: `PublicGameState` + the bot's `side`.
   - Output: a plausible full `GameState` consistent with public info.
   - Sample opponent hand from `unseenCards = allCards - myHand - display - discard`.
   - Shuffle remaining cards into the deck.
   - Use a seedable RNG so a search batch can use the same determinization
     twice for reproducibility.

2. **UCT tree** — `models/src/Player/Bot/MCTS/UCT.ts`
   - Standard UCB1: `score = value + c * sqrt(ln(parentVisits) / visits)`.
   - Tunable exploration constant `c` (start with √2 ≈ 1.41).
   - Tree node carries: `state, side, untriedMoves, children, visits, value`.

3. **Rollout policy** — reuse `HeuristicBot.chooseMove` for the playout phase.
   Random rollouts are a Phase-2.0 fallback if HeuristicBot rollouts are too
   slow.

4. **The bot itself** — `models/src/Player/Bot/MCTSBot.ts`
   - Implements `Bot`.
   - Knobs: number of determinizations, rollouts per determinization,
     exploration constant.
   - Aggregates action values across determinizations.

5. **Benchmark hook** — extend `scripts/botSmoke.ts` to add an MCTS-vs-Heuristic
   matchup. Aim for >55% win rate to call Phase 2 done.

### Tuning watch-outs

- **Compute budget matters.** A real game turn must run in <1s wall clock.
  Profile `simulateGameCommand` cost early — if 10K simulations/sec is achievable,
  you have room. If it's 1K/sec, rollouts must be cheaper or you cap depth.
- **Hidden hand mismatches** are the biggest accuracy killer. Don't sample
  the opponent hand as random cards from the full deck — sample from
  `unseenCards` (excludes what's been drawn / discarded / in your hand /
  in display).
- **Same-determinization re-use** speeds up the search but biases toward
  whatever was sampled. A modest budget (4–8 determinizations × 50–100
  rollouts each) is usually a better split than 1×800.

### Files to create (Phase 2)

```
models/src/Player/Bot/MCTS/
  ├── determinize.ts      Sample a full state from public + side
  ├── UCT.ts              Tree node + UCB1 policy
  ├── rollout.ts          Playout from a state to terminal using a Bot policy
  └── MCTSBot.ts          The Bot impl (combines the above)
models/src/Player/Bot/MCTSBot.spec.ts    Unit tests
```

Reuse:
- `getLegalMoves`, `simulateGameCommand`, `evaluateState`, `HeuristicBot`,
  `runMatch` / `runSeries` — all from Phase 0/1.

### Estimated scope

1–2 weeks for a competent first pass. The hard parts are determinization
correctness and tuning compute budgets — not the search itself.

---

## Phase 3 — Self-play Deep RL ⬜ FUTURE

**Goal:** AlphaZero-style policy + value network, trained via self-play.

Only worth it after Phase 2 because:
- Phase 0 gives the self-play environment (`runMatch`).
- Phase 1 gives reward shaping and a sparring partner.
- Phase 2 gives the MCTS search the policy network plugs into.

### Architecture (sketch)

- **Encoding**: 6×6 board × ~10 feature channels (rune owner, flux value,
  glyph types, Crux flag, zone control, etc.) + scalar features (rift, hand
  size, deck size, current turn, pending draws).
- **Network**: small CNN (5–10 conv layers) + two heads:
  - Policy head: distribution over the legal-move action space.
  - Value head: scalar estimate of expected outcome from current side.
- **Action representation**: this is the trickiest part. Inscribes have a
  combinatorial action space (cell × payment subset × activation multiset).
  Either flatten to a fixed action vector with masking, or factor into
  sub-policies.
- **Training loop**: AlphaZero — MCTS guided by network priors, network
  trained on (state → action distribution, terminal value) pairs from
  self-play games.
- **Compute**: a single GPU should suffice given the small state space.
  Rough order: 100K–1M self-play games, days to weeks on a desktop.

### When to start

Not before Phase 2 is operational with reproducible benchmarks. This is
multi-month territory and benefits enormously from the search and eval
work being stable.

---

## Live integration (already wired)

Independent of phase, the server + PWA already wire bots into a real game.

**Server** ([server/src/Server/BotRunner.ts](../server/src/Server/BotRunner.ts)):
- Every `Dealer` gets a `BotRunner` attached on creation.
- `BotRunner` listens to `dealer.emitter.on('GameUpdate')`.
- When the active side maps to a user with id prefix `bot-`, the runner
  enumerates legal moves, calls `bot.chooseMove(...)`, submits via
  `dealer.executeGameCommand(...)`. Reactive — no internal turn loop.
- Bot kind is inferred from id: `bot-heuristic-...` → `HeuristicBot`,
  `bot-random-...` → `RandomBot`. (A real `botType` field on `Seat` is a
  follow-up.)

**PWA** ([pwa/src/app/game/components/seat/](../pwa/src/app/game/components/seat/)):
- Each empty seat shows two buttons: **Join** (for the user) and **Add Bot**.
- "Add Bot" dispatches a `JoinTable` command for a synthetic
  `bot-heuristic-<random>` user. The server's BotRunner picks it up.

**To add a Phase-2 bot to the live game:**
1. Implement `MCTSBot` in models.
2. In `BotRunner.botFromUserId`, branch on the prefix:
   ```ts
   if (userId.includes('mcts')) return new MCTSBot({ name: userId });
   if (userId.includes('random')) return new RandomBot({ name: userId });
   return new HeuristicBot({ name: userId });
   ```
3. In the PWA seat component, give the user a way to choose
   (e.g. a dropdown next to "Add Bot"). Or expose a single
   "Add MCTS Bot" button if you want it as the default upgrade.

---

## How to verify your work

```bash
# from the monorepo root
npm test                  # all spec files in all workspaces
npm run lint              # eslint across models + server
npm run bot:smoke         # 20-game RandomBot vs HeuristicBot benchmark
npm run bot:smoke:server  # end-to-end Dealer + BotRunner exercise
npm run develop           # all three packages in watch mode (concurrently)
```

A new bot is "done" when:

1. Its `npm test` specs pass.
2. `runSeries` against the previous-tier bot shows >55% win rate over ≥100
   games.
3. It plays an end-to-end game via the server when seated through the PWA.

---

## Known follow-ups (not blocking Phase 2)

- **Stuck-state resolution** — when a player has no legal moves and can't
  draw (deck + display + hand exhausted), the engine should declare
  last-rune-style loss. Already partially handled but worth auditing.
- **botType field on Seat** — replace the userId-prefix convention with
  an explicit field. Touches axis-models (Table/Seat type, reducer), the
  PWA's "Add Bot" UI, and the server's BotRunner registration.
- **Dealer post-win logging noise** — the Dealer logs the rejected
  `EndTurn` followup after a winning Inscribe (`GameError: The game is
  already over`). Cosmetic; `simulateGameCommand` already handles it
  correctly. Could short-circuit in the Dealer for cleanliness.
- **`@angular/build@21` peers cap PWA's TypeScript at <6.0.** Lifts when
  Angular publishes TS 6 support; PWA's spec is currently `~5.9.3`.

---

## Where to look first when picking this up

1. **Read this file.**
2. Run `npm run bot:smoke` from the root — confirm it prints win rates and
   doesn't error.
3. Skim [evaluateState.ts](../models/src/Player/Bot/evaluateState.ts) and
   [HeuristicBot.ts](../models/src/Player/Bot/HeuristicBot.ts). They're
   short and show the existing pattern that Phase 2 will follow.
4. Skim [runMatch.ts](../models/src/Player/Bot/runMatch.ts). Phase 2 will
   benchmark through this same harness.
5. Start on Phase 2's `determinize.ts` first — the rest builds on it.
