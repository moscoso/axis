import { Card, Game, INIT_GAME_STATE, INIT_TABLE_STATE, Table } from 'axis-models';

export interface DealerState {
    cardContext: string | undefined;
    declaredCardToPlay: Card | undefined;
    error: unknown;
    fetching: boolean;
    game: Game;
    resourceDiff: number;
    selectedAbility: Card | undefined;
    table: Table;
    victoryScreenClosed: boolean;
}

export const INIT_DEALER: DealerState = {
    cardContext: undefined,
    declaredCardToPlay: undefined,
    error: null,
    fetching: false,
    game: INIT_GAME_STATE,
    resourceDiff: 0,
    selectedAbility: undefined,
    table: INIT_TABLE_STATE,
    victoryScreenClosed: false,
};
