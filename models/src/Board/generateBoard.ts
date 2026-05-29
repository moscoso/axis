import { Element } from '../Element/Element';
import { Glyph, ShiftGlyph, SHIFT_GLYPHS } from '../Glyph/Glyph';
import { BoardCell, Game } from '../Game/Game';
import { shuffle } from '../Utility/shuffle';
import { Zone } from '../Zone/Zone';

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];
const NON_SHIFT_GLYPHS: Glyph[] = ['+', '▲', '◇'];
const GLYPH_ORDER: Record<Glyph, number> = {
	'+': 0, '▲': 1, '◇': 2, '↑': 3, '→': 4, '↓': 5, '←': 6,
};

const QUADRANTS = [
	{ id: 'TL', topLeft: { row: 0, col: 0 } },
	{ id: 'TR', topLeft: { row: 0, col: 3 } },
	{ id: 'BL', topLeft: { row: 3, col: 0 } },
	{ id: 'BR', topLeft: { row: 3, col: 3 } },
] as const;

function placeCruxes(): { TL: { row: number; col: number }; TR: { row: number; col: number }; BL: { row: number; col: number }; BR: { row: number; col: number } } {
	const [tlRow, trRow] = shuffle([0, 1, 2]);
	const [blRow, brRow] = shuffle([3, 4, 5]);
	const [tlCol, blCol] = shuffle([0, 1, 2]);
	const [trCol, brCol] = shuffle([3, 4, 5]);

	return {
		TL: { row: tlRow, col: tlCol },
		TR: { row: trRow, col: trCol },
		BL: { row: blRow, col: blCol },
		BR: { row: brRow, col: brCol },
	};
}

/** Legacy distribution: each slot gets `cost` glyphs picked uniformly from +, ▲, ◇. */
function dealLegacyGlyphs(capacities: number[]): Glyph[][] {
	return capacities.map(cap =>
		Array.from({ length: cap }, () => NON_SHIFT_GLYPHS[Math.floor(Math.random() * NON_SHIFT_GLYPHS.length)])
			.sort((a, b) => GLYPH_ORDER[a] - GLYPH_ORDER[b])
	);
}

/**
 * Distributes 144 glyphs across 32 cells given each cell's capacity.
 * - 36 of each non-shift type (+, ▲, ◇).
 * - 9 of each shift direction (↑, →, ↓, ←).
 * - Per-cell rule: shifts on a single cell must all share one direction.
 */
function dealGlyphs(capacities: number[]): Glyph[][] {
	const cells = capacities.map(cap => ({
		remaining: cap,
		glyphs: [] as Glyph[],
		shiftDir: null as ShiftGlyph | null,
	}));

	for (const dir of shuffle([...SHIFT_GLYPHS])) {
		for (let i = 0; i < 9; i++) {
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
		...Array(36).fill('+' as Glyph),
		...Array(36).fill('▲' as Glyph),
		...Array(36).fill('◇' as Glyph),
	]);
	let nsIdx = 0;
	for (const cell of cells) {
		while (cell.remaining > 0) {
			cell.glyphs.push(nonShifts[nsIdx++]);
			cell.remaining--;
		}
	}

	return cells.map(c =>
		c.glyphs.slice().sort((a, b) => GLYPH_ORDER[a] - GLYPH_ORDER[b])
	);
}

/**
 * Generates a randomised 6×6 board and 4 zones for a new AXIS game.
 * - Elements are randomly assigned to quadrants.
 * - Cruxes are placed obeying row/column exclusivity at generation time.
 * - Each zone's 8 non-crux cells receive costs 1–8 exactly once (shuffled).
 * - When `shiftGlyphs` is true (default), 144 glyphs are distributed as 36 each
 *   of +, ▲, ◇ and 9 each of ↑, →, ↓, ←. A cell's shifts are all the same
 *   direction (mixed shift directions on one cell are forbidden); non-shift
 *   glyphs may freely co-exist with shifts. When false, every glyph is picked
 *   uniformly from +, ▲, ◇ and no shifts appear.
 */
export function generateBoard(
	{ shiftGlyphs = true }: { shiftGlyphs?: boolean } = {}
): Pick<Game, 'board' | 'zones'> {
	const elements = shuffle(ELEMENTS);
	const cruxes = placeCruxes();
	const cruxKeys = ['TL', 'TR', 'BL', 'BR'] as const;

	const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col) => ({
			position: { row, col },
			zoneId: '',
			glyphs: [] as Glyph[],
			rune: null,
			hasCrux: false,
		}))
	);

	type Slot = { row: number; col: number; cost: number };
	const slots: Slot[] = [];

	const zones: Zone[] = QUADRANTS.map(({ id, topLeft }, i) => {
		const key = cruxKeys[i];
		const cruxPosition = cruxes[key];
		const element = elements[i];

		const costs = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
		let costIndex = 0;

		for (let r = topLeft.row; r < topLeft.row + 3; r++) {
			for (let c = topLeft.col; c < topLeft.col + 3; c++) {
				const isCrux = r === cruxPosition.row && c === cruxPosition.col;
				board[r][c].zoneId = id;
				board[r][c].hasCrux = isCrux;
				if (!isCrux) {
					slots.push({ row: r, col: c, cost: costs[costIndex++] });
				}
			}
		}

		return {
			id,
			element,
			topLeft,
			cruxPosition,
			control: 'unbound',
		};
	});

	const capacities = slots.map(s => s.cost);
	const glyphsPerSlot = shiftGlyphs ? dealGlyphs(capacities) : dealLegacyGlyphs(capacities);
	for (let i = 0; i < slots.length; i++) {
		const { row, col } = slots[i];
		board[row][col].glyphs = glyphsPerSlot[i];
	}

	return { board, zones };
}
