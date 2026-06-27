import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function boardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, board: event.payload.board, cruxes: event.payload.cruxes };

		case 'Glyph Inscribed': {
			const { position, player, glyph, firedScores } = event.payload;
			const board = state.board.map(row => row.map(cell => ({ ...cell })));
			board[position.row][position.col] = {
				...board[position.row][position.col],
				stone: { owner: player, glyph, score: 0 },
			};
			// Credit each scoring stone its points this chain (UI tally).
			for (const fs of firedScores) {
				const stone = board[fs.row][fs.col].stone;
				if (stone) stone.score += fs.points;
			}
			return { ...state, board };
		}

		default:
			return state;
	}
}
