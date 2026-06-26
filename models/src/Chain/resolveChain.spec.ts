import { expect } from 'chai';
import { resolveChain } from './resolveChain';
import { BoardCell, Stone } from '../Game/Game';
import { Crux, Position } from '../Zone/Zone';
import { Color, COLORS } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';
import { PlayerSide } from '../Player/Player';

/**
 * Builds a 6×6 board from a Crux set, deriving each cell's row/col color exactly
 * as generateBoard does. Cruxes must cover all six rows and columns.
 */
function boardFromCruxes(cruxes: Crux[]): BoardCell[][] {
	const rowColor: Color[] = new Array(6);
	const colColor: Color[] = new Array(6);
	for (const c of cruxes) {
		rowColor[c.position.row] = c.color;
		colColor[c.position.col] = c.color;
	}
	return Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col): BoardCell => {
			const hasCrux = rowColor[row] === colColor[col];
			return {
				position: { row, col },
				rowColor: rowColor[row],
				colColor: colColor[col],
				stone: null,
				hasCrux,
				cruxColor: hasCrux ? rowColor[row] : null,
			};
		})
	);
}

/** Sun-centred layout: sun's cross is row 2 + column 2; other Cruxes on a diagonal. */
function sunBoard(): { board: BoardCell[][]; cruxes: Crux[] } {
	const cruxes: Crux[] = [
		{ color: 'moon',   position: { row: 0, col: 0 } },
		{ color: 'star',   position: { row: 1, col: 1 } },
		{ color: 'sun',    position: { row: 2, col: 2 } },
		{ color: 'comet',  position: { row: 3, col: 3 } },
		{ color: 'planet', position: { row: 4, col: 4 } },
		{ color: 'spiral', position: { row: 5, col: 5 } },
	];
	return { board: boardFromCruxes(cruxes), cruxes };
}

function place(board: BoardCell[][], r: number, c: number, owner: PlayerSide, glyph: Glyph): void {
	board[r][c].stone = { owner, glyph };
}

const f1 = (p: Position) => `${p.row},${p.col}`;
const firedSet = (cells: Position[]) => new Set(cells.map(f1));

