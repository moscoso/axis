import { UserID } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table, SidePreference } from '../../Table';
import { SideSelected } from '../../TableEvent/TableEvent';
import { IS_PLAYER_SEATED, validateTable } from '../../TablePrecondition';

export type SelectSideParams = {
	table: Table;
	userId: UserID;
	sidePreference: SidePreference;
};

/** Records a player's side preference. Actual side resolution is deferred to StartGame. */
export class SelectSide implements TableCommand<SelectSideParams> {
	constructor(public name: string, public params: SelectSideParams) {}

	public execute(): TableCommandResult {
		const { table, userId, sidePreference } = this.params;

		const error = validateTable([IS_PLAYER_SEATED], { table, userId });
		if (error) return failTableCommand(error);

		return okTableCommand([new SideSelected({ userId, sidePreference })]);
	}
}
