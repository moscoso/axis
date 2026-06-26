import { Game } from '../../Game/Game';
import { scoreLead } from '../../Selectors/GameSelectors';
import { PlayerSide } from '../Player';

/**
 * Weights for the stub heuristic evaluator. Deliberately minimal — the dice
 * rewrite ships a legal-move-capable bot; real tuning (chain potential, Rift
 * tempo, denial) is deferred.
 *
 *   - `win` / `loss` dominate: a decided game outranks everything.
 *   - `score` is the End-Score lead (the main win track).
 *   - `rift` values progress toward the ±6 Rift Break.
 */
export interface EvaluationWeights {
	win: number;
	loss: number;
	score: number;
	rift: number;
}

export const DEFAULT_WEIGHTS: EvaluationWeights = Object.freeze({
	win:   1_000_000,
	loss:  -1_000_000,
	score: 10,
	rift:  6,
});

/**
 * Scores a {@link Game} from `mySide`'s perspective. Positive is good for
 * `mySide`. Symmetric: swapping `mySide` negates the score.
 */
export function evaluateState(
	state: Game,
	mySide: PlayerSide,
	weights: EvaluationWeights = DEFAULT_WEIGHTS,
): number {
	const opp: PlayerSide = mySide === 'light' ? 'dark' : 'light';

	if (state.winner === mySide) return weights.win;
	if (state.winner === opp)    return weights.loss;

	const riftDirection = mySide === 'light' ? 1 : -1;
	const riftTerm = state.rift * riftDirection;

	return scoreLead(state, mySide) * weights.score + riftTerm * weights.rift;
}
