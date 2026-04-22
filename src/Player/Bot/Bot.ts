import { GameCommand } from '../../Game/GameCommand/GameCommand';
import { PublicGameState } from '../PublicGameState';

/**
 * A {@link Bot} chooses one legal move given the public view of the game and
 * the full list of legal commands. The match harness calls `chooseMove` only
 * when it's this bot's turn to act, so implementations don't need to check
 * `publicState.currentTurn`.
 *
 * Contract:
 * - MUST return a command from `legalMoves` (strict equality).
 * - MUST NOT mutate `publicState` or `legalMoves`.
 * - MAY inspect `publicState.ownHand` but NOT the opponent's hand (hidden).
 */
export interface Bot {
	/** Human-readable identifier, useful for match logs / win-rate tables. */
	readonly name: string;
	chooseMove(publicState: PublicGameState, legalMoves: GameCommand[]): GameCommand;
}
