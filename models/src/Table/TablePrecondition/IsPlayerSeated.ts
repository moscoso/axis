import { UserID } from '@moscoso/models';
import { Table } from '../Table';
import { TableError } from '../TableError/TableError';
import { TablePreconditionValidator } from './TablePrecondition';

/** Validates that the given user is currently seated at the table. */
export const IS_PLAYER_SEATED: TablePreconditionValidator = (
	{ table, userId }: { table: Table; userId: UserID }
) => {
	return table.seats.some(s => s?.user.id === userId)
		? null
		: TableError.PlayerNotSeated();
};
