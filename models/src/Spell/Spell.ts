import { Position } from '../Zone/Zone';

/** Footprint shapes a Spell can target. Fixed orientation — no rotation. */
export const SPELL_SHAPES = ['single', 'row3', 'col3', 'x5', 'block4'] as const;
export type SpellShape = typeof SPELL_SHAPES[number];

/** Spell effects. v1 ships only `charge` (+Flux to the caster's runes). */
export const SPELL_EFFECTS = ['charge'] as const;
export type SpellEffect = typeof SPELL_EFFECTS[number];

export interface SpellCard {
	id: string;
	name: string;
	shape: SpellShape;
	effect: SpellEffect;
	/**
	 * Force paid to cast — the number of steps the Rift slides toward the
	 * caster's opponent (you spend hard-won Rift progress to reshape the board).
	 */
	forceCost: number;
}

/**
 * Footprint offsets `{ dr, dc }` from the anchor cell for each shape, in fixed
 * orientation. The anchor is the cell the caster chooses; for `block4` it is the
 * top-left of the 2×2, for every other shape it is the center.
 */
export const SPELL_FOOTPRINTS: Record<SpellShape, ReadonlyArray<{ dr: number; dc: number }>> = {
	single: [{ dr: 0, dc: 0 }],
	row3:   [{ dr: 0, dc: -1 }, { dr: 0, dc: 0 }, { dr: 0, dc: 1 }],
	col3:   [{ dr: -1, dc: 0 }, { dr: 0, dc: 0 }, { dr: 1, dc: 0 }],
	x5:     [{ dr: 0, dc: 0 }, { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 }],
	block4: [{ dr: 0, dc: 0 }, { dr: 0, dc: 1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }],
};

/**
 * Resolves a Spell footprint to the on-board cells it would cover for a given
 * anchor. Offsets that fall outside the 6×6 board are clipped away.
 */
export function getSpellFootprint(shape: SpellShape, anchor: Position): Position[] {
	return SPELL_FOOTPRINTS[shape]
		.map(o => ({ row: anchor.row + o.dr, col: anchor.col + o.dc }))
		.filter(p => p.row >= 0 && p.row < 6 && p.col >= 0 && p.col < 6);
}
