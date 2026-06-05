import { GameCommand, GameCommandResult, okGameCommand, clientGameCommand } from '..';
import { Game } from '../../Game';
import { SpellDisplayRefilled } from '../../GameEvent/GameEvent';

export type RefillSpellDisplayParams = {
	game: Game;
};

/**
 * Tops the spell display back up from the spell deck after a cast. Mirrors
 * {@link RefillDisplay}: reshuffles the spell discard when the deck is empty,
 * and resolves silently when no Spells remain anywhere.
 */
export class RefillSpellDisplay implements GameCommand<RefillSpellDisplayParams> {
	constructor(public name: string, public params: RefillSpellDisplayParams) {}

	public execute(): GameCommandResult {
		const { game } = this.params;

		if (game.spellDeck.length > 0) {
			return okGameCommand([new SpellDisplayRefilled({ spell: game.spellDeck[0] })]);
		}

		if (game.spellDiscard.length > 0) {
			return okGameCommand([], [
				clientGameCommand('ReshuffleSpellDeck', {}),
				clientGameCommand('RefillSpellDisplay', {}),
			]);
		}

		return okGameCommand([]);
	}
}
