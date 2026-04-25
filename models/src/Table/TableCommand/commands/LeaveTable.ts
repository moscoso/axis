import { UserID } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table } from '../../Table';
import { PlayerLeft } from '../../TableEvent/TableEvent';
import { IS_PLAYER_SEATED, validateTable } from '../../TablePrecondition';

export type LeaveTableParams = {
	table: Table;
	userId: UserID;
};

/** Removes a player from the table. Fails if the player is not currently seated. */
export class LeaveTable implements TableCommand<LeaveTableParams> {
	constructor(public name: string, public params: LeaveTableParams) {}

	public execute(): TableCommandResult {
		const { table, userId } = this.params;

		const error = validateTable([IS_PLAYER_SEATED], { table, userId });
		if (error) return failTableCommand(error);

		return okTableCommand([new PlayerLeft({ userId })]);
	}
}
