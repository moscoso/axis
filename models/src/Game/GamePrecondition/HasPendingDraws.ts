import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/** Validates that there is at least one unresolved draw activation waiting to be played. */
export const HAS_PENDING_DRAWS: GamePreconditionValidator = (
	{ game }: { game: Game }
) => {
	return game.pendingDraws > 0
		? null
		: GameError.InvalidPhase('No pending draw activations to resolve');
};
