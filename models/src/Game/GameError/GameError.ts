import { AppError } from '@moscoso/models';

export enum GameErrorType {
	CellHasCrux = 'A Crux stands on this cell — it cannot be inscribed',
	CellIsOccupied = 'Cell is already occupied',
	ColorMismatch = 'The die color does not match this cell',
	GameIsOver = 'The game is already over',
	InvalidPhase = 'Invalid game phase for this action',
	NoSuchDie = 'No die of that color is in the pool',
	NotYourTurn = 'It is not your turn',
	UndefinedCommandArguments = 'Undefined arguments were passed into the command',
}

/**
 * A {@link GameError} is an error thrown when a {@link GameCommand} fails to execute.
 */
export class GameError extends AppError<GameErrorType> {
	constructor(message: GameErrorType | string, detail?: string) {
		super(message);
		this.name = 'GameError';
		this.detail = detail;
	}

	static CellHasCrux()               { return new GameError(GameErrorType.CellHasCrux); }
	static CellIsOccupied()            { return new GameError(GameErrorType.CellIsOccupied); }
	static ColorMismatch(d?: string)   { return new GameError(GameErrorType.ColorMismatch, d); }
	static GameIsOver()                { return new GameError(GameErrorType.GameIsOver); }
	static InvalidPhase(d?: string)    { return new GameError(GameErrorType.InvalidPhase, d); }
	static NoSuchDie(d?: string)       { return new GameError(GameErrorType.NoSuchDie, d); }
	static NotYourTurn()               { return new GameError(GameErrorType.NotYourTurn); }
	static UndefinedCommandArguments() { return new GameError(GameErrorType.UndefinedCommandArguments); }
}
