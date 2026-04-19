import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function playerIdsReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return {
				...state,
				playerIds: {
					light: event.payload.lightPlayer,
					dark:  event.payload.darkPlayer,
				},
			};

		default:
			return state;
	}
}
