import { GameCommand, GameCommandResult, okGameCommand } from '..';
import { Game } from '../../Game';
import { SpellDisplayRefilled } from '../../GameEvent/GameEvent';

export type RefillSpellDisplayParams = {
	game: Game;
};

/**
 * Tops the spell display back up from the spell deck after a cast. Unlike the
 * card display, the spell deck is a FINITE resource — it is never reshuffled
 * from the discard. Once the deck runs dry the display simply shrinks as Spells
 * are spent, hard-capping the total Spells available in a game.
 */
export class RefillSpellDisplay implements GameCommand<RefillSpellDisplayParams> {
	constructor(public name: string, public params: RefillSpellDisplayParams) {}

	public execute(): GameCommandResult {
		const { game } = this.params;

		if (game.spellDeck.length > 0) {
			return okGameCommand([new SpellDisplayRefilled({ spell: game.spellDeck[0] })]);
		}

		// Deck exhausted — no reshuffle. Spells are gone for good once spent.
		return okGameCommand([]);
	}
}
