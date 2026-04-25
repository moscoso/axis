import { ok, fail, CommandResult, CommandExecution } from '@moscoso/models';
import { GameCommand } from '.';
import { GameError } from '../GameError/GameError';
import { GameEvent } from '../GameEvent/GameEvent';

export type GameCommandExecution<
	E extends GameEvent = GameEvent,
	C extends GameCommand<any> = GameCommand<any>
> = CommandExecution<E, C>;

export type GameCommandResult<
	E extends GameEvent = GameEvent,
	C extends GameCommand<any> = GameCommand<any>
> = CommandResult<E, C>;

export const okGameCommand =
	<E extends GameEvent = GameEvent>(events: E[], commands: GameCommand[] = []): GameCommandResult<E> =>
	ok({ events, commands });

export const failGameCommand =
	<E extends GameEvent = GameEvent>(error: GameError): GameCommandResult<E> =>
	fail(error, { events: [], commands: [] });
