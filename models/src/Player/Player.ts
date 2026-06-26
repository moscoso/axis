export type PlayerSide = 'light' | 'dark';

export interface PlayerState {
	side: PlayerSide;
}

export type PlayerMap = Record<PlayerSide, PlayerState>;

export function createPlayer(side: PlayerSide): PlayerState {
	return { side };
}
