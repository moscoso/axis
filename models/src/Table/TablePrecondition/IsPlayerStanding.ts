import { UserID } from '@moscoso/models';
import { Table } from '../Table';
import { TableError } from '../TableError/TableError';
import { TablePreconditionValidator } from './TablePrecondition';

/** Validates that the given user is not already seated at the table. */
export const IS_PLAYER_STANDING: TablePreconditionValidator = (
	{ table, userId }: { table: Table; userId: UserID }
) => {
	return table.seats.every(s => s?.user.id !== userId)
		? null
		: TableError.PlayerAlreadySeated();
};
