import { UserID } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table } from '../../Table';
import { GameOptions } from '../../../Game/GameOptions';
import { OptionsChanged } from '../../TableEvent/TableEvent';
import { IS_PLAYER_SEATED, validateTable } from '../../TablePrecondition';

export type SetOptionsParams = {
	table: Table;
	userId: UserID;
	options: Partial<GameOptions>;
};

/** Patches the table's house-rule options. Applied to the next game dealt from this table. */
export class SetOptions implements TableCommand<SetOptionsParams> {
	constructor(public name: string, public params: SetOptionsParams) {}

	public execute(): TableCommandResult {
		const { table, userId, options } = this.params;

		const error = validateTable([IS_PLAYER_SEATED], { table, userId });
		if (error) return failTableCommand(error);

		return okTableCommand([new OptionsChanged({ options })]);
	}
}
