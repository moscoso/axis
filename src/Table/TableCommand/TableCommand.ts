import { Command, ConstructorFactory, ConstructorParams } from '@moscoso/models';
import { TableCommandResult, TableCommands } from '.';

export interface TableCommand<P = {}> extends Command<TableCommandResult, P> {}

export type TableCommandType = keyof typeof TableCommands;

export const TableCommandFactory: ConstructorFactory<typeof TableCommands> = new ConstructorFactory(TableCommands);

export const tableCommand = TableCommandFactory.get.bind(TableCommandFactory);

/**
 * Creates a {@link TableCommand} without requiring the `table` param — to be injected by the dealer.
 */
export const clientTableCommand = <T extends keyof typeof TableCommands>(
	type: T,
	params: Omit<ConstructorParams<typeof TableCommands[T]>, 'table'>
): InstanceType<typeof TableCommands[T]> => {
	return tableCommand(type, params as ConstructorParams<typeof TableCommands[T]>);
};
