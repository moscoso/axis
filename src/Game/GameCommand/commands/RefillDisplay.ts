import { GameCommand, GameCommandResult, okGameCommand, clientGameCommand } from '..';
import { Game } from '../../Game';
import { DisplayRefilled } from '../../GameEvent/GameEvent';

export type RefillDisplayParams = {
	game: Game;
};

/**
 * Takes the top card of the deck and adds it to the face-up display.
 * If the deck is empty, queues ReshuffleDeck first then retries.
 * If both deck and discard are empty, resolves silently (no cards left).
 */
export class RefillDisplay implements GameCommand<RefillDisplayParams> {
	constructor(public name: string, public params: RefillDisplayParams) {}

	public execute(): GameCommandResult {
		const { game } = this.params;

		if (game.deck.length > 0) {
			return okGameCommand([new DisplayRefilled({ card: game.deck[0] })]);
		}

		if (game.discard.length > 0) {
			return okGameCommand([], [
				clientGameCommand('ReshuffleDeck', {}),
				clientGameCommand('RefillDisplay', {})
			]);
		}

		// Both deck and discard are empty — nothing to fill with
		return okGameCommand([]);
	}
}
