import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function deckReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, deck: event.payload.deck };

		case 'Draft Completed':
			// The 2 fresh display cards came from the top of the deck
			return { ...state, deck: state.deck.slice(2) };

		case 'Card Drawn':
			if (event.payload.from !== 'deck') return state;
			return { ...state, deck: state.deck.slice(1) };

		case 'Display Refilled':
			// The top card of the deck moved to the display
			return { ...state, deck: state.deck.slice(1) };

		case 'Deck Reshuffled':
			return { ...state, deck: event.payload.newDeck };

		default:
			return state;
	}
}
