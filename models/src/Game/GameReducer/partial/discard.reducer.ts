import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function discardReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Rune Inscribed':
			return {
				...state,
				discard: [...state.discard, ...event.payload.paidCards]
			};

		case 'Deck Reshuffled':
			// Discard pile becomes the new deck — clear it
			return { ...state, discard: [] };

		default:
			return state;
	}
}
