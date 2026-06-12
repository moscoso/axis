import { UserID } from '@moscoso/models';
import { Card } from '../../../Card/Card';
import { ELEMENTS } from '../../../Element/Element';
import { generateBoard } from '../../../Board/generateBoard';
import { createSpellDeck } from '../../../Spell/createSpellDeck';
import { GameSeed } from '../../GameSeed/GameSeed';
import { shuffle } from '../../../Utility/shuffle';
import { Table, SidePreference } from '../../../Table/Table';
import { GameCommand, GameCommandResult, okGameCommand, failGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { GameStarted } from '../../GameEvent/GameEvent';
import { IS_PHASE, validateGame } from '../../GamePrecondition';

export type StartGameParams = {
	game: Game;
	table: Table;
};

/**
 * Sets up a new AXIS game from the current table state.
 * Resolves side preferences, generates the board, builds and shuffles the
 * deck, deals the initial 4-card display for the draft, and emits a
 * {@link GameSeed}.
 *
 * Side resolution rules:
 * - One player picks 'light' and the other picks 'dark' → respect both choices.
 * - All other combinations (same side, either picks 'random' or null) → random.
 */
export class StartGame implements GameCommand<StartGameParams> {
	constructor(public name: string, public params: StartGameParams) {}

	public execute(): GameCommandResult {
		const { game, table } = this.params;

		const error = validateGame([IS_PHASE('setup')], { game }, true);
		if (error) return failGameCommand(error);

		const [seatA, seatB] = table.seats;
		if (!seatA || !seatB) {
			return failGameCommand(GameError.UndefinedCommandArguments());
		}

		const { lightPlayer, darkPlayer } = resolveSides(
			seatA.user.id, seatA.sidePreference,
			seatB.user.id, seatB.sidePreference,
		);

		const { board, zones } = generateBoard({ shiftGlyphs: table.options.shiftGlyphs });
		const shuffledDeck    = shuffle(createDeck());
		const display         = shuffledDeck.slice(0, 4);
		const remainingDeck   = shuffledDeck.slice(4);

		// Spell piles — only dealt when the option is on; otherwise left empty.
		const shuffledSpells  = table.options.spells ? shuffle(createSpellDeck()) : [];
		const spellDisplay    = shuffledSpells.slice(0, SPELL_DISPLAY_SIZE);
		const spellDeck       = shuffledSpells.slice(SPELL_DISPLAY_SIZE);

		const seed: GameSeed = {
			board,
			zones,
			deck:        remainingDeck,
			display,
			spellDeck,
			spellDisplay,
			lightPlayer,
			darkPlayer,
			options:     table.options,
			createdAt:   Date.now(),
		};

		return okGameCommand([new GameStarted(seed)]);
	}
}

/**
 * 6 suits × 5 = a 30-card deck, mirroring the 30 inscribable cells (the four-
 * zone game kept the same invariant: 32 cards for 32 cells). Tunable.
 */
const CARDS_PER_ELEMENT = 5;
const SPELL_DISPLAY_SIZE = 3;

/** Builds the 30-card AXIS deck: 5 of each suit, id'd by suit + index. */
function createDeck(): Card[] {
	const deck: Card[] = [];
	for (const element of ELEMENTS) {
		for (let i = 0; i < CARDS_PER_ELEMENT; i++) {
			deck.push({ id: `${element}-${i}`, element });
		}
	}
	return deck;
}

function resolveSides(
	idA: UserID, prefA: SidePreference | null,
	idB: UserID, prefB: SidePreference | null,
): { lightPlayer: UserID; darkPlayer: UserID } {
	if (prefA === 'light' && prefB === 'dark') return { lightPlayer: idA, darkPlayer: idB };
	if (prefA === 'dark'  && prefB === 'light') return { lightPlayer: idB, darkPlayer: idA };

	// All other cases (same side, either is 'random', or null) → random
	const flip = Math.random() < 0.5;
	return flip
		? { lightPlayer: idA, darkPlayer: idB }
		: { lightPlayer: idB, darkPlayer: idA };
}
