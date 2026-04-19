import { GameCommand, GameCommandResult, okGameCommand, failGameCommand, clientGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { CardDrawn } from '../../GameEvent/GameEvent';
import { IS_PHASE, IS_PLAYERS_TURN, validateGame } from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';

type DrawFromDisplay = { from: 'display'; cardId: string };
type DrawFromDeck    = { from: 'deck' };

export type DrawCardParams = {
	game: Game;
	player: PlayerSide;
} & (DrawFromDisplay | DrawFromDeck);

/**
 * Draws a single card into the active player's hand. Serves two contexts:
 *
 * 1. **Main action** — with `pendingDraws === 0`, this is the player's entire
 *    turn (per rulebook: "Draw a Card" is one of the two main-turn options).
 *    The turn ends after the draw resolves.
 * 2. **Pending-draw resolution** — with `pendingDraws > 0`, this resolves one
 *    of the ◇ activations queued by a prior Inscribe. Only the final pending
 *    draw ends the turn; earlier ones just decrement.
 *
 * Queues RefillDisplay after a display draw.
 */
export class DrawCard implements GameCommand<DrawCardParams> {
	constructor(public name: string, public params: DrawCardParams) {}

	public execute(): GameCommandResult {
		const params = this.params;
		const { game, player } = params;

		const error = validateGame([IS_PLAYERS_TURN, IS_PHASE('main-turn')], { game, player });
		if (error) return failGameCommand(error);

		// pendingDraws === 0 → this is the player's main action and should end the turn.
		// pendingDraws === 1 → resolving the last queued draw; end the turn.
		// pendingDraws  > 1 → still more queued draws to resolve; do NOT end the turn.
		const shouldEndTurn = game.pendingDraws <= 1;
		const commands: GameCommand[] = [];

		if (params.from === 'display') {
			const card = game.display.find(c => c.id === params.cardId);
			if (!card) return failGameCommand(GameError.InvalidDrawSelection(`Card ${params.cardId} is not in the display`));

			commands.push(clientGameCommand('RefillDisplay', {}));
			if (shouldEndTurn) commands.push(clientGameCommand('EndTurn', { player }));

			return okGameCommand([new CardDrawn({ player, card, from: 'display' })], commands);
		}

		// from: 'deck'
		if (game.deck.length === 0) {
			return failGameCommand(GameError.InvalidDrawSelection('Deck is empty'));
		}

		if (shouldEndTurn) commands.push(clientGameCommand('EndTurn', { player }));

		return okGameCommand([new CardDrawn({ player, card: game.deck[0], from: 'deck' })], commands);
	}
}
