import { Table } from '../Table';
import { TableError } from '../TableError/TableError';
import { TablePreconditionValidator } from './TablePrecondition';

/** Validates that the current game has finished before allowing table cleanup or recording. */
export const IS_GAME_FINISHED: TablePreconditionValidator = (
	{ table }: { table: Table }
) => {
	return table.status === 'finished'
		? null
		: TableError.GameHasNotFinished();
};
