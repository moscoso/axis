import { User } from '@moscoso/models';

export type TableStatus = 'waiting' | 'ready' | 'in-progress' | 'finished';

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
	createdAt: number;
	updatedAt: number;
}

export const INIT_TABLE_STATE: Table = {
	id: '',
	seats: [null, null],
	status: 'waiting',
	createdAt: 0,
	updatedAt: 0,
};
