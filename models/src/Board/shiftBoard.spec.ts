import { expect } from 'chai';
import { shiftBoard } from './shiftBoard';
import { BoardCell } from '../Game/Game';
import { Glyph } from '../Glyph/Glyph';
import { PlayerSide } from '../Player/Player';

type CellSpec = { glyphs?: Glyph[]; rune?: PlayerSide; crux?: boolean };

function makeBoard(layout: CellSpec[][]): BoardCell[][] {
	return layout.map((row, r) =>
		row.map((cell, c): BoardCell => ({
			position: { row: r, col: c },
			zoneId: '',
			glyphs: cell.glyphs ?? [],
			rune: cell.rune ? { owner: cell.rune, flux: 0 } : null,
			hasCrux: cell.crux ?? false,
		}))
	);
}

function emptyRow(): CellSpec[] {
	return Array.from({ length: 6 }, () => ({}));
}

function emptyBoard(): CellSpec[][] {
	return Array.from({ length: 6 }, () => emptyRow());
}

describe('shiftBoard — row/column rotation with wraparound', () => {
	it("'←' rotates the anchor's row left, wrapping the leftmost cell to the rightmost", () => {
		const layout = emptyBoard();
		layout[2][0] = { glyphs: ['+'] };
		layout[2][1] = { glyphs: ['▲'] };
		layout[2][5] = { glyphs: ['◇'] };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '←', { row: 2, col: 3 });

		expect(next[2][0].glyphs).to.deep.equal(['▲']); // (2,1) → (2,0)
		expect(next[2][4].glyphs).to.deep.equal(['◇']); // (2,5) → (2,4)
		expect(next[2][5].glyphs).to.deep.equal(['+']); // (2,0) wraps to (2,5)
	});

	it("'→' rotates the anchor's row right, wrapping the rightmost cell to the leftmost", () => {
		const layout = emptyBoard();
		layout[1][0] = { glyphs: ['+'] };
		layout[1][5] = { glyphs: ['▲'] };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '→', { row: 1, col: 0 });

		expect(next[1][1].glyphs).to.deep.equal(['+']); // (1,0) → (1,1)
		expect(next[1][0].glyphs).to.deep.equal(['▲']); // (1,5) wraps to (1,0)
	});

	it("'↑' rotates the anchor's column up, wrapping the top cell to the bottom", () => {
		const layout = emptyBoard();
		layout[0][3] = { glyphs: ['+'] };
		layout[1][3] = { glyphs: ['▲'] };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '↑', { row: 4, col: 3 });

		expect(next[0][3].glyphs).to.deep.equal(['▲']); // (1,3) → (0,3)
		expect(next[5][3].glyphs).to.deep.equal(['+']); // (0,3) wraps to (5,3)
	});

	it("'↓' rotates the anchor's column down, wrapping the bottom cell to the top", () => {
		const layout = emptyBoard();
		layout[5][2] = { glyphs: ['◇'] };
		layout[4][2] = { glyphs: ['▲'] };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '↓', { row: 0, col: 2 });

		expect(next[0][2].glyphs).to.deep.equal(['◇']); // (5,2) wraps to (0,2)
		expect(next[5][2].glyphs).to.deep.equal(['▲']); // (4,2) → (5,2)
	});

	it('moves runes and Crux flags along with glyphs', () => {
		const layout = emptyBoard();
		layout[3][0] = { rune: 'light' };
		layout[3][2] = { crux: true };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '→', { row: 3, col: 0 });

		expect(next[3][1].rune?.owner).to.equal('light');
		expect(next[3][3].hasCrux).to.equal(true);
		expect(next[3][0].rune).to.equal(null);
		expect(next[3][2].hasCrux).to.equal(false);
	});

	it("preserves each cell's position and zoneId after a shift", () => {
		const layout: CellSpec[][] = Array.from({ length: 6 }, () => emptyRow());
		layout[0][0] = { glyphs: ['+'] };
		const board = makeBoard(layout);
		// Stamp identifiable zoneIds tied to grid coordinates.
		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 6; c++) board[r][c].zoneId = `${r},${c}`;
		}

		const next = shiftBoard(board, '↓', { row: 0, col: 0 });

		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 6; c++) {
				expect(next[r][c].position).to.deep.equal({ row: r, col: c });
				expect(next[r][c].zoneId).to.equal(`${r},${c}`);
			}
		}
	});

	it('does not mutate the input board', () => {
		const layout = emptyBoard();
		layout[2][0] = { glyphs: ['+'] };
		const board = makeBoard(layout);

		shiftBoard(board, '←', { row: 2, col: 0 });

		expect(board[2][0].glyphs).to.deep.equal(['+']);
		expect(board[2][5].glyphs).to.deep.equal([]);
	});

	it('leaves cells outside the anchor row/column untouched', () => {
		const layout = emptyBoard();
		layout[0][0] = { glyphs: ['+'] };
		layout[3][3] = { glyphs: ['▲'] };
		const board = makeBoard(layout);

		const next = shiftBoard(board, '←', { row: 0, col: 0 });

		expect(next[3][3].glyphs).to.deep.equal(['▲']); // unaffected row
	});
});
