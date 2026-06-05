import { Game } from '../Game/Game';
import { PlayerSide } from '../Player/Player';
import { Position } from '../Zone/Zone';
import { SpellShape, getSpellFootprint } from '../Spell/Spell';

/**
 * Steps of Force `player` can spend on Spells right now — how far the Rift can
 * still slide toward the opponent before reaching their winning edge. Casting
 * may approach that edge but never reach it (no self-inflicted Rift Break), so
 * a Spell is castable only when its `forceCost` is ≤ this value.
 *
 * Light pushes the Rift toward −8, Dark toward +8; both stop one short.
 */
export function getForceRoom(state: Game, player: PlayerSide): number {
	const room = player === 'light' ? state.rift + 7 : 7 - state.rift;
	return Math.max(0, room);
}

/**
 * The caster's own runes inside a Spell's footprint anchored at `anchor` — the
 * cells a Charge would buff. Off-board footprint cells are already clipped.
 */
export function getSpellChargeTargets(
	state: Game,
	player: PlayerSide,
	shape: SpellShape,
	anchor: Position,
): Position[] {
	return getSpellFootprint(shape, anchor).filter(
		p => state.board[p.row][p.col].rune?.owner === player
	);
}
