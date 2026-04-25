import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

export const IS_NOT_GAME_OVER: GamePreconditionValidator = ({ game }: { game: Game }) => {
	return game.phase === 'game-over' ? GameError.GameIsOver() : null;
};
