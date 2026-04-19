import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { recomputeZones } from '../../../Selectors/GameSelectors';

export function zonesReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, zones: event.payload.zones };

		case 'Rune Inscribed':
			// Crux control is recalculated using the board state after board.reducer has run
			return { ...state, zones: recomputeZones(state) };
		default:
			return state;
	}
}
