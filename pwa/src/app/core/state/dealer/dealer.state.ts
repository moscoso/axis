import { Color, Game, INIT_GAME_STATE, INIT_TABLE_STATE, Table } from 'axis-models';

/** One entry in the dealer's bounded event log — shown in the UI event stream. */
export interface EventLogEntry {
    id: number;
    /** Event `type` string as published by axis-models (e.g. "Glyph Inscribed"). */
    type: string;
    /** Epoch ms when the entry was recorded on the client. */
    at: number;
}

export interface DealerState {
    error: unknown;
    fetching: boolean;
    game: Game;
    table: Table;
    /** Color of the die the player has armed to inscribe, if any. */
    selectedDieColor: Color | undefined;
    victoryScreenClosed: boolean;
    events: EventLogEntry[];
}

export const INIT_DEALER: DealerState = {
    error: null,
    fetching: false,
    game: INIT_GAME_STATE,
    table: INIT_TABLE_STATE,
    selectedDieColor: undefined,
    victoryScreenClosed: false,
    events: [],
};
