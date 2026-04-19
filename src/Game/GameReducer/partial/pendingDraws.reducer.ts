import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function pendingDrawsReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Rune Inscribed': {
			const drawCount = event.payload.activations.filter(g => g === '◇').length;
			return { ...state, pendingDraws: drawCount };
		}

		case 'Card Drawn': {
			return { ...state, pendingDraws: Math.max(0, state.pendingDraws - 1) };
		}

		default:
			return state;
	}
}
