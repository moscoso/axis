import { AppError } from '@moscoso/models';

export enum TableErrorType {
	GameHasNotFinished        = 'Game has not finished',
	PlayerAlreadySeated       = 'Player is already seated at this table',
	PlayerNotSeated           = 'Player is not seated at this table',
	TableIsFull               = 'Table is full',
	UndefinedCommandArguments = 'Undefined arguments were passed into the command',
}

export class TableError extends AppError<TableErrorType> {
	constructor(message: TableErrorType | string, detail?: string) {
		super(message);
		this.name = 'TableError';
		this.detail = detail;
	}

	static GameHasNotFinished()        { return new TableError(TableErrorType.GameHasNotFinished); }
	static PlayerAlreadySeated()       { return new TableError(TableErrorType.PlayerAlreadySeated); }
	static PlayerNotSeated()           { return new TableError(TableErrorType.PlayerNotSeated); }
	static TableIsFull()               { return new TableError(TableErrorType.TableIsFull); }
	static UndefinedCommandArguments() { return new TableError(TableErrorType.UndefinedCommandArguments); }
}
