import { BoardCell, Score } from '../Game/Game';
import { Position, Crux } from '../Zone/Zone';
import { Color } from '../Element/Element';
import { PlayerSide } from '../Player/Player';
import { isRepeater } from '../Glyph/Glyph';

/** Points a single stone scored this chain — drives the per-stone UI badge. */
export interface FiredScore {
	row: number;
	col: number;
	points: number;
}

export interface ChainResult {
	/** Stones that fired, in resolution order. */
	firedCells: Position[];
	/** Points gained by each side this chain. */
	scoreDelta: Score;
	/** Signed Rift movement (+ toward Light, − toward Dark). */
	riftDelta: number;
	/** Per-stone point contributions (only scoring `+`/`X` stones). */
	firedScores: FiredScore[];
}

const SIZE = 6;
const DIRS: ReadonlyArray<readonly [number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const ORTHO: ReadonlyArray<readonly [number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const DIAG:  ReadonlyArray<readonly [number, number]> = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
const keyOf = (p: Position) => p.row * SIZE + p.col;

/**
 * Resolves the chain fired by inscribing on `inscribedPos`, matching `matchedColor`.
 *
 * The matched Crux fires its **cross**: the chain emanates from the Crux outward
 * along all four arms. Each arm runs cell by cell until it reaches an **opponent
 * stone** (a pure wall — it stops the arm and does not fire) or the board edge.
 * The Crux divides opposite arms — a chain never carries through it. Only the
 * initiator's own stones fire; empty cells are passed through. Owned Repeaters
 * (`↔`/`↕`) then trigger their immediate friendly neighbors, cascading through
 * further owned Repeaters. Each cell fires at most once.
 *
 * Pure: it reads the board (which must already hold the freshly-placed stone)
 * but never mutates it.
 */
export function resolveChain(
	board: BoardCell[][],
	cruxes: Crux[],
	matchedColor: Color,
	_inscribedPos: Position,
	initiator: PlayerSide,
): ChainResult {
	const empty: ChainResult = { firedCells: [], scoreDelta: { light: 0, dark: 0 }, riftDelta: 0, firedScores: [] };
	const crux = cruxes.find(c => c.color === matchedColor);
	if (!crux) return empty;
	const cruxPos = crux.position;

	const firedCells: Position[] = [];
	const seen = new Set<number>();

	const fire = (p: Position): boolean => {
		const k = keyOf(p);
		if (seen.has(k)) return false;
		seen.add(k);
		firedCells.push(p);
		return true;
	};

	// Cast one arm from the Crux outward; friendly stones fire, opponent stones
	// wall it off, empties pass through.
	const castArm = (dr: number, dc: number): void => {
		let r = cruxPos.row + dr;
		let c = cruxPos.col + dc;
		while (inBounds(r, c)) {
			const stone = board[r][c].stone;
			if (stone) {
				if (stone.owner !== initiator) break; // opponent wall: stop, no fire
				fire({ row: r, col: c });
			}
			r += dr; c += dc;
		}
	};
	for (const [dr, dc] of DIRS) castArm(dr, dc);

	// Owned Repeaters extend the fired set to their immediate friendly neighbors.
	const work = [...firedCells];
	while (work.length) {
		const p = work.pop()!;
		const stone = board[p.row][p.col].stone;
		if (!stone || !isRepeater(stone.glyph)) continue; // every fired stone is friendly
		const neighbors: Position[] = stone.glyph === '↔'
			? [{ row: p.row, col: p.col - 1 }, { row: p.row, col: p.col + 1 }]
			: [{ row: p.row - 1, col: p.col }, { row: p.row + 1, col: p.col }];
		for (const n of neighbors) {
			if (!inBounds(n.row, n.col)) continue;
			const cell = board[n.row][n.col];
			if (cell.hasCrux || !cell.stone) continue;       // crux & empties don't fire
			if (cell.stone.owner !== initiator) continue;    // opponent wall
			if (fire(n)) work.push(n);
		}
	}

	// Resolve each fired glyph for the initiator (all fired stones are friendly).
	let riftDelta = 0;
	const scoreDelta: Score = { light: 0, dark: 0 };
	const firedScores: FiredScore[] = [];
	for (const p of firedCells) {
		const stone = board[p.row][p.col].stone!;
		if (stone.glyph === '+' || stone.glyph === 'X') {
			const points = countFriendly(board, p, initiator, stone.glyph === '+' ? ORTHO : DIAG);
			if (points > 0) {
				scoreDelta[initiator] += points;
				firedScores.push({ row: p.row, col: p.col, points });
			}
		} else if (stone.glyph === '▲') {
			riftDelta += initiator === 'light' ? 1 : -1;
		}
		// ↔ ↕ have no direct score/rift effect (handled by extension above).
	}

	return { firedCells, scoreDelta, riftDelta, firedScores };
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
