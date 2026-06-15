import { GameEvent, RuneInscribed } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph } from '../../../Glyph/Glyph';
import { PlayerSide } from '../../../Player/Player';
import { getElementsForPosition, getZonesForPosition } from '../../../Selectors/GameSelectors';

export function riftReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Rune Inscribed': {
			const delta = inscribeRiftDelta(state, event.payload);
			return delta === 0 ? state : { ...state, rift: clampRift(state.rift + delta) };
		}

		case 'Spell Cast': {
			// Casting spends Force: the Rift slides toward the caster's opponent.
			const { player, spell } = event.payload;
			return { ...state, rift: clampRift(state.rift - toward(player, spell.forceCost)) };
		}

		default:
			return state;
	}
}

/**
 * Net Rift shift from an inscription (signed light-positive), summing three
 * independent pulls:
 * - the inscriber's own ▲ activations;
 * - Affinity in `rift` mode — each home-Zone card paid pulls one step toward the
 *   inscriber (a ▲ baked into Affinity rather than a payment discount). In the
 *   cross model a cell has two home suits, so a card matching either one counts.
 * - the Crux Force tax — inscribing inside a Zone an OPPONENT controls tugs one
 *   step toward that owner, the price of trespassing. In the cross model a cell
 *   sits in two Zones, so each opponent-controlled Zone levies the toll (up to 2).
 *
 * Zone geometry/control is read pre-inscribe (zonesReducer runs after this), so a
 * Rune that flips the Crux still pays the toll to the side it just dethroned.
 */
function inscribeRiftDelta(state: Game, payload: RuneInscribed['payload']): number {
	const { player, position, activations, paidCards } = payload;

	let delta = toward(player, activations.filter((a: Glyph) => a === '▲').length);

	if (state.options.affinity === 'rift') {
		const homeElements = getElementsForPosition(state, position);
		delta += toward(player, paidCards.filter(c => homeElements.includes(c.element)).length);
	}

	if (state.options.cruxBonus.force) {
		for (const zone of getZonesForPosition(state, position)) {
			const owner = zone.control;
			if (owner !== player && owner !== 'unbound') delta += toward(owner, 1);
		}
	}

	return delta;
}

/** A signed step count toward `player` — light pulls positive, dark negative. */
const toward = (player: PlayerSide, steps: number): number => (player === 'light' ? steps : -steps);

/** Keep the Rift inside its ±8 Rift-Break bounds. */
const clampRift = (value: number): number => Math.max(-8, Math.min(8, value));
