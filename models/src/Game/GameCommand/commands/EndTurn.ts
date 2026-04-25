import { GameCommand, GameCommandResult, okGameCommand, failGameCommand } from '..';
import { Game } from '../../Game';
import { TurnEnded } from '../../GameEvent/GameEvent';
import { IS_PHASE, IS_PLAYERS_TURN, validateGame } from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';

export type EndTurnParams = {
	game: Game;
	player: PlayerSide;
};

/** Ends the current player's turn and passes control to the opponent. */
export class EndTurn implements GameCommand<EndTurnParams> {
	constructor(public name: string, public params: EndTurnParams) {}

	public execute(): GameCommandResult {
		const { game, player } = this.params;

		const error = validateGame([IS_PLAYERS_TURN, IS_PHASE('main-turn')], { game, player });
		if (error) return failGameCommand(error);

		return okGameCommand([new TurnEnded({ player })]);
	}
}
