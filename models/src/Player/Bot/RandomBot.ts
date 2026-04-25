import { GameCommand } from '../../Game/GameCommand/GameCommand';
import { PublicGameState } from '../PublicGameState';
import { Bot } from './Bot';

/**
 * Picks a legal move uniformly at random. Serves as the baseline opponent —
 * every smarter bot should beat it comfortably (>>50% win rate) or something
 * is wrong.
 *
 * Pass a seeded RNG when you need reproducibility in tests.
 */
export class RandomBot implements Bot {
	public readonly name: string;
	private readonly rng: () => number;

	constructor(options: { name?: string; rng?: () => number } = {}) {
		this.name = options.name ?? 'RandomBot';
		this.rng = options.rng ?? Math.random;
	}

	public chooseMove(_publicState: PublicGameState, legalMoves: GameCommand[]): GameCommand {
		if (legalMoves.length === 0) {
			throw new Error(`${this.name}: no legal moves provided`);
		}
		const idx = Math.floor(this.rng() * legalMoves.length);
		return legalMoves[idx];
	}
}
