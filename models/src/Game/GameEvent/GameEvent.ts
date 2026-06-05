import { AppEvent } from '@moscoso/models';
import { Card } from '../../Card/Card';
import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { Glyph } from '../../Glyph/Glyph';
import { SpellCard } from '../../Spell/Spell';
import { Rune } from '../Game';
import { GameSeed } from '../GameSeed/GameSeed';

export const GAME_EVENT_TYPES = [
	'Card Drawn',
	'Deck Reshuffled',
	'Display Refilled',
	'Draft Completed',
	'Game Ended',
	'Game Started',
	'Rune Inscribed',
	'Spell Cast',
	'Spell Deck Reshuffled',
	'Spell Display Refilled',
	'Turn Ended'
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

// ─── Card Drawn ───────────────────────────────────────────────────────────────
type CardDrawnPayload = PlayerPayload & { card: Card; from: 'display' | 'deck' };
export class CardDrawn extends GameEvents<CardDrawnPayload> {
	override readonly type = 'Card Drawn';
}

// ─── Deck Reshuffled ─────────────────────────────────────────────────────────
type DeckReshuffledPayload = { newDeck: Card[] };
export class DeckReshuffled extends GameEvents<DeckReshuffledPayload> {
	override readonly type = 'Deck Reshuffled';
}

// ─── Display Refilled ────────────────────────────────────────────────────────
type DisplayRefilledPayload = { card: Card };
export class DisplayRefilled extends GameEvents<DisplayRefilledPayload> {
	override readonly type = 'Display Refilled';
}

// ─── Draft Completed ─────────────────────────────────────────────────────────
/** Dark's 2 picks, Light's 2 remainder, and the 2 fresh display cards — all in one shot. */
type DraftCompletedPayload = { darkCards: Card[]; lightCards: Card[]; displayCards: Card[] };
export class DraftCompleted extends GameEvents<DraftCompletedPayload> {
	override readonly type = 'Draft Completed';
}

// ─── Game Started ────────────────────────────────────────────────────────────
export class GameStarted extends GameEvents<GameSeed> {
	override readonly type = 'Game Started';
}

// ─── Game Ended ──────────────────────────────────────────────────────────────
type GameEndedPayload = {
	winner: PlayerSide | null;
	reason: 'rift-break' | 'fluxmate' | 'last-rune';
};
export class GameEnded extends GameEvents<GameEndedPayload> {
	override readonly type = 'Game Ended';
}

// ─── Rune Inscribed ──────────────────────────────────────────────────────────
type RuneInscribedPayload = PlayerPayload & PositionPayload & {
	rune: Rune;
	paidCards: Card[];
	activations: Glyph[];
};
export class RuneInscribed extends GameEvents<RuneInscribedPayload> {
	override readonly type = 'Rune Inscribed';
}

// ─── Spell Cast ──────────────────────────────────────────────────────────────
type SpellCastPayload = PlayerPayload & {
	spell: SpellCard;
	anchor: Position;
	/** On-board cells the footprint covers (already clipped to the board). */
	footprint: Position[];
};
export class SpellCast extends GameEvents<SpellCastPayload> {
	override readonly type = 'Spell Cast';
}

// ─── Spell Deck Reshuffled ───────────────────────────────────────────────────
type SpellDeckReshuffledPayload = { newDeck: SpellCard[] };
export class SpellDeckReshuffled extends GameEvents<SpellDeckReshuffledPayload> {
	override readonly type = 'Spell Deck Reshuffled';
}

// ─── Spell Display Refilled ──────────────────────────────────────────────────
type SpellDisplayRefilledPayload = { spell: SpellCard };
export class SpellDisplayRefilled extends GameEvents<SpellDisplayRefilledPayload> {
	override readonly type = 'Spell Display Refilled';
}

// ─── Turn Ended ──────────────────────────────────────────────────────────────
type TurnEndedPayload = PlayerPayload;
export class TurnEnded extends GameEvents<TurnEndedPayload> {
	override readonly type = 'Turn Ended';
}

export type GameEvent =
	CardDrawn |
	DeckReshuffled |
	DisplayRefilled |
	DraftCompleted |
	GameEnded |
	GameStarted |
	RuneInscribed |
	SpellCast |
	SpellDeckReshuffled |
	SpellDisplayRefilled |
	TurnEnded;
