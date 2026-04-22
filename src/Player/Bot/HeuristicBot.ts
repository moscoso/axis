import { simulateGameCommand } from '../../Game/simulateCommand';
import { Game } from '../../Game/Game';
import { GameCommand } from '../../Game/GameCommand/GameCommand';
import { PlayerSide } from '../Player';
import { PublicGameState } from '../PublicGameState';
import { Bot } from './Bot';
import { DEFAULT_WEIGHTS, evaluateState, EvaluationWeights } from './evaluateState';

/**
 * One-ply lookahead bot: simulates every legal move, scores the resulting
 * state with {@link evaluateState}, and picks the highest. Ties are broken
 * randomly to avoid pathological loops against deterministic opponents.
 *
 * Known limits (intentional — deeper search is Phase 2):
 *   - Doesn't model the opponent's reply. A move that wins flux now but
 *     hands over a Crux next turn still looks fine.
 *   - Doesn't account for hidden information. Simulates against the full
 *     `Game`, which on real turns is just the bot's own perspective
 *     anyway (only this side is about to act).
 *   - Draft phase: scoring is mostly neutral here since hands don't move
 *     the board yet. The bot effectively picks the first high-scoring
 *     option, which is fine for the opening.
 */
export class HeuristicBot implements Bot {
	public readonly name: string;
	private readonly weights: EvaluationWeights;
	private readonly rng: () => number;
	private readonly side: PlayerSide | undefined;

	constructor(options: {
		name?: string;
		weights?: EvaluationWeights;
		rng?: () => number;
		/** Optional side lock — asserts the bot is only called for this side. */
		side?: PlayerSide;
	} = {}) {
		this.name    = options.name    ?? 'HeuristicBot';
		this.weights = options.weights ?? DEFAULT_WEIGHTS;
		this.rng     = options.rng     ?? Math.random;
		this.side    = options.side;
	}

	public chooseMove(publicState: PublicGameState, legalMoves: GameCommand[]): GameCommand {
		if (legalMoves.length === 0) {
			throw new Error(`${this.name}: no legal moves provided`);
		}

		const mySide = this.side ?? publicState.side;

		// Lookahead requires the full Game to apply the command, so we
		// rehydrate it from the public view. On the active player's turn the
		// opponent's hand contents don't affect how OUR command resolves —
		// only our own hand + public board + deck top are read — so a stub
		// opponent hand is safe. (Deck order matters for DrawCard-from-deck
		// evaluation; we accept the imperfection: draws score with an
		// unknown card, which wastes the handDelta signal but doesn't
		// corrupt any observable state.)
		const simState = toSimulationState(publicState);

		let bestScore = -Infinity;
		let bestMoves: GameCommand[] = [];

		for (const move of legalMoves) {
			const applied = simulateGameCommand(simState, move);
			if (!applied.ok) continue;
			const score = evaluateState(applied.state, mySide, this.weights);

			if (score > bestScore) {
				bestScore = score;
				bestMoves = [move];
			} else if (score === bestScore) {
				bestMoves.push(move);
			}
		}

		if (bestMoves.length === 0) {
			// All simulations failed — fall back to the first legal move.
			// Shouldn't happen in practice; this is belt-and-braces.
			return legalMoves[0];
		}

		return bestMoves[Math.floor(this.rng() * bestMoves.length)];
	}
}

/**
 * Lifts a {@link PublicGameState} back into a {@link Game} shape for
 * simulation. Opponent hand is stubbed as empty. The deck is stubbed with
 * `deckSize` opaque placeholder cards — real identities are hidden, but
 * their presence keeps DrawCard-from-deck and RefillDisplay simulations from
 * failing on an empty deck. The evaluator only reads hand *sizes* and public
 * board state, so placeholder cards don't corrupt scoring.
 */
function toSimulationState(publicState: PublicGameState): Game {
	const opp: PlayerSide = publicState.side === 'light' ? 'dark' : 'light';
	const deck = Array.from({ length: publicState.deckSize }, (_, i) => ({
		id: `__sim-deck-${i}__`,
		element: 'fire' as const,
	}));
	return {
		id: publicState.id,
		phase: publicState.phase,
		board: publicState.board,
		zones: publicState.zones,
		players: {
			[publicState.side]: { side: publicState.side, hand: publicState.ownHand },
			[opp]:              { side: opp,              hand: [] },
		} as Game['players'],
		playerIds: null,
		currentTurn: publicState.currentTurn,
		rift: publicState.rift,
		deck,
		discard: publicState.discard,
		display: publicState.display,
		pendingDraws: publicState.pendingDraws,
		pendingStartOfTurnDraws: publicState.pendingStartOfTurnDraws,
		options: publicState.options,
		winner: publicState.winner,
		winReason: publicState.winReason,
		createdAt: 0,
		updatedAt: 0,
	};
}
