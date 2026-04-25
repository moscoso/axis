import { Card } from '../Card/Card';

export type PlayerSide = 'light' | 'dark';

export interface PlayerState {
	side: PlayerSide;
	hand: Card[];
}

export type PlayerMap = Record<PlayerSide, PlayerState>;

export function createPlayer(side: PlayerSide): PlayerState {
	return { side, hand: [] };
}
