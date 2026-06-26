import { Color } from '../Element/Element';
import { PlayerSide } from '../Player/Player';
import { Position, Crux } from '../Zone/Zone';
import { BoardCell, Game } from '../Game/Game';
import { Die } from '../Die/Die';

/**
 * True when every inscribable cell holds a stone. Crux cells count as "filled"
 * because they can never be inscribed (`IS_CELL_EMPTY` rejects them). Used by
 * the winner reducer to declare End Score the moment the board is finished.
 */
export function isBoardFull(state: Game): boolean {
	return state.board.every(row => row.every(cell => cell.hasCrux || cell.stone !== null));
}

/** `player`'s score minus the opponent's — positive means `player` leads. */
export function scoreLead(state: Game, player: PlayerSide): number {
	const opp: PlayerSide = player === 'light' ? 'dark' : 'light';
	return state.score[player] - state.score[opp];
}

/** The two colors of a cell — its row color and its column color. */
export function cellColors(cell: BoardCell): [Color, Color] {
	return [cell.rowColor, cell.colColor];
}

/** The die of a given color from the pool, or undefined. */
export function getDie(state: Game, color: Color): Die | undefined {
	return state.dice.find(d => d.color === color);
}

/** The Crux of a given color. */
export function getCrux(state: Game, color: Color): Crux | undefined {
	return state.cruxes.find(c => c.color === color);
}

/**
 * The cells of a Crux's cross — its full row plus full column — excluding the
 * Crux cell itself. (Geometric cross; not chain-aware — see resolveChain for
 * what actually fires.)
 */
export function getCrossCells(state: Game, color: Color): Position[] {
	const crux = getCrux(state, color);
	if (!crux) return [];
	const { row, col } = crux.position;
	const cells: Position[] = [];
	for (let c = 0; c < 6; c++) if (c !== col) cells.push({ row, col: c });
	for (let r = 0; r < 6; r++) if (r !== row) cells.push({ row: r, col });
	return cells;
}

/** Every empty, inscribable (non-Crux) cell. */
export function getEmptyCells(state: Game): Position[] {
	const out: Position[] = [];
	for (const row of state.board) {
		for (const cell of row) {
			if (!cell.hasCrux && cell.stone === null) out.push(cell.position);
		}
	}
	return out;
}

/**
 * Fast predicate: does `player` have at least one legal move? In the dice game
 * every empty non-Crux cell is always playable (both of its color dice are
 * always in the pool), so this reduces to "is it your main turn and is the
 * board not full".
 */
export function hasAnyLegalMove(state: Game, player: PlayerSide): boolean {
	if (state.phase !== 'main-turn') return false;
	if (state.winner !== null) return false;
	if (state.currentTurn !== player) return false;
	return !isBoardFull(state);
}
