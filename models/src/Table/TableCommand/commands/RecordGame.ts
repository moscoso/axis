import { UserID } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand, failTableCommand } from '..';
import { Table } from '../../Table';
import { GameRecorded } from '../../TableEvent/TableEvent';
import { IS_GAME_FINISHED, validateTable } from '../../TablePrecondition';
import { Game } from '../../../Game/Game';

export type RecordGameParams = {
	table: Table;
	game: Game;
	/** The user who played the light side. */
	lightId: UserID;
	/** The user who played the dark side. */
	darkId: UserID;
};

/** Records the result of a finished game. */
export class RecordGame implements TableCommand<RecordGameParams> {
	constructor(public name: string, public params: RecordGameParams) {}

	public execute(): TableCommandResult {
		const { table, game, lightId, darkId } = this.params;

		const error = validateTable([IS_GAME_FINISHED], { table });
		if (error) return failTableCommand(error);

		return okTableCommand([new GameRecorded({
			lightId,
			darkId,
			winner:  game.winner,
			reason:  game.winReason,
		})]);
	}
}
