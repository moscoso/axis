import { GameCommand, GameCommandResult, okGameCommand, failGameCommand, clientGameCommand } from '..';
import { Game, BoardCell, Stone } from '../../Game';
import { GameEvent, GlyphInscribed, DiceRerolled } from '../../GameEvent/GameEvent';
import {
	COLOR_MATCHES,
	IS_CELL_EMPTY,
	IS_PHASE,
	IS_PLAYERS_TURN,
	validateGame,
} from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';
import { Position } from '../../../Zone/Zone';
import { Color } from '../../../Element/Element';
import { Die } from '../../../Die/Die';
import { resolveChain } from '../../../Chain/resolveChain';
import { rollFaces } from '../../../Utility/rng';

export type InscribeGlyphParams = {
	game: Game;
	player: PlayerSide;
	/** The color of the die picked from the pool — decides which Crux fires. */
	dieColor: Color;
	target: Position;
};

/**
 * Inscribes the picked die's current face onto an empty matching-color cell,
 * fires the matched Crux's cross (chain resolved up front), then rerolls the two
 * dice whose colors are the inscribed cell's. The chain result and reroll are
 * baked into the emitted events so reducers stay trivial.
 */
export class InscribeGlyph implements GameCommand<InscribeGlyphParams> {
	constructor(public name: string, public params: InscribeGlyphParams) {}

	public execute(): GameCommandResult {
		const { game, player, dieColor, target } = this.params;

		const error = validateGame(
			[IS_PLAYERS_TURN, IS_PHASE('main-turn'), IS_CELL_EMPTY, COLOR_MATCHES],
			{ game, player, target, dieColor }
		);
		if (error) return failGameCommand(error);

		const die = game.dice.find(d => d.color === dieColor)!;
		const glyph = die.face;

		// Resolve the chain against the board AS IF the stone were already placed.
		const board = cloneBoard(game.board);
		const stone: Stone = { owner: player, glyph };
		board[target.row][target.col] = { ...board[target.row][target.col], stone };
		const chain = resolveChain(board, game.cruxes, dieColor, target, player);

		// Reroll the used die only — or both of the cell's color dice when the
		// rerollBothColors option is on.
		const cell = game.board[target.row][target.col];
		const rerollColors = game.options.rerollBothColors
			? [cell.rowColor, cell.colColor]
			: [dieColor];
		const faces = rollFaces(game.rngSeed, game.rngCursor, rerollColors.length);
		const dice: Die[] = game.dice.map(d => {
			const idx = rerollColors.indexOf(d.color);
			return idx === -1 ? d : { ...d, face: faces[idx] };
		});

		const events: GameEvent[] = [
			new GlyphInscribed({
				player,
				position: target,
				color: dieColor,
				glyph,
				firedCells: chain.firedCells,
				scoreDelta: chain.scoreDelta,
				riftDelta: chain.riftDelta,
			}),
			new DiceRerolled({ dice, rngCursor: game.rngCursor + rerollColors.length }),
		];

		// The turn ends immediately — there are no follow-up choices.
		const commands: GameCommand[] = [clientGameCommand('EndTurn', { player })];

		return okGameCommand(events, commands);
	}
}

const cloneBoard = (board: BoardCell[][]): BoardCell[][] => board.map(row => row.map(cell => ({ ...cell })));
