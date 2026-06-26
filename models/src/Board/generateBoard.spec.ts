import { expect } from 'chai';
import { generateBoard } from './generateBoard';
import { COLORS } from '../Element/Element';

describe('generateBoard', () => {
	it('places six Cruxes, one per color', () => {
		const { cruxes } = generateBoard();
		expect(cruxes.length).to.equal(6);
		expect(new Set(cruxes.map(c => c.color)).size).to.equal(6);
		for (const color of COLORS) {
			expect(cruxes.some(c => c.color === color)).to.equal(true);
		}
	});

	it('obeys Crux Exclusivity — distinct rows and distinct columns', () => {
		const { cruxes } = generateBoard();
		expect(new Set(cruxes.map(c => c.position.row)).size).to.equal(6);
		expect(new Set(cruxes.map(c => c.position.col)).size).to.equal(6);
	});

	it('marks exactly six Crux cells, each on its own color', () => {
		const { board, cruxes } = generateBoard();
		const cruxCells = board.flat().filter(c => c.hasCrux);
		expect(cruxCells.length).to.equal(6);
		for (const crux of cruxes) {
			const cell = board[crux.position.row][crux.position.col];
			expect(cell.hasCrux).to.equal(true);
			expect(cell.cruxColor).to.equal(crux.color);
			expect(cell.rowColor).to.equal(crux.color);
			expect(cell.colColor).to.equal(crux.color);
		}
	});

	it('gives every non-Crux cell two DISTINCT colors and no stone', () => {
		const { board } = generateBoard();
		for (const row of board) {
			for (const cell of row) {
				if (cell.hasCrux) continue;
				expect(cell.rowColor).to.not.equal(cell.colColor);
				expect(cell.stone).to.equal(null);
				expect(cell.cruxColor).to.equal(null);
			}
		}
	});

	it('derives a cell\'s colors from its row-Crux and column-Crux', () => {
		const { board, cruxes } = generateBoard();
		const byRow = new Map(cruxes.map(c => [c.position.row, c.color]));
		const byCol = new Map(cruxes.map(c => [c.position.col, c.color]));
		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 6; c++) {
				expect(board[r][c].rowColor).to.equal(byRow.get(r));
				expect(board[r][c].colColor).to.equal(byCol.get(c));
			}
		}
	});

	it('leaves 30 inscribable cells (36 − 6 Cruxes)', () => {
		const { board } = generateBoard();
		const inscribable = board.flat().filter(c => !c.hasCrux);
		expect(inscribable.length).to.equal(30);
	});
});
