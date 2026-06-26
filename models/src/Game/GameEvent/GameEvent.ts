import { AppEvent } from '@moscoso/models';
import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { Color } from '../../Element/Element';
import { Glyph } from '../../Glyph/Glyph';
import { Die } from '../../Die/Die';
import { Score } from '../Game';
import { GameSeed } from '../GameSeed/GameSeed';

export const GAME_EVENT_TYPES = [
	'Game Started',
	'Glyph Inscribed',
	'Dice Rerolled',
	'Turn Ended',
	'Game Ended',
] as const;

export type GameEventType = typeof GAME_EVENT_TYPES[number];

type PlayerPayload   = { player: PlayerSide };
type PositionPayload = { position: Position };

export abstract class GameEvents<P> extends AppEvent<GameEventType, P> {
	override payload: P;
	constructor(payload?: P) {
		super();
		this.payload = payload ?? {} as P;
	}
}

// ─── Game Started ────────────────────────────────────────────────────────────
export class GameStarted extends GameEvents<GameSeed> {
	override readonly type = 'Game Started';
}

// ─── Glyph Inscribed ─────────────────────────────────────────────────────────
/**
 * A die is inscribed and its Crux's cross fires. The chain is resolved up front
 * by the command, so the payload carries the placement plus the already-computed
 * fired cells and score/rift deltas; reducers just apply them.
 */
type GlyphInscribedPayload = PlayerPayload & PositionPayload & {
	/** The matched die color (decides which Crux fires). */
	color: Color;
	/** The glyph face that was inscribed. */
	glyph: Glyph;
	/** Cells that fired during the chain, in resolution order (placed cell first). */
	firedCells: Position[];
	/** Points gained by each side this chain. */
	scoreDelta: Score;
	/** Signed Rift movement this chain (+ toward Light, − toward Dark). */
	riftDelta: number;
};
export class GlyphInscribed extends GameEvents<GlyphInscribedPayload> {
	override readonly type = 'Glyph Inscribed';
}

// ─── Dice Rerolled ───────────────────────────────────────────────────────────
/** The full post-reroll dice pool and the advanced RNG cursor. */
type DiceRerolledPayload = { dice: Die[]; rngCursor: number };
export class DiceRerolled extends GameEvents<DiceRerolledPayload> {
	override readonly type = 'Dice Rerolled';
}

// ─── Turn Ended ──────────────────────────────────────────────────────────────
type TurnEndedPayload = PlayerPayload;
export class TurnEnded extends GameEvents<TurnEndedPayload> {
	override readonly type = 'Turn Ended';
}

// ─── Game Ended ──────────────────────────────────────────────────────────────
type GameEndedPayload = {
	winner: PlayerSide | null;
	reason: 'rift-break' | 'end-score';
};
export class GameEnded extends GameEvents<GameEndedPayload> {
	override readonly type = 'Game Ended';
}

export type GameEvent =
	GameStarted |
	GlyphInscribed |
	DiceRerolled |
	TurnEnded |
	GameEnded;
