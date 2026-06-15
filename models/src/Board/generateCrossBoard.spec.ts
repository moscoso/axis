import { expect } from 'chai';
import { generateCrossBoard } from './generateCrossBoard';
import { ELEMENTS } from '../Element/Element';
import { Glyph, ShiftGlyph, SHIFT_GLYPHS, isShiftGlyph } from '../Glyph/Glyph';

describe('generateCrossBoard — six hybrid cross zones, 1–6 cost sudoku', () => {
	const RUNS = 50;

	it('produces exactly 120 glyphs across all non-crux cells', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			const total = board.flat().reduce((sum, cell) => sum + cell.glyphs.length, 0);
			expect(total).to.equal(120);
		}
	});

	it('places 32 of each non-shift glyph and 6 of each shift direction', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			const counts: Partial<Record<Glyph, number>> = {};
			for (const cell of board.flat()) {
				for (const g of cell.glyphs) {
					counts[g] = (counts[g] ?? 0) + 1;
				}
			}
			expect(counts['+'], 'flux count').to.equal(32);
			expect(counts['▲'], 'force count').to.equal(32);
			expect(counts['◇'], 'draw count').to.equal(32);
			for (const dir of SHIFT_GLYPHS) {
				expect(counts[dir], `shift '${dir}' count`).to.equal(6);
			}
		}
	});

	it('never mixes two shift directions on the same cell', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			for (const cell of board.flat()) {
				const dirsHere = new Set<ShiftGlyph>();
				for (const g of cell.glyphs) {
					if (isShiftGlyph(g)) dirsHere.add(g);
				}
				expect(dirsHere.size, `cell (${cell.position.row},${cell.position.col})`).to.be.lessThan(2);
			}
		}
	});

	it('leaves Crux cells empty of glyphs', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			for (const cell of board.flat()) {
				if (cell.hasCrux) expect(cell.glyphs).to.have.length(0);
			}
		}
	});

	it('produces no shift glyphs when shiftGlyphs is off, but still 120 glyphs total', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard({ shiftGlyphs: false });
			const all = board.flat().flatMap(cell => cell.glyphs);
			expect(all).to.have.length(120);
			expect(all.some(isShiftGlyph), 'no shift glyphs present').to.equal(false);
		}
	});

	it('creates six cross zones with no rectangle geometry', () => {
		for (let i = 0; i < RUNS; i++) {
			const { zones } = generateCrossBoard();
			expect(zones).to.have.length(6);
			for (const zone of zones) {
				expect(zone.topLeft, 'cross zones carry no topLeft').to.equal(undefined);
				expect(zone.width).to.equal(undefined);
				expect(zone.height).to.equal(undefined);
				expect(zone.control).to.equal('unbound');
			}
		}
	});

	it('assigns each of the six suits to exactly one zone', () => {
		for (let i = 0; i < RUNS; i++) {
			const { zones } = generateCrossBoard();
			const suits = zones.map(z => z.element).sort();
			expect(suits).to.deep.equal([...ELEMENTS].sort());
		}
	});

	it('places six Cruxes obeying Cross Exclusivity (distinct rows and columns)', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateCrossBoard();
			const rows = new Set(zones.map(z => z.cruxPosition.row));
			const cols = new Set(zones.map(z => z.cruxPosition.col));
			expect(rows.size, 'distinct crux rows').to.equal(6);
			expect(cols.size, 'distinct crux cols').to.equal(6);
			for (const zone of zones) {
				const { row, col } = zone.cruxPosition;
				expect(board[row][col].hasCrux).to.equal(true);
			}
		}
	});

	it('lays costs on a 1–6 sudoku (each row and column a permutation of 1–6)', () => {
		// Reconstruct the cost grid: a Crux cell absorbs value 1 (it carries no
		// glyphs), every other cell's cost is its glyph count.
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			const costAt = (r: number, c: number) =>
				board[r][c].hasCrux ? 1 : board[r][c].glyphs.length;

			for (let r = 0; r < 6; r++) {
				const rowCosts = Array.from({ length: 6 }, (_, c) => costAt(r, c)).sort((a, b) => a - b);
				expect(rowCosts, `row ${r}`).to.deep.equal([1, 2, 3, 4, 5, 6]);
			}
			for (let c = 0; c < 6; c++) {
				const colCosts = Array.from({ length: 6 }, (_, r) => costAt(r, c)).sort((a, b) => a - b);
				expect(colCosts, `col ${c}`).to.deep.equal([1, 2, 3, 4, 5, 6]);
			}
		}
	});

	it('keeps playable (non-crux) costs in 2–6 — the Cruxes hold every 1', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateCrossBoard();
			for (const cell of board.flat()) {
				if (cell.hasCrux) continue;
				expect(cell.glyphs.length, `cell (${cell.position.row},${cell.position.col})`)
					.to.be.within(2, 6);
			}
		}
	});

	it('gives every suit the same glyph total (40 = 42 − 2·V)', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateCrossBoard();
			for (const zone of zones) {
				const { row: cruxRow, col: cruxCol } = zone.cruxPosition;
				let total = 0;
				for (let c = 0; c < 6; c++) total += board[cruxRow][c].glyphs.length;
				for (let r = 0; r < 6; r++) {
					if (r === cruxRow) continue; // crux row already counted
					total += board[r][cruxCol].glyphs.length;
				}
				expect(total, `suit ${zone.element}`).to.equal(40);
			}
		}
	});

	it('makes every non-crux cell belong to two distinct zones (row crux + col crux)', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board, zones } = generateCrossBoard();
			for (const cell of board.flat()) {
				if (cell.hasCrux) continue;
				const rowZones = zones.filter(z => z.cruxPosition.row === cell.position.row);
				const colZones = zones.filter(z => z.cruxPosition.col === cell.position.col);
				expect(rowZones, `row zone for (${cell.position.row},${cell.position.col})`).to.have.length(1);
				expect(colZones, `col zone for (${cell.position.row},${cell.position.col})`).to.have.length(1);
				expect(rowZones[0]).to.not.equal(colZones[0]);
			}
		}
	});
});