describe('resolveChain', () => {
	it('confirms the board fixture: sun owns row 2 and column 2', () => {
		const { board } = sunBoard();
		expect(board[2][4].rowColor).to.equal('sun');
		expect(board[4][2].colColor).to.equal('sun');
		expect(board[2][2].hasCrux).to.equal(true);
	});

	it('+ Pulse scores 1 per orthogonally-adjacent friendly stone', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');     // inscribed cell (row-2 line)
		place(board, 2, 5, 'light', '■');     // orthogonal friendly
		place(board, 1, 4, 'light', '■');     // orthogonal friendly (off-cross, not fired)
		place(board, 3, 4, 'dark',  '■');     // orthogonal enemy — not counted
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(r.scoreDelta.light).to.equal(2);
		expect(r.scoreDelta.dark).to.equal(0);
	});

	it('X Cross scores 1 per diagonally-adjacent friendly stone', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', 'X');
		place(board, 1, 3, 'light', '■'); // diagonal friendly
		place(board, 3, 5, 'light', '■'); // diagonal friendly
		place(board, 2, 5, 'light', '■'); // orthogonal — not counted for X
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(r.scoreDelta.light).to.equal(2);
	});

	it('▲ Drift pushes the Rift toward its own owner regardless of initiator', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');     // inscribed, scores 0
		place(board, 2, 0, 'dark', '▲');      // far row arm, beyond the crux — fires for dark
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		// Light initiated, but the dark ▲ still pulls toward dark.
		expect(r.riftDelta).to.equal(-1);
	});

	it('fires the perpendicular arm through the Crux junction (bend)', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		place(board, 5, 2, 'light', '▲'); // column-2 arm, reached only by bending at the crux
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('5,2')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('continues straight through the Crux to the far arm (plus, not L)', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		place(board, 2, 0, 'light', '▲'); // far side of the row, beyond the crux
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('2,0')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('the Crux cell itself never fires', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('2,2')).to.equal(false);
	});

	it('stops at an enemy ■, leaving cells beyond it unfired', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		place(board, 2, 3, 'dark',  '■'); // enemy block between inscribe and crux
		place(board, 2, 1, 'light', '▲'); // beyond the block — must NOT fire
		place(board, 5, 2, 'light', '▲'); // column arm — blocked too (crux unreachable)
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		const fired = firedSet(r.firedCells);
		expect(fired.has('2,3')).to.equal(true);  // the block itself is reached
		expect(fired.has('2,1')).to.equal(false);
		expect(fired.has('5,2')).to.equal(false);
		expect(r.riftDelta).to.equal(0);
	});

	it('passes through a friendly ■ without stopping', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		place(board, 2, 3, 'light', '■'); // friendly block — transparent to own chain
		place(board, 2, 0, 'light', '▲'); // beyond it AND the crux — should fire
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('2,0')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('passes through empty cells silently and still fires glyphs beyond them', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		// (2,5) is empty; nothing to fire that way. The crux side has a ▲ far out.
		place(board, 0, 2, 'light', '▲'); // top of column arm, several empties away
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('0,2')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('an owned ↔ Repeater triggers its row neighbors (even off the cross)', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↔'); // inscribed Repeater on the cross
		place(board, 2, 5, 'light', '▲'); // row neighbor (also on cross) — fires anyway
		place(board, 1, 4, 'light', '▲'); // NOT a row neighbor of (2,4); off-cross — stays unfired
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('2,5')).to.equal(true);
		expect(firedSet(r.firedCells).has('1,4')).to.equal(false);
	});

	it('an owned ↕ Repeater reaches an off-cross neighbor', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕'); // column repeater on the cross
		place(board, 3, 4, 'light', '▲'); // column neighbor, off the sun cross
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('3,4')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('cascades through stacked owned Repeaters', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕'); // inscribed col-repeater
		place(board, 1, 4, 'light', '↕'); // stacked col-repeater (off cross) — triggered, cascades
		place(board, 0, 4, 'light', '▲'); // reached only via the cascade
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		expect(firedSet(r.firedCells).has('0,4')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('an opponent Repeater fires but does not extend the chain', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+');
		place(board, 2, 5, 'dark', '↕'); // enemy col-repeater on the cross — fires, no extension
		place(board, 1, 5, 'light', '▲'); // (2,5)'s column neighbor, off-cross — must stay unfired
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		const fired = firedSet(r.firedCells);
		expect(fired.has('2,5')).to.equal(true);  // enemy repeater itself fires (on the cross)
		expect(fired.has('1,5')).to.equal(false); // but it does not extend
		expect(r.riftDelta).to.equal(0);
	});

	it('fires each cell at most once (no double counting)', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↔');
		place(board, 2, 3, 'light', '↔'); // mutually-adjacent repeaters
		place(board, 2, 1, 'light', '+');
		place(board, 2, 0, 'light', '+');
		const r = resolveChain(board, cruxes, 'sun', { row: 2, col: 4 }, 'light');
		const keys = r.firedCells.map(f1);
		expect(keys.length).to.equal(new Set(keys).size);
	});

	it('resolves a chain entered via the column color (column line)', () => {
		const { board, cruxes } = sunBoard();
		place(board, 4, 2, 'light', '+'); // (4,2).colColor === 'sun' → enters on the column
		place(board, 2, 5, 'light', '▲'); // row arm, reached by bending at the crux
		const r = resolveChain(board, cruxes, 'sun', { row: 4, col: 2 }, 'light');
		expect(firedSet(r.firedCells).has('2,5')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('uses the full color palette of six', () => {
		expect(COLORS.length).to.equal(6);
	});
});
