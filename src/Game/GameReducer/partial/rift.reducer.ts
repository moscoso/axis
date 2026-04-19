import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph } from '../../../Glyph/Glyph';

export function riftReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Rune Inscribed': {
			const { player, activations } = event.payload;
			const forceCount = activations.filter((a: Glyph) => a === '▲').length;
			if (forceCount === 0) return state;
			const delta = player === 'light' ? forceCount : -forceCount;
			const newRift = Math.max(-8, Math.min(8, state.rift + delta));
			return { ...state, rift: newRift };
		}
		default:
			return state;
	}
}
