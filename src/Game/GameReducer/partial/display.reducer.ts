import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function displayReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, display: event.payload.display };

		case 'Draft Completed':
			// Replace the 4-card draft display with 2 fresh cards from the deck
			return { ...state, display: event.payload.displayCards };

		case 'Card Drawn':
			if (event.payload.from !== 'display') return state;
			return {
				...state,
				display: state.display.filter(c => c.id !== event.payload.card.id)
			};

		case 'Display Refilled':
			return { ...state, display: [...state.display, event.payload.card] };

		default:
			return state;
	}
}
