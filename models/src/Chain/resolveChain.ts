import { BoardCell, Score } from '../Game/Game';
import { Position, Crux } from '../Zone/Zone';
import { Color } from '../Element/Element';
import { PlayerSide } from '../Player/Player';
import { isRepeater } from '../Glyph/Glyph';

export interface ChainResult {
	/** Stoned cells that fired, in resolution order (placed cell first). */
	firedCells: Position[];
	/** Points gained by each side this chain. */
	scoreDelta: Score;
	/** Signed Rift movement (+ toward Light, − toward Dark). */
	riftDelta: number;
}

const SIZE = 6;
const ORTHO: ReadonlyArray<readonly [number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG:  ReadonlyArray<readonly [number, number]> = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const keyOf = (p: Position) => p.row * SIZE + p.col;

/**
 * Resolves the chain fired by inscribing on `inscribedPos`, matching `matchedColor`.
 *
 * The board passed in must already hold the freshly-placed stone. The chain
 * fires the matched Crux's **cross** (its full row + column): rays travel out
 * from the placed cell along the cross, the Crux is a pass-through junction
 * (it never fires — the chain continues straight through it *and* turns into the
 * perpendicular arm), and a ray stops when it reaches an enemy `■`, the board
 * edge, or the arm end. Owned Repeaters (`↔`/`↕`) then trigger their immediate
 * neighbors, cascading through further owned Repeaters. Each cell fires at most
 * once. Empty cells are passed through silently.
 *
 * Pure: it reads the board but never mutates it.
 */
export function resolveChain(
	board: BoardCell[][],
	cruxes: Crux[],
	matchedColor: Color,
	inscribedPos: Position,
	initiator: PlayerSide,
): ChainResult {
	const crux = cruxes.find(c => c.color === matchedColor);
	if (!crux) return { firedCells: [], scoreDelta: { light: 0, dark: 0 }, riftDelta: 0 };
	const cruxPos = crux.position;

	const firedCells: Position[] = [];
	const seen = new Set<number>();

	/** Adds a stoned cell to the fired set once. Returns true if newly added. */
	const fire = (p: Position): boolean => {
		const k = keyOf(p);
		if (seen.has(k)) return false;
		seen.add(k);
		firedCells.push(p);
		return true;
	};

	const isEnemyBlock = (cell: BoardCell): boolean =>
		cell.stone?.glyph === '■' && cell.stone.owner !== initiator;

	/**
	 * Casts a ray from `from` (exclusive) stepping by (dr,dc) along a cross line.
	 * Reaching the Crux branches into both perpendicular directions and then the
	 * ray continues straight through.
	 */
	const cast = (from: Position, dr: number, dc: number): void => {
		let r = from.row + dr;
		let c = from.col + dc;
		while (inBounds(r, c)) {
			const cell = board[r][c];
			if (cell.hasCrux) {
				cast(cruxPos, dc, dr);   // perpendicular arm, one way
				cast(cruxPos, -dc, -dr); // perpendicular arm, the other
				r += dr; c += dc;        // continue straight past the junction
				continue;
			}
			if (cell.stone) {
				fire({ row: r, col: c });
				if (isEnemyBlock(cell)) break; // reached an enemy Block: stop beyond it
			}
			r += dr; c += dc;
		}
	};

	// The placed cell fires first, then rays travel out along its cross line.
	fire(inscribedPos);
	if (inscribedPos.row === cruxPos.row) {
		cast(inscribedPos, 0, 1);
		cast(inscribedPos, 0, -1);
	} else {
		cast(inscribedPos, 1, 0);
		cast(inscribedPos, -1, 0);
	}

	// Owned Repeaters extend the fired set to their immediate neighbors, cascading.
	const work = [...firedCells];
	while (work.length) {
		const p = work.pop()!;
		const stone = board[p.row][p.col].stone;
		if (!stone || stone.owner !== initiator || !isRepeater(stone.glyph)) continue;
		const neighbors: Position[] = stone.glyph === '↔'
			? [{ row: p.row, col: p.col - 1 }, { row: p.row, col: p.col + 1 }]
			: [{ row: p.row - 1, col: p.col }, { row: p.row + 1, col: p.col }];
		for (const n of neighbors) {
			if (!inBounds(n.row, n.col)) continue;
			const cell = board[n.row][n.col];
			if (cell.hasCrux || !cell.stone) continue; // crux & empties don't fire
			if (fire(n)) work.push(n);
		}
	}

	// Resolve each fired glyph for its own owner, in fire order.
	let riftDelta = 0;
	const scoreDelta: Score = { light: 0, dark: 0 };
	for (const p of firedCells) {
		const stone = board[p.row][p.col].stone!;
		switch (stone.glyph) {
			case '+': scoreDelta[stone.owner] += countFriendly(board, p, stone.owner, ORTHO); break;
			case 'X': scoreDelta[stone.owner] += countFriendly(board, p, stone.owner, DIAG); break;
			case '▲': riftDelta += stone.owner === 'light' ? 1 : -1; break;
			// ↔ ↕ ■ have no direct score/rift effect.
		}
	}

	return { firedCells, scoreDelta, riftDelta };
}

/** Counts stones owned by `owner` in the given directions around `p`. */
function countFriendly(
	board: BoardCell[][],
	p: Position,
	owner: PlayerSide,
	dirs: ReadonlyArray<readonly [number, number]>,
): number {
	let count = 0;
	for (const [dr, dc] of dirs) {
		const r = p.row + dr;
		const c = p.col + dc;
		if (inBounds(r, c) && board[r][c].stone?.owner === owner) count++;
	}
	return count;
}
