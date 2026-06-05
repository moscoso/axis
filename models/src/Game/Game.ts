import { UserID } from '@moscoso/models';
import { Card } from '../Card/Card';
import { PlayerMap, PlayerSide } from '../Player/Player';
import { Position, Zone } from '../Zone/Zone';
import { Glyph } from '../Glyph/Glyph';
import { SpellCard } from '../Spell/Spell';
import { DEFAULT_OPTIONS, GameOptions } from './GameOptions';

export type GamePhase = 'setup' | 'starting-draft' | 'main-turn' | 'game-over';

export interface Rune {
	owner: PlayerSide;
	flux: number; // starts at 0 (Null Rune)
}

export interface BoardCell {
	position: Position;
	zoneId: string;
	glyphs: Glyph[];
	rune: Rune | null;
	hasCrux: boolean;
}

/**
 * A {@link Game} is a POJO that represents the complete state of an AXIS game.
 */
export interface Game {
	/** Unique identifier of the game */
	id: string;

	/** Current phase of the game */
	phase: GamePhase;

	/** 6×6 grid of BoardCells, indexed as board[row][col] */
	board: BoardCell[][];

	/** The four elemental Zones, each holding a Crux */
	zones: Zone[];

	/** Hand and identity for both players */
	players: PlayerMap;

	/** The user IDs mapped to their side — set on Game Started, null before setup. */
	playerIds: { light: UserID; dark: UserID } | null;

	/** The side whose turn it is */
	currentTurn: PlayerSide;

	/**
	 * The Rift track value.
	 * +8 = Light wins via Rift Break.
	 * −8 = Dark wins via Rift Break.
	 */
	rift: number;

	/** Draw pile (ordered; index 0 = top of deck) */
	deck: Card[];

	/** Public discard pile */
	discard: Card[];

	/** The two face-up cards available for the Draw action */
	display: Card[];

	/** Spell draw pile (index 0 = top). Empty when spells are disabled. */
	spellDeck: SpellCard[];

	/** Face-up Spells either player may cast on their turn. */
	spellDisplay: SpellCard[];

	/** Spent Spells, reshuffled into the spell deck when it runs dry. */
	spellDiscard: SpellCard[];

	/**
	 * Number of ◇ activation draws the active player still needs to resolve,
	 * queued by {@link RuneInscribed}. Decremented on {@link CardDrawn}.
	 */
	pendingDraws: number;

	/**
	 * Draws that were granted to the active player at the START of their turn
	 * (see {@link GameOptions.startOfTurnDraws}). Resolved the same way as
	 * `pendingDraws` but via a separate counter so the "end-turn after last
	 * draw" logic only triggers on the ◇-activation branch.
	 */
	pendingStartOfTurnDraws: number;

	/** The frozen-in options this game was started with. */
	options: GameOptions;

	/** Set when a victory condition is met */
	winner: PlayerSide | null;

	/** Reason the game ended */
	winReason: 'rift-break' | 'fluxmate' | 'last-rune' | null;

	createdAt: number;
	updatedAt: number;
}

const INIT_STATE: Game = {
	id: '',
	phase: 'setup',
	board: [],
	zones: [],
	players: {
		light: { side: 'light', hand: [] },
		dark:  { side: 'dark',  hand: [] }
	},
	playerIds: null,
	currentTurn: 'light',
	rift: 0,
	deck: [],
	discard: [],
	display: [],
	spellDeck: [],
	spellDisplay: [],
	spellDiscard: [],
	pendingDraws: 0,
	pendingStartOfTurnDraws: 0,
	options: DEFAULT_OPTIONS,
	winner: null,
	winReason: null,
	createdAt: 0,
	updatedAt: 0
};

/** The initial (empty) state of a {@link Game} before setup runs. */
export const INIT_GAME_STATE: Game = Object.freeze<Game>(INIT_STATE);
