import { Color } from '../../Element/Element';
import { Position } from '../../Zone/Zone';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * The picked die's color must exist in the pool and match one of the target
 * cell's two colors (its row color or column color).
 */
export const COLOR_MATCHES: GamePreconditionValidator = (
	{ game, target, dieColor }: { game: Game; target: Position; dieColor: Color }
) => {
	if (!game.dice.some(d => d.color === dieColor)) return GameError.NoSuchDie();
	const cell = game.board[target.row]?.[target.col];
	if (!cell) return GameError.ColorMismatch();
	if (cell.rowColor !== dieColor && cell.colColor !== dieColor) return GameError.ColorMismatch();
	return null;
};
