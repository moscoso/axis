import { GameEvent, RuneInscribed, SpellCast } from '../../GameEvent/GameEvent';
import { Game, BoardCell } from '../../Game';
import { Glyph, isShiftGlyph } from '../../../Glyph/Glyph';
import { Position } from '../../../Zone/Zone';
import { PlayerSide } from '../../../Player/Player';
import { shiftBoard } from '../../../Board/shiftBoard';

export function boardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, board: event.payload.board };

		case 'Rune Inscribed':
			return inscribeRune(state, event.payload);

		case 'Spell Cast':
			return castSpell(state, event.payload);

		default:
			return state;
	}
}

function inscribeRune(state: Game, payload: RuneInscribed['payload']): Game {
	const { position, rune, activations } = payload;
	const plusCount = activations.filter((g: Glyph) => g === '+').length;

	let board = cloneBoard(state.board);

	// Place the rune at the base charge; `+` symbols are resolved below.
	board[position.row][position.col] = {
		...board[position.row][position.col],
		rune: { ...rune, flux: state.options.baseRuneCharge },
	};

	// Each `+` charges every FRIENDLY rune sharing the placed rune's row or
	// column by +1 (the placed rune included, counted once). Runs before Crux
	// control is rechecked downstream in zonesReducer.
	if (plusCount > 0) chargeRowAndColumn(board, position, rune.owner, plusCount);

	if (state.options.shiftGlyphs) {
		for (const activation of activations) {
			if (isShiftGlyph(activation)) board = shiftBoard(board, activation, position);
		}
	}

	return { ...state, board };
}

function castSpell(state: Game, payload: SpellCast['payload']): Game {
	const { player, footprint, spell } = payload;
	if (spell.effect !== 'charge') return state;

	const board = cloneBoard(state.board);
	for (const pos of footprint) {
		chargeFriendlyRune(board[pos.row][pos.col], player, 1);
	}
	return { ...state, board };
}

/** +`amount` Flux to every friendly rune in `position`'s row or column (mutates `board`). */
function chargeRowAndColumn(board: BoardCell[][], position: Position, owner: PlayerSide, amount: number): void {
	for (let r = 0; r < board.length; r++) {
		for (let c = 0; c < board[r].length; c++) {
			if (r === position.row || c === position.col) chargeFriendlyRune(board[r][c], owner, amount);
		}
	}
}

/** +`amount` Flux to `cell`'s rune iff it belongs to `owner` (mutates `cell`). */
function chargeFriendlyRune(cell: BoardCell, owner: PlayerSide, amount: number): void {
	if (cell.rune?.owner === owner) cell.rune = { ...cell.rune, flux: cell.rune.flux + amount };
}

const cloneBoard = (board: BoardCell[][]): BoardCell[][] => board.map(r => r.map(cell => ({ ...cell })));
