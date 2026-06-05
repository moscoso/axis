import { GameCommand, GameCommandResult, okGameCommand, failGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { SpellDeckReshuffled } from '../../GameEvent/GameEvent';
import { shuffle } from '../../../Utility/shuffle';

export type ReshuffleSpellDeckParams = {
	game: Game;
};

/** Shuffles the spell discard into a fresh spell deck. Queued by RefillSpellDisplay when the deck runs out. */
export class ReshuffleSpellDeck implements GameCommand<ReshuffleSpellDeckParams> {
	constructor(public name: string, public params: ReshuffleSpellDeckParams) {}

	public execute(): GameCommandResult {
		const { game } = this.params;

		if (game.spellDiscard.length === 0) {
			return failGameCommand(GameError.InvalidSpellSelection('Cannot reshuffle — spell discard is empty'));
		}

		return okGameCommand([new SpellDeckReshuffled({ newDeck: shuffle([...game.spellDiscard]) })]);
	}
}
