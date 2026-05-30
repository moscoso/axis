# AXIS — Design Pillars

**AXIS: Light & Dark Elemental Dominion** — a 2-player, 15–25 minute abstract
strategy game (ages 10+) on a 6×6 board. This file is the *design north star*:
the experience and strategic tensions the game exists to create. Use it to judge
new mechanics, spaces, and balance changes — if an idea doesn't serve a pillar
(or actively fights one), that's the conversation to have.

**Source of truth:** [`AXIS_Rulebook_v16.md`](./AXIS_Rulebook_v16.md). Where this
file states *intent* beyond the rules, it's marked 🅘 (interpretive) — those are
the lines to argue with.

---

## The 30-second model

Two mirror-image sides, **Light** and **Dark**, alternate turns. Each turn you do
**exactly one** thing: **Inscribe a Rune** (pay its card cost, activate its
rewards) or **Draw a card** from the 2-card display. A space's cost is its
printed symbol count (1–7), reduced by 1 for each friendly Rune already in its
row or column (floor 0). The three symbols are **+** (Flux on the Rune), **▲**
(push the **Rift** toward your end), and **■** (Draw). Flux in a **Crux's** row +
column decides who **controls** that Zone; control grants **Bond** (matching
cards pay and activate as 2). Win three ways: drive the **Rift** to your ±8
(Rift Break), hold **all four Cruxes** at once (Fluxmate), or own the most Flux
when the board fills (Last Rune). *Victory can come at any moment.*

---

## Pillar 1 — No safe lead

**Every turn is played under threat; two of the three win conditions strike instantly.**

Rift Break and Fluxmate end the game the moment they trigger — no warning, no
final round. A player who stops watching the Rift marker or the Crux count can
lose from a position that looked fine. The rulebook says it outright: *"Victory
can come at any moment. Every Rune placed shifts the balance."*

**Implications / guardrails**
- New mechanics should preserve this watchfulness. Be wary of anything that lets
  a player "turtle" into an unassailable lead or makes instant wins
  un-telegraphable to the point of feeling random.
- The instant-win threats are what make the slow Last-Rune game tense. Don't
  weaken them into afterthoughts.

## Pillar 2 — Position over accumulation

**The four Cruxes are the game. Territory compounds; raw Flux does not.**

Crux control is decided by *Flux on the Crux's two lines*, and holding a Crux
pays off twice over: **Bond** makes your matching-element cards count as 2 (cost
*and* activations), and **Zone Aura** turns quiet Null Runes into end-game
points. Control begets cheaper, stronger plays, which begets more control. 🅘 A
player who merely piles up Flux without contesting Cruxes should lose to one who
fights for the lines that matter.

**Implications / guardrails**
- New scoring/value sources should reward *where* and *how* you place, not
  undifferentiated accumulation.
- Bond is an intentional feedback loop (control → cheaper → more control). It
  needs a contestability brake: control must stay *flippable* by a determined
  opponent, since it's only ever "strictly greater Flux," never locked.

## Pillar 3 — Every placement is a negotiation

**Spend vs. gain is the per-turn decision, and going cheap has a real cost.**

Discounts make a committed line cheaper — but the rulebook's "Cost of Going
Cheap" is explicit: fewer cards paid means fewer symbols activated, so a deeply
discounted space can cost nothing and give nothing but a **Null Rune**. You
choose, almost every turn, between a cheap positional placement and an expensive
potent one (Flux for control, Force for the Rift, Draw for cards).

**Implications / guardrails**
- Protect the gap between cheap-positional and expensive-potent. If Null Runes
  become strictly best (or activations never worth their cards), this decision
  collapses.
- The "you *may* pay more than the discount" rule exists to keep this choice
  open even on Free spaces — preserve that freedom.

## Pillar 4 — Presence is double-edged

**A Rune helps you twice and can help your opponent once. Where you place is a real risk.**

Every Rune extends your discount cross and is "yours from the moment it's
placed." But **Zone Aura scores Null Runes for whoever controls that Zone — your
opponent's Null Runes in your Zone feed *you*, and yours in theirs feed *them*.**
Spreading into contested or enemy territory is never free; it can hand the other
side points if they end up holding that Crux.

