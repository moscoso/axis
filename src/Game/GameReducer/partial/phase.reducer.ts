import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function phaseReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, phase: 'starting-draft' };

		case 'Draft Completed':
			return { ...state, phase: 'main-turn' };

		case 'Game Ended':
			return { ...state, phase: 'game-over' };

		default:
			return state;
	}
}
