import { Position } from '../../Zone/Zone';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

export const IS_CELL_EMPTY: GamePreconditionValidator = (
	{ game, target }: { game: Game; target: Position }
) => {
	const cell = game.board[target.row]?.[target.col];
	if (cell?.hasCrux)       return GameError.CellHasCrux();
	if (cell?.stone != null) return GameError.CellIsOccupied();
	return null;
};
