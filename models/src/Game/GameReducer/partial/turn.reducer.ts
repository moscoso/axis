import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function turnReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, currentTurn: 'dark' }; // Dark picks first in the draft

		case 'Draft Completed':
			return { ...state, currentTurn: 'light' }; // Light goes first in the main phase

		case 'Turn Ended':
			return {
				...state,
				currentTurn: state.currentTurn === 'light' ? 'dark' : 'light'
			};
		default:
			return state;
	}
}
