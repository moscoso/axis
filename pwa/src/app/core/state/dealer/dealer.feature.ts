import { Action, createFeature, createReducer, on } from '@ngrx/store';
import { Game, Table } from 'axis-models';
import { DealerActions } from './dealer.actions';
import { DealerState, EventLogEntry, INIT_DEALER } from './dealer.state';

/** Any dispatched action may piggy-back a fresh snapshot attached by the socket layer. */
interface SnapshotAction extends Action {
    game?: Game;
    table?: Table;
    eventNumber?: number;
    timestamp?: Date | string | number;
}

const MAX_LOG_ENTRIES = 50;

/**
 * The dealer reducer merges socket-delivered game + table snapshots into the
 * store and manages ephemeral UI state (focused cards, resource diff, victory
 * screen). Any dispatched {@link GameEvent} or {@link TableEvent} that arrives
 * with an attached `game` or `table` snapshot is treated as a delta update.
 */
const dealerReducer = createReducer<DealerState>(
    INIT_DEALER,
    on(DealerActions.deltaUpdated, (state, { game, table }) => ({
        ...state,
        // Server may send undefined for an unknown room — keep current state in
        // that case rather than nulling out the store.
        game: game ?? state.game,
        table: table ?? state.table,
    })),
    on(DealerActions.cancelDeclare, state => ({
        ...state,
        declaredCardToPlay: undefined,
        resourceDiff: 0,
    })),
    on(DealerActions.playerSignaled, state => ({
        ...state,
        resourceDiff: 0,
        cardContext: undefined,
    })),
    on(DealerActions.abilityCanceled, state => ({ ...state, selectedAbility: undefined })),
    on(DealerActions.victoryScreenClosed, state => ({ ...state, victoryScreenClosed: true }))
);

/**
 * A fall-through reducer that applies `game`/`table` snapshots piggy-backed onto
 * any dispatched {@link GameEvent} or {@link TableEvent}. Also appends a log
 * entry for any action that carries an axis-models-shaped event payload
 * (`eventNumber` + `type`), bounded to the most recent MAX_LOG_ENTRIES.
 */
function applyEventSnapshots(state: DealerState, action: Action): DealerState {
    const event = action as SnapshotAction;
    const hasSnapshot = !!event.game || !!event.table;
    const isEvent = typeof event.eventNumber === 'number' && typeof event.type === 'string';
    if (!hasSnapshot && !isEvent) {
        return state;
    }

    const next: DealerState = {
        ...state,
        game: event.game ?? state.game,
        table: event.table ?? state.table,
    };

    if (isEvent) {
        const entry: EventLogEntry = {
            id: event.eventNumber!,
            type: event.type!,
            at: toEpochMs(event.timestamp),
        };
        next.events = [...state.events, entry].slice(-MAX_LOG_ENTRIES);
    }

    return next;
}

function toEpochMs(ts: Date | string | number | undefined): number {
    if (ts === undefined) return Date.now();
    if (ts instanceof Date) return ts.getTime();
    if (typeof ts === 'number') return ts;
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? Date.now() : parsed;
}

export const dealerFeature = createFeature({
    name: 'dealer',
    reducer: (state: DealerState | undefined, action: Action): DealerState => {
        const snapshotApplied = applyEventSnapshots(state ?? INIT_DEALER, action);
        return dealerReducer(snapshotApplied, action);
    },
});

export const {
    name: dealerFeatureKey,
    reducer: dealerReducerExport,
    selectDealerState,
    selectGame,
    selectTable,
    selectCardContext,
    selectDeclaredCardToPlay,
    selectSelectedAbility,
    selectResourceDiff,
    selectVictoryScreenClosed,
    selectEvents,
} = dealerFeature;
