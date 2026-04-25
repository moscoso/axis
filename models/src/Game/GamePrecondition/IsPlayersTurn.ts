import { PlayerSide } from '../../Player/Player';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

export const IS_PLAYERS_TURN: GamePreconditionValidator = (
	{ game, player }: { game: Game; player: PlayerSide }
) => {
	return game.currentTurn === player ? null : GameError.NotYourTurn();
};
