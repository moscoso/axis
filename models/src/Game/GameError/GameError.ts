import { AppError } from '@moscoso/models';

export enum GameErrorType {
	CellHasCrux = 'A Crux stands on this cell — runes cannot be inscribed here',
	CellIsOccupied = 'Cell is already occupied',
	GameIsOver = 'The game is already over',
	HasPendingDraws = 'Resolve pending draws before taking another action',
	InsufficientPayment = 'Insufficient payment for this cell',
	InvalidActivationCount = 'Invalid number of glyph activations',
	InvalidDrawSelection = 'Invalid card selected from the display',
	InvalidPhase = 'Invalid game phase for this action',
	NotYourTurn = 'It is not your turn',
	TooManyCardsPaid = 'Too many cards paid — exceeds the base cost',
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

	static CellHasCrux()                           { return new GameError(GameErrorType.CellHasCrux); }
	static CellIsOccupied()                        { return new GameError(GameErrorType.CellIsOccupied); }
	static GameIsOver()                            { return new GameError(GameErrorType.GameIsOver); }
	static HasPendingDraws()                       { return new GameError(GameErrorType.HasPendingDraws); }
	static InsufficientPayment(d?: string)         { return new GameError(GameErrorType.InsufficientPayment, d); }
	static InvalidActivationCount(d?: string)      { return new GameError(GameErrorType.InvalidActivationCount, d); }
	static InvalidDrawSelection(d?: string)        { return new GameError(GameErrorType.InvalidDrawSelection, d); }
	static InvalidPhase(d?: string)                { return new GameError(GameErrorType.InvalidPhase, d); }
	static NotYourTurn()                           { return new GameError(GameErrorType.NotYourTurn); }
	static TooManyCardsPaid(d?: string)            { return new GameError(GameErrorType.TooManyCardsPaid, d); }
	static UndefinedCommandArguments()             { return new GameError(GameErrorType.UndefinedCommandArguments); }
}
