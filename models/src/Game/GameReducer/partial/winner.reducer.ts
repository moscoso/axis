import { GameEvent } from '../../GameEvent/GameEvent';
import { Game, RIFT_TERMINAL } from '../../Game';
import { PlayerSide } from '../../../Player/Player';
import { isBoardFull } from '../../../Selectors/GameSelectors';

export function winnerReducer(event: GameEvent, state: Game): Game {
	if (state.winner !== null || state.phase === 'game-over') return state;

	switch (event.type) {
		case 'Glyph Inscribed': {
			// 1. Rift Break — read after rift.reducer has clamped the value.
			if (state.rift >= RIFT_TERMINAL)  return end(state, 'light', 'rift-break');
			if (state.rift <= -RIFT_TERMINAL) return end(state, 'dark',  'rift-break');

			// 2. End Score — the board's 30 non-Crux cells are full.
			if (isBoardFull(state)) {
				const { light, dark } = state.score;
				const winner: PlayerSide | null = light === dark ? null : light > dark ? 'light' : 'dark';
				return { ...state, winner, winReason: 'end-score', phase: 'game-over' };
			}

			return state;
		}

		default:
			return state;
	}
}

function end(state: Game, winner: PlayerSide, reason: 'rift-break' | 'end-score'): Game {
	return { ...state, winner, winReason: reason, phase: 'game-over' };
}
