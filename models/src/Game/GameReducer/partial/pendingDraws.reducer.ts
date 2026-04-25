import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

/**
 * Maintains the two draw counters on {@link Game}:
 *
 *   - `pendingDraws`             — ◇ activation draws queued by Rune Inscribed.
 *   - `pendingStartOfTurnDraws`  — free draws granted at turn start, governed
 *                                  by `options.startOfTurnDraws`.
 *
 * `Card Drawn` decrements the start-of-turn counter first (resolve freebies
 * before activation draws); when that's exhausted it falls through to the
 * ◇ counter. The "end the turn when the last queued draw resolves" logic
 * lives in DrawCard itself — this reducer is only bookkeeping.
 *
 * Also snapshots `game.options` from the Game Started payload so every
 * command can read the active rules straight off state.
 */
export function pendingDrawsReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started': {
			const options = event.payload.options;
			return {
				...state,
				options,
				pendingStartOfTurnDraws: options.startOfTurnDraws,
				pendingDraws: 0,
			};
		}

		case 'Turn Ended': {
			return {
				...state,
				pendingStartOfTurnDraws: state.options.startOfTurnDraws,
				pendingDraws: 0,
			};
		}

		case 'Rune Inscribed': {
			const drawCount = event.payload.activations.filter(g => g === '◇').length;
			return { ...state, pendingDraws: drawCount };
		}

		case 'Card Drawn': {
			if (state.pendingStartOfTurnDraws > 0) {
				return {
					...state,
					pendingStartOfTurnDraws: state.pendingStartOfTurnDraws - 1,
				};
			}
			return { ...state, pendingDraws: Math.max(0, state.pendingDraws - 1) };
		}

		default:
			return state;
	}
}
