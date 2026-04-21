import { Table } from '../Table';
import { TableError } from '../TableError/TableError';
import { TablePreconditionValidator } from './TablePrecondition';

/** Validates that at least one seat is available. */
export const HAS_EMPTY_SEAT: TablePreconditionValidator = (
	{ table }: { table: Table }
) => {
	return table.seats.includes(null)
		? null
		: TableError.TableIsFull();
};
