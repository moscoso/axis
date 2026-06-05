import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';
import { Glyph } from '../../../Glyph/Glyph';
import { getZoneForPosition } from '../../../Selectors/GameSelectors';

export function riftReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Rune Inscribed': {
			const { player, position, activations } = event.payload;

			// The inscriber's own ▲ activations push the Rift toward their side.
			const forceCount = activations.filter((a: Glyph) => a === '▲').length;
			let delta = player === 'light' ? forceCount : -forceCount;

			// Crux Force (tax): inscribing inside a Zone an OPPONENT controls tugs
			// the Rift one step toward that owner — the price of trespassing. Control
			// is read pre-inscribe (zones.reducer runs after this), so a Rune that
			// flips the Crux still pays the toll to the side it just dethroned.
			if (state.options.cruxBonus.force) {
				const owner = getZoneForPosition(state, position).control;
				if (owner !== player && owner !== 'unbound') {
					delta += owner === 'light' ? 1 : -1;
				}
			}

			if (delta === 0) return state;
			const newRift = Math.max(-8, Math.min(8, state.rift + delta));
			return { ...state, rift: newRift };
		}

		case 'Spell Cast': {
			// Casting spends Force: the Rift slides toward the caster's opponent.
			const { player, spell } = event.payload;
			const delta = player === 'light' ? -spell.forceCost : spell.forceCost;
			const newRift = Math.max(-8, Math.min(8, state.rift + delta));
			return { ...state, rift: newRift };
		}

		default:
			return state;
	}
}
