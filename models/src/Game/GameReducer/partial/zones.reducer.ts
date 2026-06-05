import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { recomputeZones } from '../../../Selectors/GameSelectors';

export function zonesReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, zones: event.payload.zones };

		case 'Rune Inscribed':
		case 'Spell Cast':
			// Crux control is recalculated from the board after board.reducer has run
			// (both inscribing and charging can change the Flux on a Crux's lines).
			return { ...state, zones: recomputeZones(state) };
		default:
			return state;
	}
}
