import { ok, fail, CommandResult, CommandExecution } from '@moscoso/models';
import { TableCommand } from './TableCommand';
import { TableError } from '../TableError/TableError';
import { TableEvent } from '../TableEvent/TableEvent';

export type TableCommandExecution<
	E extends TableEvent = TableEvent,
	C extends TableCommand<any> = TableCommand<any>
> = CommandExecution<E, C>;

export type TableCommandResult<
	E extends TableEvent = TableEvent,
	C extends TableCommand<any> = TableCommand<any>
> = CommandResult<E, C>;

export const okTableCommand =
	<E extends TableEvent = TableEvent>(events: E[], commands: TableCommand[] = []): TableCommandResult<E> =>
	ok({ events, commands });

export const failTableCommand =
	<E extends TableEvent = TableEvent>(error: TableError): TableCommandResult<E> =>
	fail(error, { events: [], commands: [] });
