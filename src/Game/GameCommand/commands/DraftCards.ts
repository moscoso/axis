import { GameCommand, GameCommandResult, okGameCommand, failGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { DraftCompleted } from '../../GameEvent/GameEvent';
import { IS_PHASE, validateGame } from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';

export type DraftCardsParams = {
	game: Game;
	player: PlayerSide;
	/** The two card IDs Dark is picking from the display. */
	cardIds: [string, string];
};

/**
 * Dark picks 2 cards from the 4-card display. Light receives the remaining 2.
 * The display is then reset with 2 fresh cards from the top of the deck.
 */
export class DraftCards implements GameCommand<DraftCardsParams> {
	constructor(public name: string, public params: DraftCardsParams) {}

	public execute(): GameCommandResult {
		const { game, player, cardIds } = this.params;

		const error = validateGame([IS_PHASE('starting-draft')], { game, player }, true);
		if (error) return failGameCommand(error);

		if (player !== 'dark') {
			return failGameCommand(GameError.NotYourTurn());
		}

		if (cardIds[0] === cardIds[1]) {
			return failGameCommand(GameError.UndefinedCommandArguments());
		}

		const darkCards = cardIds.map(id => game.display.find(c => c.id === id) ?? null);
		if (darkCards.some(c => c === null)) {
			return failGameCommand(GameError.InvalidDrawSelection('One or more selected cards are not in the display'));
		}

		const pickedIds = new Set(cardIds);
		const lightCards = game.display.filter(c => !pickedIds.has(c.id));
		const displayCards = game.deck.slice(0, 2);

		return okGameCommand([
			new DraftCompleted({
				darkCards: darkCards as NonNullable<typeof darkCards[0]>[],
				lightCards,
				displayCards
			})
		]);
	}
}