**Implications / guardrails**
- Keep placement spatially consequential — the board should reward reading *whose*
  Zone you're strengthening, not just chasing local discounts.
- 🅘 Anything that makes Runes purely self-beneficial (no risk of feeding the
  opponent) erases a core tension. Guard the double edge.

## Pillar 5 — Tempo is scarce: one action a turn

**Inscribe or Draw — never both. Drawing forgoes a placement.**

With no max hand size and a refilling 2-card display, card supply is open — but
*time* is not. Spending a turn to draw is a turn you didn't place a Rune, didn't
contest a line, didn't push the Rift. 🅘 The economy isn't about hoarding cards;
it's about whether *this* turn is worth more spent on the board or in the hand.

**Implications / guardrails**
- Evaluate new actions/cards against the opportunity cost of a turn, not just
  their raw effect.
- Be cautious with effects that grant "free" draws or extra actions — they
  quietly erode the tempo decision that makes turns matter.

## Pillar 6 — A transparent board; the Rift rewards the bold

**The position is public and readable; the Rift adds foresight as a prize for leading it.**

Hands are private, but the board, discounts, Crux control, and the public
discard are all knowable — the skill is *reading a transparent position*, not
bluffing a murky one. The Rift sharpens this: while the marker sits on your side,
you may peek the top of the deck at any time (at 0, neither side can). So pushing
the Rift isn't only a path to Rift Break — it buys information, and ceding it
costs you sight.

**Implications / guardrails**
- Keep cost, discount, and control *inferable from the board*. (This is why the
  UI surfaces discount edges and Crux-control badges — the information is meant
  to be available; the *judgment* is the game.) Avoid hidden or non-deterministic
  costs.
- Treat the Rift as a dual-purpose axis (win condition *and* information). New
  Rift effects should respect both roles.

## Pillar 7 — A clean mirror, balanced by the draft

**Light and Dark are mechanically identical; the only asymmetry is who goes first — and the draft answers that.**

No factions, no asymmetric powers. The one structural imbalance — first-player
advantage — is deliberately offset at setup: the **second player drafts 2 of the
4 face-up cards, the first player takes the rest.** 🅘 Skill, not seat, should
decide games.

**Implications / guardrails**
- Resist asymmetric factions/powers unless *provably* balanced and clearly worth
  the cost to fairness and teachability.
- First-player advantage is the asymmetry to *monitor and offset* (draft, Rift,
  starting resources), never to introduce more of. If playtest data shows the
  draft under- or over-corrects, that's a balance lever — flag it.

---

## Anti-pillars (what AXIS is deliberately *not*)

- **Not a point-salad.** Every value source should ladder back to control, the
  Rift, or the Last-Rune tally — not a bolted-on parallel track.
- **Not hidden-information-heavy.** Hands are private; the *board* is not. It's a
  game of reading a transparent position, not bluffing a murky one.
- **Not solitaire.** Mechanics should create interaction — contested lines,
  contested Cruxes, fed/denied Auras — not parallel engines that ignore the
  opponent.
- **Not bloated.** 15–25 minutes, ages 10+. Teachability and pace are features;
  complexity must earn its keep. 🅘

---

## Scope note: variants vs. core

The v16 rulebook's symbol set is exactly **+ Flux**, **▲ Force**, **■ Draw**.
**Shift glyphs** (directional row/column slides) currently exist in the code as an
optional, lobby-toggled *house rule* — they are **not core**. Treat them, and any
similar module, as a *variant layer*: judge it on whether it strengthens a core
pillar without straining the others, and keep it cleanly separable.

## When you change something, ask:

1. Which pillar does this serve — and which does it strain?
2. Does it keep all three win conditions live and threatening (Pillar 1)?
3. Is the new state still *readable* on the board (Pillar 6)?
4. Does it preserve the spend-vs-gain and presence-double-edge tensions
   (Pillars 3 & 4)?
5. What does it cost in turn-tempo (Pillar 5)?
6. Does it keep the mirror clean, or smuggle in asymmetry (Pillar 7)?
7. Implementation blast radius: `models/` (rules + bots), `server/` (authority),
   `pwa/` (UI) — and is it cheap to prototype?
