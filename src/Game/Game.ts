import { UserID } from '@moscoso/models';
import { Card } from '../Card/Card';
import { PlayerMap, PlayerSide } from '../Player/Player';
import { Position, Zone } from '../Zone/Zone';
import { Glyph } from '../Glyph/Glyph';

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

	/**
	 * Number of draw activations the active player still needs to resolve.
	 * Set by {@link RuneInscribed} and decremented by {@link CardDrawnFromDisplay}.
	 * When > 0, only DrawFromDisplay is valid.
	 */
	pendingDraws: number;

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
	pendingDraws: 0,
	winner: null,
	winReason: null,
	createdAt: 0,
	updatedAt: 0
};

/** The initial (empty) state of a {@link Game} before setup runs. */
export const INIT_GAME_STATE: Game = Object.freeze<Game>(INIT_STATE);
