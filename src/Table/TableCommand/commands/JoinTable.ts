import { User } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table } from '../../Table';
import { PlayerJoined } from '../../TableEvent/TableEvent';
import { HAS_EMPTY_SEAT, IS_PLAYER_STANDING, validateTable } from '../../TablePrecondition';

export type JoinTableParams = {
	table: Table;
	user: User;
};

/** Seats a player at the table. Fails if the table is full or the player is already seated. */
export class JoinTable implements TableCommand<JoinTableParams> {
	constructor(public name: string, public params: JoinTableParams) {}

	public execute(): TableCommandResult {
		const { table, user } = this.params;

		const error = validateTable([IS_PLAYER_STANDING, HAS_EMPTY_SEAT], { table, userId: user.id });
		if (error) return failTableCommand(error);

		return okTableCommand([new PlayerJoined({ user })]);
	}
}
