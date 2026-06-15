import { ELEMENTS } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';
import { BoardCell, Game } from '../Game/Game';
import { shuffle } from '../Utility/shuffle';
import { Position, Zone } from '../Zone/Zone';
import { dealGlyphs, dealLegacyGlyphs } from './dealGlyphs';

/**
 * The Crux line value in the cost sudoku. Every Crux cell "absorbs" this value
 * (it carries no glyphs), so the playable costs on each line are {1..6}\{V}.
 * V = 1 keeps playable costs at 2–6 and the board total at exactly 120 glyphs —
 * a drop-in for the region model's distribution.
 */
const CRUX_VALUE = 1;

/**
 * Builds a 6×6 Latin square of costs 1–6 whose value-`CRUX_VALUE` cells are
 * exactly the Crux positions. Every row and every column is a permutation of
 * 1–6, so each line totals 21 and (Crux excluded) each playable line totals
 * 21 − V. Because a Zone in the cross model spans its Crux's row + column, every
 * suit ends up with the same glyph total (42 − 2V).
 *
 * Cruxes are pre-seeded with V; the remaining 30 cells are filled with the other
 * five values by backtracking. A completion always exists (placing one symbol on
 * a transversal never blocks a Latin square), so this never fails for a valid
 * Crux permutation — but the search is bounded and falls back by throwing.
 */
function buildCostGrid(cruxes: Position[]): number[][] {
	const grid: number[][] = Array.from({ length: 6 }, () => Array<number>(6).fill(0));
	const rowUsed = Array.from({ length: 6 }, () => new Set<number>());
	const colUsed = Array.from({ length: 6 }, () => new Set<number>());

	for (const { row, col } of cruxes) {
		grid[row][col] = CRUX_VALUE;
		rowUsed[row].add(CRUX_VALUE);
		colUsed[col].add(CRUX_VALUE);
	}

	const empties: Position[] = [];
	for (let r = 0; r < 6; r++) {
		for (let c = 0; c < 6; c++) {
			if (grid[r][c] === 0) empties.push({ row: r, col: c });
		}
	}

	const values = [1, 2, 3, 4, 5, 6].filter(v => v !== CRUX_VALUE);

	const solve = (i: number): boolean => {
		if (i === empties.length) return true;
		const { row, col } = empties[i];
		for (const v of shuffle([...values])) {
			if (rowUsed[row].has(v) || colUsed[col].has(v)) continue;
			grid[row][col] = v;
			rowUsed[row].add(v);
			colUsed[col].add(v);
			if (solve(i + 1)) return true;
			grid[row][col] = 0;
			rowUsed[row].delete(v);
			colUsed[col].delete(v);
		}
		return false;
	};

	if (!solve(0)) throw new Error('generateCrossBoard: failed to build a cost sudoku');
	return grid;
}

/**
 * Generates a 6×6 board and 6 hybrid Zones for the `'cross'` board model.
 * - Six Cruxes are placed on a random permutation: one per row, one per column
 *   (Cross Exclusivity), one per suit.
 * - A Zone is its Crux's full row + column (no rectangle), so every non-Crux cell
 *   belongs to two Zones — the Crux on its row and the Crux on its column — and
 *   takes its identity from both suits.
 * - Costs follow a 1–6 sudoku (each row/column a permutation of 1–6) with Cruxes
 *   sitting on the 1s, so playable costs are 2–6 and every suit holds the same
 *   number of glyphs.
 * - Glyph type distribution matches the region model (120 total: 32 each of
 *   +, ▲, ◇ and 6 of each shift direction), via the shared dealer.
 */
export function generateCrossBoard(
	{ shiftGlyphs = true }: { shiftGlyphs?: boolean } = {}
): Pick<Game, 'board' | 'zones'> {
	const elements = shuffle(ELEMENTS);
	const rows = shuffle([0, 1, 2, 3, 4, 5]);
	const cols = shuffle([0, 1, 2, 3, 4, 5]);
	const cruxes: Position[] = elements.map((_, i) => ({ row: rows[i], col: cols[i] }));

	const zones: Zone[] = elements.map((element, i) => ({
		id: `Z${i + 1}`,
		element,
		cruxPosition: cruxes[i],
		control: 'unbound' as const,
	}));

	// A cell's "home" zone id for display/fallback is the Crux on its row; the
	// column Crux's zone is derived alongside it by the selectors and the UI.
	const zoneIdByCruxRow = new Map<number, string>();
	for (const zone of zones) zoneIdByCruxRow.set(zone.cruxPosition.row, zone.id);

	const costGrid = buildCostGrid(cruxes);
	const isCrux = (r: number, c: number) => cruxes.some(p => p.row === r && p.col === c);

	const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col) => ({
			position: { row, col },
			zoneId: zoneIdByCruxRow.get(row)!,
			glyphs: [] as Glyph[],
			rune: null,
			hasCrux: isCrux(row, col),
		}))
	);

	type Slot = { row: number; col: number; cost: number };
	const slots: Slot[] = [];
	for (let r = 0; r < 6; r++) {
		for (let c = 0; c < 6; c++) {
			if (!isCrux(r, c)) slots.push({ row: r, col: c, cost: costGrid[r][c] });
		}
	}

	const capacities = slots.map(s => s.cost);
	const glyphsPerSlot = shiftGlyphs ? dealGlyphs(capacities) : dealLegacyGlyphs(capacities);
	for (let i = 0; i < slots.length; i++) {
		const { row, col } = slots[i];
		board[row][col].glyphs = glyphsPerSlot[i];
	}

	return { board, zones };
}
