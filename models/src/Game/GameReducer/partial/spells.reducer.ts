import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

/** Maintains the three Spell piles: deck, display, and discard. */
export function spellsReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return {
				...state,
				spellDeck: event.payload.spellDeck,
				spellDisplay: event.payload.spellDisplay,
				spellDiscard: [],
			};

		case 'Spell Cast': {
			// The cast Spell leaves the display for the discard.
			const { spell } = event.payload;
			return {
				...state,
				spellDisplay: state.spellDisplay.filter(s => s.id !== spell.id),
				spellDiscard: [...state.spellDiscard, spell],
			};
		}

		case 'Spell Display Refilled':
			// Top Spell of the deck moves onto the display.
			return {
				...state,
				spellDeck: state.spellDeck.slice(1),
				spellDisplay: [...state.spellDisplay, event.payload.spell],
			};

		case 'Spell Deck Reshuffled':
			return { ...state, spellDeck: event.payload.newDeck, spellDiscard: [] };

		default:
			return state;
	}
}
