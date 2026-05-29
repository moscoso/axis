import { expect } from 'chai';
import { generateBoard } from './generateBoard';
import { Glyph, ShiftGlyph, SHIFT_GLYPHS, isShiftGlyph } from '../Glyph/Glyph';

describe('generateBoard — constrained 144-glyph distribution', () => {
	const RUNS = 50;

	it('produces exactly 144 glyphs across all non-crux cells', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			const total = board.flat().reduce((sum, cell) => sum + cell.glyphs.length, 0);
			expect(total).to.equal(144);
		}
	});

	it('places 36 of each non-shift glyph and 9 of each shift direction', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
			const counts: Partial<Record<Glyph, number>> = {};
			for (const cell of board.flat()) {
				for (const g of cell.glyphs) {
					counts[g] = (counts[g] ?? 0) + 1;
				}
			}
			expect(counts['+'], 'flux count').to.equal(36);
			expect(counts['▲'], 'force count').to.equal(36);
			expect(counts['◇'], 'draw count').to.equal(36);
			for (const dir of SHIFT_GLYPHS) {
				expect(counts[dir], `shift '${dir}' count`).to.equal(9);
			}
		}
	});

	it('never mixes two shift directions on the same cell', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard();
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
			const { board } = generateBoard();
			for (const cell of board.flat()) {
				if (cell.hasCrux) {
					expect(cell.glyphs).to.have.length(0);
				}
			}
		}
	});

	it('produces no shift glyphs when shiftGlyphs is off, but still 144 glyphs total', () => {
		for (let i = 0; i < RUNS; i++) {
			const { board } = generateBoard({ shiftGlyphs: false });
			const all = board.flat().flatMap(cell => cell.glyphs);
			expect(all).to.have.length(144);
			expect(all.some(isShiftGlyph), 'no shift glyphs present').to.equal(false);
		}
	});

	it('gives each zone 8 non-crux cells with costs 1..8 exactly once', () => {
		const { board, zones } = generateBoard();
		for (const zone of zones) {
			const { row, col } = zone.topLeft;
			const costs: number[] = [];
			for (let r = row; r < row + 3; r++) {
				for (let c = col; c < col + 3; c++) {
					if (!board[r][c].hasCrux) costs.push(board[r][c].glyphs.length);
				}
			}
			expect(costs.sort((a, b) => a - b)).to.deep.equal([1, 2, 3, 4, 5, 6, 7, 8]);
		}
	});
});
