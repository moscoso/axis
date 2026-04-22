import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * Blocks a command while the active player still has draws queued — either
 * ◇ activation draws from a prior Inscribe or start-of-turn freebies. Used on
 * Inscribe so the player can't side-step their pending draws.
 */
export const HAS_NO_PENDING_DRAWS: GamePreconditionValidator = (
	{ game }: { game: Game }
) => {
	return game.pendingDraws > 0 || game.pendingStartOfTurnDraws > 0
		? GameError.HasPendingDraws()
		: null;
};
