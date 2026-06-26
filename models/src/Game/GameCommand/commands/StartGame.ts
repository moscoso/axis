import { UserID } from '@moscoso/models';
import { COLORS } from '../../../Element/Element';
import { generateBoard } from '../../../Board/generateBoard';
import { Die } from '../../../Die/Die';
import { rollFaces } from '../../../Utility/rng';
import { GameSeed } from '../../GameSeed/GameSeed';
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
 * Sets up a new AXIS game from the current table state: resolves side
 * preferences, generates the board and Cruxes, rolls the six pool dice from a
 * fresh seed, and emits a {@link GameSeed}.
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

		const { board, cruxes } = generateBoard();

		// Seed the dice PRNG, then roll one face per color for the initial pool.
		const rngSeed = (Math.floor(Math.random() * 0xffffffff)) >>> 0;
		const faces   = rollFaces(rngSeed, 0, COLORS.length);
		const dice: Die[] = COLORS.map((color, i) => ({ color, face: faces[i] }));

		const seed: GameSeed = {
			board,
			cruxes,
			dice,
			rngSeed,
			rngCursor: COLORS.length,
			lightPlayer,
			darkPlayer,
			options:   table.options,
			createdAt: Date.now(),
		};

		return okGameCommand([new GameStarted(seed)]);
	}
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
