import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph } from '../../../Glyph/Glyph';

export function boardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, board: event.payload.board };

		case 'Rune Inscribed': {
			const { position, rune, activations } = event.payload;
			const fluxCount = activations.filter((g: Glyph) => g === '+').length;
			const board = state.board.map(r => r.map(cell => ({ ...cell })));
			board[position.row][position.col] = {
				...board[position.row][position.col],
				rune: { ...rune, flux: fluxCount }
			};
			return { ...state, board };
		}
		default:
			return state;
	}
}
