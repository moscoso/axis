# AXIS — Official Rulebook (v18: Dice & Chains)

*Cosmic strategy • Six glyphs • One Rift*
**2 Players | Ages 12+ | 20–30 Minutes**

> **v18 is a hard reset of the AXIS ruleset.** Dice replace the card economy;
> chains replace Flux accumulation. The card/deck/hand/draft/spell systems and
> the Flux/Bond/Affinity/Zone-control systems of v16–v17 are **gone**. This file
> is the source of truth for the implementation.

---

## Overview

AXIS is a two-player cosmic strategy game played on a 6×6 grid anchored by six
**Cruxes** — fixed points where elemental rows and columns intersect. Two forces,
**Light** and **Dark**, take turns inscribing glyphs across the board. Every
inscription triggers a **chain** that ripples through an entire Crux's cross.

Win the war by pushing the **Rift** to your side, or by holding the higher
**score** when the board is full.

## Components

- 1 game board (6×6 grid)
- 6 **Crux** markers — one each: Sun, Moon, Star, Planet, Comet, Spiral
- 1 **Rift** marker
- Light stones (enough to cover 15 cells) and Dark stones (15 cells)
- **6 dice** — one per color. Each die's six faces show the six glyphs:
  `+`, `X`, `▲`, `↔`, `↕`, `■`

## Setup

**Place the six Cruxes** randomly, one of each color, obeying **Crux
Exclusivity**: no two Cruxes share a row or column. Each Crux owns the row and
column it sits on, so after placement every row and every column has exactly one
Crux that defines its color.

**Cell colors.** Every non-Crux cell has two colors: its **row color** (from the
Crux owning its row) and its **column color** (from the Crux owning its column).
Crux cells cannot be inscribed.

**The dice pool.** Roll all six dice into a public pool both players draw from
for the entire game. The board starts empty, the Rift starts at **0**.

## Turn Sequence

On your turn, in order:

1. **Pick a die** from the public pool.
2. **Inscribe** the die's glyph on an empty cell whose color matches the die.
3. **Fire the chain** — the matched Crux's full cross activates.
4. **Reroll** the two dice whose colors match the inscribed cell.

You must take a turn. Passing is not allowed. (A legal move always exists while
any cell is empty: every empty cell has two colors, and both of those dice are
always in the pool.)

## Inscribing

Pick one die. Choose any empty cell whose **row color or column color** matches
the die's color, and place your stone there, stamped with the die's current face.
The stone is yours for the rest of the game. The color you matched decides which
Crux fires:

- Matched the cell's **row color** → fire that row's Crux cross.
- Matched the cell's **column color** → fire that column's Crux cross.

A cell has two colors, so each inscription is a real choice: which Crux to ignite.

## The Chain

A Crux's **cross** is its full row + full column (11 cells, Crux at the center).
Inscribing fires that cross.

- The inscribed cell fires first; the chain spreads outward along the cross.
- Each inscribed cell fires its glyph as the chain reaches it. Empty cells are
  passed through silently.
- The **Crux is a junction**: the chain passes straight through it *and* turns
  into the perpendicular arm. The Crux cell itself does not fire.
- A direction **stops** when it reaches an **enemy `■`**, the board's edge, or
  the end of the cross's arm.
- Each cell fires **at most once** per chain.

### Glyph Ownership

Each inscribed glyph stays owned by the player who placed it. When it fires:

- `+` and `X` **score for their inscriber**, regardless of who triggered the chain.
- `▲` pushes the **Rift** toward **its inscriber**.
- `↔` / `↕` trigger their neighbors **only for chains owned by their inscriber**.
- `■` blocks chains **initiated by the opponent**. Friendly `■` does not block
  your own chains.

So a chain you initiate passes through your opponent's glyphs (unless stopped by
their `■`), and their `+`/`X` score for them and their `▲` pulls the Rift toward
them — choose your crosses with care.

### Repeaters

When a `↔` fires (and it's your chain), it triggers its two row neighbors as if
the chain had reached them; `↕` triggers its two column neighbors. If a triggered
neighbor is another of your Repeaters, it triggers its neighbors in turn —
cascades carry the chain past where the cross would naturally reach. The
once-per-cell rule prevents loops.

## The Six Glyphs

| Symbol | Name | Effect |
|---|---|---|
| `+` | Pulse | Inscriber scores 1 per orthogonally-adjacent friendly stone. |
| `X` | Cross | Inscriber scores 1 per diagonally-adjacent friendly stone. |
| `▲` | Drift | Push the Rift 1 toward the glyph's inscriber. |
| `↔` | Row Repeater | Triggers its two row neighbors (cascades through Repeaters). |
| `↕` | Column Repeater | Triggers its two column neighbors (cascades through Repeaters). |
| `■` | Block | Stops opponent chains in this cell's direction; no other effect. |

*Orthogonal* = up/down/left/right; *diagonal* = the four corners.

## The Rift

The Rift runs from **−6** (Dark's terminal) to **+6** (Light's terminal),
starting at 0. Each `▲` moves it 1 toward its inscriber (Light `+1`, Dark `−1`).
Reaching **±6** ends the game instantly — **Rift Break**.

## Victory

The game ends the instant either condition is met:

| Condition | How to Win |
|---|---|
| **Rift Break** | The Rift reaches ±6. Instant win for that side. |
| **End Score** | All 30 non-Crux cells are inscribed. Higher score wins (equal score → draw). |

## Implementation notes

- **Determinism.** Every roll/reroll is driven by a seeded PRNG carried in the
  `GameSeed` (`rngSeed` + `rngCursor`), so a game replays identically from its
  seed and bot lookahead is reproducible.
- **Chain order.** Effects resolve in fire order (placed cell first). Because
  stones don't move mid-chain, only the Rift mutates during resolution; the
  current engine applies the whole chain, then checks Rift Break. (A `▲`
  overshoot past ±6 still wins.)
- **Open rules choices** (localized, low-risk): End-Score ties resolve as a draw;
  Rift Break is checked after the full chain resolves.
