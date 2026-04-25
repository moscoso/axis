import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table } from '../../Table';
import { TableCleaned } from '../../TableEvent/TableEvent';
import { IS_GAME_FINISHED, validateTable } from '../../TablePrecondition';

export type CleanTableParams = {
	table: Table;
};

/** Resets the table after a finished game — clears side assignment so a new session can begin. */
export class CleanTable implements TableCommand<CleanTableParams> {
	constructor(public name: string, public params: CleanTableParams) {}

	public execute(): TableCommandResult {
		const { table } = this.params;

		const error = validateTable([IS_GAME_FINISHED], { table });
		if (error) return failTableCommand(error);

		return okTableCommand([new TableCleaned()]);
	}
}
