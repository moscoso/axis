import { Game } from '../../Game/Game';
import {
	getFluxTotalForCruxLines,
	getZoneAuraScore,
} from '../../Selectors/GameSelectors';
import { PlayerSide } from '../Player';

/**
 * Weights controlling a heuristic evaluator. Exposed so they can be tuned,
 * benchmarked, and — eventually — learned.
 *
 * Rough rationale for the defaults (high → low importance):
 *   - `win` / `loss` dominate everything else: a forced win is always best.
 *   - `cruxControl` reflects Fluxmate pressure — owning all 4 Cruxes wins.
 *   - `rift` pushes the ±8 Rift Break track. (The Crux Force tax — a Rune in an
 *     opponent-controlled Zone tugs the Rift toward that owner — needs no weight
 *     of its own: lookahead simulates the inscription, the reducer moves the
 *     Rift, and this term scores the result. Holding the Crux is valued via
 *     `cruxControl`, so its deterrent threat is already priced in.)
 *   - `auraScore` rewards null runes inside a controlled Zone (the
 *     tiebreaker bonus in last-rune scoring).
 *   - `cruxFlux` rewards raw flux sitting on Crux rows/cols — precedes
 *     actually flipping control.
 *   - `handDelta` gives card economy a mild weight: more cards = more
 *     future options, but drawing too much wastes tempo.
 */
export interface EvaluationWeights {
	win: number;
	loss: number;
	cruxControl: number;
	rift: number;
	auraScore: number;
	cruxFlux: number;
	handDelta: number;
}

export const DEFAULT_WEIGHTS: EvaluationWeights = Object.freeze({
	win:         1_000_000,
	loss:        -1_000_000,
	cruxControl: 100,
	rift:        20,
	auraScore:   8,
	cruxFlux:    5,
	handDelta:   2,
});

/**
 * Scores a {@link Game} from `mySide`'s perspective. Positive is good
 * for `mySide`, negative is good for the opponent. Symmetric: swapping
 * `mySide` negates the returned score (up to rounding).
 *
 * Decomposed into independent feature terms multiplied by {@link EvaluationWeights}.
 * Features never look at opponent hand contents — only counts and public
 * board state — so the function can be used unchanged on either a full
 * {@link Game} or a simulated-lookahead state.
 */
export function evaluateState(
	state: Game,
	mySide: PlayerSide,
	weights: EvaluationWeights = DEFAULT_WEIGHTS,
): number {
	const opp: PlayerSide = mySide === 'light' ? 'dark' : 'light';

	// Terminal states short-circuit — nothing else matters.
	if (state.winner === mySide) return weights.win;
	if (state.winner === opp)    return weights.loss;

	let cruxFlux = 0;
	let cruxControl = 0;
	for (const zone of state.zones) {
		const myFlux  = getFluxTotalForCruxLines(state, zone.cruxPosition, mySide);
		const oppFlux = getFluxTotalForCruxLines(state, zone.cruxPosition, opp);
		cruxFlux += myFlux - oppFlux;

		if (zone.control === mySide) cruxControl++;
		else if (zone.control === opp) cruxControl--;
	}

	// Rift is a signed scalar: +8 = Light wins. Flip the sign for Dark.
	const riftDirection = mySide === 'light' ? 1 : -1;
	const riftTerm = state.rift * riftDirection;

	const auraTerm = getZoneAuraScore(state, mySide) - getZoneAuraScore(state, opp);

	const handDelta =
		state.players[mySide].hand.length - state.players[opp].hand.length;

	return (
		cruxControl * weights.cruxControl +
		riftTerm    * weights.rift        +
		auraTerm    * weights.auraScore   +
		cruxFlux    * weights.cruxFlux    +
		handDelta   * weights.handDelta
	);
}
