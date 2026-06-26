import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function diceReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return {
				...state,
				dice: event.payload.dice,
				rngSeed: event.payload.rngSeed,
				rngCursor: event.payload.rngCursor,
			};

		case 'Dice Rerolled':
			return { ...state, dice: event.payload.dice, rngCursor: event.payload.rngCursor };

		default:
			return state;
	}
}
