import { User } from '@moscoso/models';
import { DEFAULT_OPTIONS, GameOptions } from '../Game/GameOptions';

/**
 * Derived purely from seat occupancy:
 * - `'waiting'` — at least one seat is empty.
 * - `'ready'` — both seats are filled.
 *
 * Game progress / over-ness is owned by {@link Game.phase}, not the table.
 * Earlier `'in-progress'` and `'finished'` values were never actually set
 * by any reducer path and were removed.
 */
export type TableStatus = 'waiting' | 'ready';

/** The side a player prefers to play, or 'random' to let the game decide. */
export type SidePreference = 'light' | 'dark' | 'random';

/**
 * An occupied seat — the seated player plus their (optional) side preference.
 * `sidePreference` is null until the player explicitly calls SelectSide.
 */
export interface Seat {
	user: User;
	sidePreference: SidePreference | null;
}

/**
 * A {@link Table} represents the lobby layer of an AXIS game.
 * It tracks who is seated and each player's side preference.
 * Actual side resolution (light vs dark) is deferred to the StartGame command.
 */
export interface Table {
	id: string;
	/** The two seats — a {@link Seat} when occupied, null when empty. */
	seats: [Seat | null, Seat | null];
	status: TableStatus;
	/** Tunable rules for games launched from this table. */
	options: GameOptions;
	createdAt: number;
	updatedAt: number;
}

export const INIT_TABLE_STATE: Table = {
	id: '',
	seats: [null, null],
	status: 'waiting',
	options: DEFAULT_OPTIONS,
	createdAt: 0,
	updatedAt: 0,
};
