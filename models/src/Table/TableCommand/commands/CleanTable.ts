import { TableCommand, TableCommandResult, okTableCommand } from '..';
import { Table } from '../../Table';
import { TableCleaned } from '../../TableEvent/TableEvent';

export type CleanTableParams = {
	table: Table;
};

/**
 * Soft-resets the table — clears any session-level scratch state and lets
 * the existing dealer trigger reset the game. Used after a finished game
 * so the next session starts fresh; calling it mid-game is also valid (a
 * deliberate reset).
 */
export class CleanTable implements TableCommand<CleanTableParams> {
	constructor(public name: string, public params: CleanTableParams) {}

	public execute(): TableCommandResult {
		// `table` consumed here for symmetry with the other commands; no
		// preconditions today since clean-up is always allowed.
		void this.params.table;
		return okTableCommand([new TableCleaned()]);
	}
}
