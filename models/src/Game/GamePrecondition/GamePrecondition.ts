import { ConfigurablePreconditionValidator, PreconditionValidator, validate } from '@moscoso/models';
import { GameError } from '../GameError/GameError';
import { IS_NOT_GAME_OVER } from './IsNotGameOver';

export type GamePreconditionValidator = PreconditionValidator<GameError>;
export type ConfigurableGamePreconditionValidator<TArgs extends unknown[]> =
	ConfigurablePreconditionValidator<GamePreconditionValidator, TArgs>;

/**
 * Validates that a list of preconditions are met.
 * {@link IS_NOT_GAME_OVER} is always prepended unless skipDefaults is true.
 */
export const validateGame = (
	preconditions: GamePreconditionValidator[],
	args: any,
	skipDefaults = false
) => {
	const defaults = [IS_NOT_GAME_OVER];
	const all = skipDefaults ? preconditions : defaults.concat(preconditions);
	return validate<GameError>(all, args);
};

export { validateArgsAreDefined } from '@moscoso/models';
