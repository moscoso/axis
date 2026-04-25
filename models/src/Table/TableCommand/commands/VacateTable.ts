import { TableCommand, TableCommandResult, okTableCommand } from '..';
import { Table } from '../../Table';
import { PlayerLeft, TableCleaned, TableEvent } from '../../TableEvent/TableEvent';

export type VacateTableParams = {
	table: Table;
};

/**
 * Empties every seat at the table. Use case: "New Game" after a match —
 * we want everyone (including any bots) kicked out so a fresh group can
 * form up via the lobby.
 *
 * Emits one {@link PlayerLeft} per occupied seat plus a final
 * {@link TableCleaned} so the existing dealer trigger resets the game state.
 *
 * No precondition: the client decides when to call this. Mid-game vacate
 * is intentionally legal (it's a hard reset).
 */
export class VacateTable implements TableCommand<VacateTableParams> {
	constructor(public name: string, public params: VacateTableParams) {}

	public execute(): TableCommandResult {
		const { table } = this.params;

		const events: TableEvent[] = [];
		for (const seat of table.seats) {
			if (seat) events.push(new PlayerLeft({ userId: seat.user.id }));
		}
		events.push(new TableCleaned());

		return okTableCommand(events);
	}
}
