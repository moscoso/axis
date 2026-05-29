import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph, isShiftGlyph } from '../../../Glyph/Glyph';
import { shiftBoard } from '../../../Board/shiftBoard';

export function boardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, board: event.payload.board };

		case 'Rune Inscribed': {
			const { position, rune, activations } = event.payload;
			const fluxCount = activations.filter((g: Glyph) => g === '+').length;

			let board = state.board.map(r => r.map(cell => ({ ...cell })));
			board[position.row][position.col] = {
				...board[position.row][position.col],
				rune: { ...rune, flux: fluxCount }
			};

			if (state.options.shiftGlyphs) {
				for (const activation of activations) {
					if (isShiftGlyph(activation)) {
						board = shiftBoard(board, activation, position);
					}
				}
			}

			return { ...state, board };
		}
		default:
			return state;
	}
}
