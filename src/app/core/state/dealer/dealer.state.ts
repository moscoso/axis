import { Card, Game, INIT_GAME_STATE, INIT_TABLE_STATE, Table } from 'axis-models';

/** One entry in the dealer's bounded event log — shown in the UI event stream. */
export interface EventLogEntry {
    id: number;
    /** Event `type` string as published by axis-models (e.g. "Rune Inscribed"). */
    type: string;
    /** Epoch ms when the entry was recorded on the client. */
    at: number;
}

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
    events: EventLogEntry[];
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
    events: [],
};
