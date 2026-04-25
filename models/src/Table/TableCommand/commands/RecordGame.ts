import { UserID } from '@moscoso/models';
import { TableCommand, TableCommandResult, okTableCommand } from '..';
import { Table } from '../../Table';
import { GameRecorded } from '../../TableEvent/TableEvent';
import { Game } from '../../../Game/Game';

export type RecordGameParams = {
	table: Table;
	game: Game;
	/** The user who played the light side. */
	lightId: UserID;
	/** The user who played the dark side. */
	darkId: UserID;
};

/**
 * Records the result of a finished game. Called by the dealer's `Game Ended`
 * trigger; that trigger is what guards "is the game actually over?", so this
 * command itself is precondition-free.
 */
export class RecordGame implements TableCommand<RecordGameParams> {
	constructor(public name: string, public params: RecordGameParams) {}

	public execute(): TableCommandResult {
		const { game, lightId, darkId } = this.params;
		return okTableCommand([new GameRecorded({
			lightId,
			darkId,
			winner:  game.winner,
			reason:  game.winReason,
		})]);
	}
}
