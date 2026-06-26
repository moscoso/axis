import { GameEvent } from '../../GameEvent/GameEvent';
import { Game, RIFT_TERMINAL } from '../../Game';

export function riftReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Glyph Inscribed': {
			const delta = event.payload.riftDelta;
			return delta === 0 ? state : { ...state, rift: clampRift(state.rift + delta) };
		}

		default:
			return state;
	}
}

/** Keep the Rift inside its ±RIFT_TERMINAL Rift-Break bounds. */
const clampRift = (value: number): number => Math.max(-RIFT_TERMINAL, Math.min(RIFT_TERMINAL, value));
