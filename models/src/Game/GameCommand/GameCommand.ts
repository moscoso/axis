import { Command, ConstructorFactory, ConstructorParams } from '@moscoso/models';
import { GameCommands, GameCommandResult } from '.';

export interface GameCommand<P = {}> extends Command<GameCommandResult, P> {}

export type GameCommandType = keyof typeof GameCommands;

export const GameCommandFactory: ConstructorFactory<typeof GameCommands> = new ConstructorFactory(GameCommands);

export const gameCommand = GameCommandFactory.get.bind(GameCommandFactory);

/**
 * Creates a {@link GameCommand} without requiring the `game` param — to be injected later by the rules engine.
 */
export const clientGameCommand = <T extends keyof typeof GameCommands>(
	type: T,
	params: Omit<ConstructorParams<typeof GameCommands[T]>, 'game'>
): InstanceType<typeof GameCommands[T]> => {
	return gameCommand(type, params as ConstructorParams<typeof GameCommands[T]>);
};
