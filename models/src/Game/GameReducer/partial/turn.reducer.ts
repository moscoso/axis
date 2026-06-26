import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function turnReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, currentTurn: 'light' }; // Light moves first

		case 'Turn Ended':
			return {
				...state,
				currentTurn: state.currentTurn === 'light' ? 'dark' : 'light',
			};

		default:
			return state;
	}
}
