import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function handReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Card Drawn': {
			const { player, card } = event.payload;
			return {
				...state,
				players: {
					...state.players,
					[player]: {
						...state.players[player],
						hand: [...state.players[player].hand, card]
					}
				}
			};
		}

		case 'Draft Completed': {
			const { darkCards, lightCards } = event.payload;
			return {
				...state,
				players: {
					dark:  { ...state.players.dark,  hand: [...state.players.dark.hand,  ...darkCards]  },
					light: { ...state.players.light, hand: [...state.players.light.hand, ...lightCards] }
				}
			};
		}

		case 'Rune Inscribed': {
			const { player, paidCards } = event.payload;
			const paidIds = new Set(paidCards.map(c => c.id));
			return {
				...state,
				players: {
					...state.players,
					[player]: {
						...state.players[player],
						hand: state.players[player].hand.filter(c => !paidIds.has(c.id))
					}
				}
			};
		}

		default:
			return state;
	}
}
