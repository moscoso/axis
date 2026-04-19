import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { PlayerSide } from '../../../Player/Player';
import { getFinalScore, isBoardFull } from '../../../Selectors/GameSelectors';

export function winnerReducer(event: GameEvent, state: Game): Game {

	switch (event.type) {
		case 'Rune Inscribed': {
			// 1. Rift Break — evaluated after rift.reducer has already clamped the value
			if (state.rift >= 8)  return declareWinner(state, 'light', 'rift-break');
			if (state.rift <= -8) return declareWinner(state, 'dark',  'rift-break');

			// 2. Fluxmate — all four Cruxes controlled by the same player
			// (zones.reducer has already recomputed control before this reducer runs)
			const lightCruxes = state.zones.filter(z => z.control === 'light').length;
			const darkCruxes  = state.zones.filter(z => z.control === 'dark').length;
			if (lightCruxes === 4) return declareWinner(state, 'light', 'fluxmate');
			if (darkCruxes  === 4) return declareWinner(state, 'dark',  'fluxmate');

			// 3. Last Rune — board is full
			if (isBoardFull(state)) {
				const lightScore = getFinalScore(state, 'light');
				const darkScore  = getFinalScore(state, 'dark');
				const lightWon = lightScore > darkScore;
				const darkWon = darkScore > lightScore;
				let winner: PlayerSide | null = null; // tie results in null winner
				if (lightWon) {
					winner = 'light';
				} else if (darkWon) {
					winner = 'dark';
				};
				return { ...state, winner, winReason: 'last-rune', phase: 'game-over' };
			}

			return state;
		}

		default:
			return state;
	}
}

function declareWinner(state: Game, winner: PlayerSide, reason: 'rift-break' | 'fluxmate'): Game {
	return { ...state, winner, winReason: reason, phase: 'game-over' };
}
