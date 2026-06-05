import { GameCommand, GameCommandResult, okGameCommand, failGameCommand, clientGameCommand } from '..';
import { Game } from '../../Game';
import { GameError } from '../../GameError/GameError';
import { SpellCast } from '../../GameEvent/GameEvent';
import { IS_PHASE, IS_PLAYERS_TURN, HAS_NO_PENDING_DRAWS, validateGame } from '../../GamePrecondition';
import { PlayerSide } from '../../../Player/Player';
import { Position } from '../../../Zone/Zone';
import { getSpellFootprint } from '../../../Spell/Spell';
import { getForceRoom } from '../../../Selectors/SpellSelectors';

export type CastSpellParams = {
	game: Game;
	player: PlayerSide;
	/** A Spell currently in the shared spell display. */
	spellId: string;
	/** The cell the caster anchors the footprint on. */
	anchor: Position;
};

/**
 * Casts a Spell from the shared display — a full main-turn action. Pays the
 * Spell's Force cost by sliding the Rift toward the opponent (capped: you can
 * never push yourself to a Rift Break), applies the effect to the footprint,
 * then refills the display and ends the turn.
 */
export class CastSpell implements GameCommand<CastSpellParams> {
	constructor(public name: string, public params: CastSpellParams) {}

	public execute(): GameCommandResult {
		const { game, player, spellId, anchor } = this.params;

		const error = validateGame(
			[IS_PLAYERS_TURN, IS_PHASE('main-turn'), HAS_NO_PENDING_DRAWS],
			{ game, player }
		);
		if (error) return failGameCommand(error);

		if (!game.options.spells) return failGameCommand(GameError.SpellsDisabled());

		const spell = game.spellDisplay.find(s => s.id === spellId);
		if (!spell) return failGameCommand(GameError.InvalidSpellSelection(`Spell ${spellId} is not in the display`));

		if (anchor.row < 0 || anchor.row > 5 || anchor.col < 0 || anchor.col > 5) {
			return failGameCommand(GameError.InvalidSpellTarget(`Anchor (${anchor.row}, ${anchor.col}) is off the board`));
		}

		if (getForceRoom(game, player) < spell.forceCost) {
			return failGameCommand(GameError.InsufficientForce(`Need ${spell.forceCost} Force; the Rift lacks room`));
		}

		const footprint = getSpellFootprint(spell.shape, anchor);

		const commands: GameCommand[] = [
			clientGameCommand('RefillSpellDisplay', {}),
			clientGameCommand('EndTurn', { player }),
		];

		return okGameCommand([new SpellCast({ player, spell, anchor, footprint })], commands);
	}
}
