import { expect } from 'chai';
import { resolveChain } from './resolveChain';
import { BoardCell } from '../Game/Game';
import { Crux, Position } from '../Zone/Zone';
import { Color, COLORS } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';
import { PlayerSide } from '../Player/Player';

/** Builds a 6×6 board from a Crux set, deriving each cell's row/col color. */
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

/** Diagonal Cruxes: sun's cross is row 2 + column 2 (Crux at (2,2)). */
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
	board[r][c].stone = { owner, glyph, score: 0 };
}

const f1 = (p: Position) => `${p.row},${p.col}`;
const firedSet = (cells: Position[]) => new Set(cells.map(f1));
const anywhere: Position = { row: 2, col: 4 };

describe('resolveChain', () => {
	it('fires friendly stones along all four arms from the Crux', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '▲'); // right arm
		place(board, 2, 1, 'light', '▲'); // left arm
		place(board, 1, 2, 'light', '▲'); // up arm
		place(board, 4, 2, 'light', '▲'); // down arm
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.firedCells.length).to.equal(4);
		expect(r.riftDelta).to.equal(4);
	});

	it('never fires the Crux cell itself', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '▲');
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(firedSet(r.firedCells).has('2,2')).to.equal(false);
	});

	it('an opponent stone walls its arm — it does not fire and nothing beyond it does', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 3, 'dark', '▲');  // opponent wall on the right arm
		place(board, 2, 5, 'light', '▲'); // beyond it — must not fire
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		const fired = firedSet(r.firedCells);
		expect(fired.has('2,3')).to.equal(false); // opponent doesn't fire
		expect(fired.has('2,5')).to.equal(false); // walled off
		expect(r.riftDelta).to.equal(0);
	});

	it('passes through empty cells to reach a friendly stone', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 5, 'light', '▲'); // (2,3),(2,4) empty between crux and here
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(firedSet(r.firedCells).has('2,5')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('the Crux divides opposite arms — both sides fire independently', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 1, 'light', '▲'); // left
		place(board, 2, 4, 'light', '▲'); // right
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.riftDelta).to.equal(2);
	});

	it('+ Pulse scores 1 per orthogonally-adjacent friendly stone', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+'); // on the right arm, fires
		place(board, 1, 4, 'light', '▲'); // orthogonal friendly (off-cross, adjacency only)
		place(board, 3, 4, 'light', '▲'); // orthogonal friendly
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.scoreDelta.light).to.equal(2);
		expect(r.scoreDelta.dark).to.equal(0);
	});

	it('X Cross scores 1 per diagonally-adjacent friendly stone', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', 'X');
		place(board, 1, 3, 'light', '▲'); // diagonal friendly
		place(board, 3, 5, 'light', '▲'); // diagonal friendly
		place(board, 2, 5, 'light', '▲'); // orthogonal — not counted for X
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.scoreDelta.light).to.equal(2);
	});

	it('only the initiator\'s stones fire — no friendly-fire on opponent glyphs', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 1, 'dark', '▲'); // opponent on the left arm — must not push the Rift
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.riftDelta).to.equal(0);
		expect(r.firedCells.length).to.equal(0);
	});

	it('an owned ↕ Repeater triggers a friendly off-cross neighbor', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕'); // on the right arm
		place(board, 3, 4, 'light', '▲'); // column neighbor, off the sun cross
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(firedSet(r.firedCells).has('3,4')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('cascades through stacked owned Repeaters', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕'); // fires (right arm)
		place(board, 1, 4, 'light', '↕'); // up-neighbor, off cross — triggered, cascades
		place(board, 0, 4, 'light', '▲'); // reached only via the cascade
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(firedSet(r.firedCells).has('0,4')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('an opponent neighbor walls a Repeater extension', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕');
		place(board, 3, 4, 'dark', '▲'); // opponent column neighbor — must not fire
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(firedSet(r.firedCells).has('3,4')).to.equal(false);
		expect(r.riftDelta).to.equal(0);
	});

	it('fires each cell at most once', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '↕');
		place(board, 1, 4, 'light', '↕'); // mutually adjacent repeaters
		place(board, 0, 4, 'light', '+');
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		const keys = r.firedCells.map(f1);
		expect(keys.length).to.equal(new Set(keys).size);
	});

	it('attributes points to each scoring stone via firedScores', () => {
		const { board, cruxes } = sunBoard();
		place(board, 2, 4, 'light', '+'); // right arm
		place(board, 2, 5, 'light', '+'); // right arm, beyond
		// adjacency: (2,4)+ sees (2,5) friendly = 1; (2,5)+ sees (2,4) friendly = 1.
		const r = resolveChain(board, cruxes, 'sun', anywhere, 'light');
		expect(r.scoreDelta.light).to.equal(2);
		const byCell = new Map(r.firedScores.map(s => [`${s.row},${s.col}`, s.points]));
		expect(byCell.get('2,4')).to.equal(1);
		expect(byCell.get('2,5')).to.equal(1);
	});

	it('matchedColor selects which Crux fires', () => {
		const { board, cruxes } = sunBoard();
		place(board, 3, 5, 'light', '▲'); // comet cross is row 3 + col 3 → (3,5) on row-3 arm
		const r = resolveChain(board, cruxes, 'comet', anywhere, 'light');
		expect(firedSet(r.firedCells).has('3,5')).to.equal(true);
		expect(r.riftDelta).to.equal(1);
	});

	it('uses the full color palette of six', () => {
		expect(COLORS.length).to.equal(6);
	});
});
