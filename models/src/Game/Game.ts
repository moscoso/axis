import { UserID } from '@moscoso/models';
import { PlayerMap, PlayerSide } from '../Player/Player';
import { Color } from '../Element/Element';
import { Position, Crux } from '../Zone/Zone';
import { Glyph } from '../Glyph/Glyph';
import { Die } from '../Die/Die';
import { DEFAULT_OPTIONS, GameOptions } from './GameOptions';

export type GamePhase = 'setup' | 'main-turn' | 'game-over';

/** A placed marker: a player's stone stamped with the inscribed glyph face. */
export interface Stone {
	owner: PlayerSide;
	glyph: Glyph;
}

export interface BoardCell {
	position: Position;
	/** Color of the Crux owning this cell's row. */
	rowColor: Color;
	/** Color of the Crux owning this cell's column. Equals rowColor only on a Crux cell. */
	colColor: Color;
	/** The inscribed stone, or null while empty. Crux cells stay null forever. */
	stone: Stone | null;
	hasCrux: boolean;
	/** The Crux's color when `hasCrux`, else null. */
	cruxColor: Color | null;
}

/** Per-side running point totals (from `+` Pulse and `X` Cross firings). */
export interface Score {
	light: number;
	dark: number;
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

	/** The six Cruxes, one per color, on distinct rows and columns. */
	cruxes: Crux[];

	/** The public pool of six dice (one per color). Never consumed; rerolled in place. */
	dice: Die[];

	/** Identity for both players (hands removed — there are no cards). */
	players: PlayerMap;

	/** The user IDs mapped to their side — set on Game Started, null before setup. */
	playerIds: { light: UserID; dark: UserID } | null;

	/** The side whose turn it is */
	currentTurn: PlayerSide;

	/**
	 * The Rift track value.
	 * +6 = Light wins via Rift Break.
	 * −6 = Dark wins via Rift Break.
	 */
	rift: number;

	/** Running point totals for both sides. */
	score: Score;

	/** Seed for the deterministic dice PRNG (carried from the {@link GameSeed}). */
	rngSeed: number;

	/**
	 * Number of dice rolls performed so far. Combined with the seed it makes
	 * every roll/reroll reproducible for deterministic replay.
	 */
	rngCursor: number;

	/** The frozen-in options this game was started with. */
	options: GameOptions;

	/** Set when a victory condition is met */
	winner: PlayerSide | null;

	/** Reason the game ended */
	winReason: 'rift-break' | 'end-score' | null;

	createdAt: number;
	updatedAt: number;
}

const INIT_STATE: Game = {
	id: '',
	phase: 'setup',
	board: [],
	cruxes: [],
	dice: [],
	players: {
		light: { side: 'light' },
		dark:  { side: 'dark' }
	},
	playerIds: null,
	currentTurn: 'light',
	rift: 0,
	score: { light: 0, dark: 0 },
	rngSeed: 0,
	rngCursor: 0,
	options: DEFAULT_OPTIONS,
	winner: null,
	winReason: null,
	createdAt: 0,
	updatedAt: 0
};

/** Light wins Rift Break at +6, Dark at −6. */
export const RIFT_TERMINAL = 6;

/** The initial (empty) state of a {@link Game} before setup runs. */
export const INIT_GAME_STATE: Game = Object.freeze<Game>(INIT_STATE);
