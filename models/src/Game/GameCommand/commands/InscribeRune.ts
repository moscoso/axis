import { GameCommand, GameCommandResult, okGameCommand, failGameCommand, clientGameCommand } from '..';
import { Game, Rune } from '../../Game';
import { GameEvent, RuneInscribed } from '../../GameEvent/GameEvent';
import {
	CAN_ACTIVATE,
	CAN_PAY,
	HAS_NO_PENDING_DRAWS,
	IS_CELL_EMPTY,
	IS_PHASE,
	IS_PLAYERS_TURN,
	validateGame
} from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';
import { Position } from '../../../Zone/Zone';
import { Glyph } from '../../../Glyph/Glyph';

export type InscribeRuneParams = {
	game: Game;
	player: PlayerSide;
	target: Position;
	paidCardIds: string[];
	chosenActivations: Glyph[];
};

/** Places a Rune on the board, validates payment and activations, and queues draw follow-ups if needed. */
export class InscribeRune implements GameCommand<InscribeRuneParams> {
	constructor(public name: string, public params: InscribeRuneParams) {}

	public execute(): GameCommandResult {
		const { game, player, target, paidCardIds, chosenActivations } = this.params;

		const error = validateGame(
			[
				IS_PLAYERS_TURN,
				IS_PHASE('main-turn'),
				HAS_NO_PENDING_DRAWS,
				IS_CELL_EMPTY,
				CAN_PAY,
				CAN_ACTIVATE,
			],
			{ game, player, target, paidCardIds, chosenActivations }
		);
		if (error) return failGameCommand(error);

		const resolvedCards = paidCardIds.map(id => game.players[player].hand.find(c => c.id === id)!);
		const drawCount = chosenActivations.filter(a => a === '◇').length;
		const rune: Rune = { owner: player, flux: 0 };

		const events: GameEvent[] = [
			new RuneInscribed({ player, position: target, rune, paidCards: resolvedCards, activations: chosenActivations })
		];

		// If no draws, end the turn immediately; otherwise the player resolves draws via DrawCard
		const commands: GameCommand[] = [];
		if (drawCount === 0) {
			commands.push(clientGameCommand('EndTurn', { player }));
		}

		return okGameCommand(events, commands);
	}
}
