import { Glyph, ShiftGlyph, SHIFT_GLYPHS } from '../Glyph/Glyph';
import { shuffle } from '../Utility/shuffle';

const NON_SHIFT_GLYPHS: Glyph[] = ['+', '▲', '◇'];
export const GLYPH_ORDER: Record<Glyph, number> = {
	'+': 0, '▲': 1, '◇': 2, '↑': 3, '→': 4, '↓': 5, '←': 6,
};

/** Shift mix: 6 per direction (24 total), leaving 96 = 32 of each non-shift. */
const SHIFTS_PER_DIRECTION = 6;
const NON_SHIFTS_PER_TYPE = 32;

/** Sort a cell's glyphs into the canonical display order. */
export const sortGlyphs = (glyphs: Glyph[]): Glyph[] =>
	glyphs.slice().sort((a, b) => GLYPH_ORDER[a] - GLYPH_ORDER[b]);

/** Legacy distribution: each slot gets `cost` glyphs picked uniformly from +, ▲, ◇. */
export function dealLegacyGlyphs(capacities: number[]): Glyph[][] {
	return capacities.map(cap =>
		sortGlyphs(
			Array.from({ length: cap }, () => NON_SHIFT_GLYPHS[Math.floor(Math.random() * NON_SHIFT_GLYPHS.length)])
		)
	);
}

/**
 * Distributes 120 glyphs across the 30 non-crux cells given each cell's capacity.
 * - 32 of each non-shift type (+, ▲, ◇).
 * - 6 of each shift direction (↑, →, ↓, ←).
 * - Per-cell rule: shifts on a single cell must all share one direction.
 *
 * Assumes `sum(capacities) === 120`; both board generators honour that total.
 */
export function dealGlyphs(capacities: number[]): Glyph[][] {
	const cells = capacities.map(cap => ({
		remaining: cap,
		glyphs: [] as Glyph[],
		shiftDir: null as ShiftGlyph | null,
	}));

	for (const dir of shuffle([...SHIFT_GLYPHS])) {
		for (let i = 0; i < SHIFTS_PER_DIRECTION; i++) {
			const eligible = cells.filter(c =>
				c.remaining > 0 && (c.shiftDir === null || c.shiftDir === dir)
			);
			if (eligible.length === 0) {
				throw new Error(`dealGlyphs: cannot place shift '${dir}' — no compatible cell`);
			}
			const cell = eligible[Math.floor(Math.random() * eligible.length)];
			cell.glyphs.push(dir);
			cell.shiftDir = dir;
			cell.remaining--;
		}
	}

	const nonShifts: Glyph[] = shuffle([
		...Array(NON_SHIFTS_PER_TYPE).fill('+' as Glyph),
		...Array(NON_SHIFTS_PER_TYPE).fill('▲' as Glyph),
		...Array(NON_SHIFTS_PER_TYPE).fill('◇' as Glyph),
	]);
	let nsIdx = 0;
	for (const cell of cells) {
		while (cell.remaining > 0) {
			cell.glyphs.push(nonShifts[nsIdx++]);
			cell.remaining--;
		}
	}

	return cells.map(c => sortGlyphs(c.glyphs));
}
