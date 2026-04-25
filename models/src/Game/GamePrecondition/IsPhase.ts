import { GamePhase, Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { ConfigurableGamePreconditionValidator, GamePreconditionValidator } from './GamePrecondition';

export const IS_PHASE: ConfigurableGamePreconditionValidator<[GamePhase]> =
	(phase): GamePreconditionValidator =>
	({ game }: { game: Game }) =>
		game.phase === phase
			? null
			: GameError.InvalidPhase(`Action requires '${phase}' phase`);
