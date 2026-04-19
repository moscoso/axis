import { GameCommand, GameCommandResult, okGameCommand, failGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { DeckReshuffled } from '../../GameEvent/GameEvent';
import { shuffle } from '../../../Utility/shuffle';

export type ReshuffleDeckParams = {
	game: Game;
};

/** Shuffles the discard pile into a new deck. Queued automatically by RefillDisplay when the deck runs out. */
export class ReshuffleDeck implements GameCommand<ReshuffleDeckParams> {
	constructor(public name: string, public params: ReshuffleDeckParams) {}

	public execute(): GameCommandResult {
		const { game } = this.params;

		if (game.discard.length === 0) {
			return failGameCommand(GameError.InvalidDrawSelection('Cannot reshuffle — discard pile is empty'));
		}

		return okGameCommand([new DeckReshuffled({ newDeck: shuffle([...game.discard]) })]);
	}
}
