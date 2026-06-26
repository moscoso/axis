import { UserID } from '@moscoso/models';
import { BoardCell } from '../Game';
import { GameOptions } from '../GameOptions';
import { Crux } from '../../Zone/Zone';
import { Die } from '../../Die/Die';

/**
 * A {@link GameSeed} captures everything needed to reproduce the exact starting
 * state of an AXIS game — board layout, Crux placement, the initial dice faces,
 * the RNG seed driving every future reroll, side assignment, and the rules in
 * effect. Each game begins from a unique seed.
 */
export interface GameSeed {
	board:       BoardCell[][];
	cruxes:      Crux[];
	/** The six pool dice with their initial rolled faces. */
	dice:        Die[];
	/** Seed for the deterministic dice PRNG; replays every reroll identically. */
	rngSeed:     number;
	/** Dice draws already consumed by the initial roll (= 6). */
	rngCursor:   number;
	lightPlayer: UserID;
	darkPlayer:  UserID;
	/** House-rule knobs snapshotted from the table at start time. */
	options:     GameOptions;
	createdAt:   number;
}
