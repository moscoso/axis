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
- **6 dice** — one per color. The six die faces are `+`, `X`, `▲`, `▲`, `↔`, `↕`
  — five glyphs, with **`▲` Drift appearing on two faces** (weighting the Rift).

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
4. **Reroll** the die you used. *(Option: reroll both of the inscribed cell's
   color dice.)*

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

A Crux's **cross** is its full row + full column. Inscribing a cell of the
Crux's color fires that cross: the chain **emanates from the Crux outward along
all four arms**.

- Each arm runs cell by cell from the Crux outward. **Your own stones fire** as
  the chain reaches them; empty cells are passed through.
- An arm **stops** when it reaches an **opponent stone** (a pure wall — it does
  not fire) or the board's edge.
- The **Crux divides opposite arms** — a chain never carries through the Crux
  from one arm to the other. The Crux cell itself does not fire.
- Each cell fires **at most once** per chain.

There is no Block glyph and no friendly-fire: a chain only ever fires the
initiator's own stones, and every opponent stone (and the Crux) interrupts it.

### Glyph effects

When one of your stones fires:

- `+` Pulse **scores 1 per orthogonally-adjacent friendly stone**.
- `X` Cross **scores 1 per diagonally-adjacent friendly stone**.
- `▲` Drift pushes the **Rift** one step toward you.
- `↔` / `↕` Repeaters trigger their neighbors (see below).

### Repeaters

When a `↔` fires it triggers its two row neighbors as if the chain had reached
them; `↕` triggers its two column neighbors. A triggered **friendly** stone
fires (an opponent stone walls the trigger); if it's another Repeater it
triggers its neighbors in turn — cascades carry the chain off the cross. The
once-per-cell rule prevents loops.

## The Five Glyphs

| Symbol | Name | Effect |
|---|---|---|
| `+` | Pulse | Inscriber scores 1 per orthogonally-adjacent friendly stone. |
| `X` | Cross | Inscriber scores 1 per diagonally-adjacent friendly stone. |
| `▲` | Drift | Push the Rift 1 toward the inscriber. (On two die faces.) |
| `↔` | Row Repeater | Triggers its two row neighbors (cascades through Repeaters). |
| `↕` | Column Repeater | Triggers its two column neighbors (cascades through Repeaters). |

*Orthogonal* = up/down/left/right; *diagonal* = the four corners. There is no
Block glyph — every opponent stone interrupts a chain.

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
