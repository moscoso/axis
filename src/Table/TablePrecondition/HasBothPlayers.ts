import { Table } from '../Table';
import { TableError } from '../TableError/TableError';
import { TablePreconditionValidator } from './TablePrecondition';

/** Validates that both seats are occupied. */
export const HAS_BOTH_PLAYERS: TablePreconditionValidator = (
	{ table }: { table: Table }
) => {
	return table.seats.every(s => s !== null)
		? null
		: TableError.UndefinedCommandArguments();
};
