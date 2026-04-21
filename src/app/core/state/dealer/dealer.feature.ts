import { Action, createFeature, createReducer, on } from '@ngrx/store';
import { Game, Table } from 'axis-models';
import { DealerActions } from './dealer.actions';
import { DealerState, INIT_DEALER } from './dealer.state';

/** Any dispatched action may piggy-back a fresh snapshot attached by the socket layer. */
interface SnapshotAction extends Action {
    game?: Game;
    table?: Table;
}

/**
 * The dealer reducer merges socket-delivered game + table snapshots into the
 * store and manages ephemeral UI state (focused cards, resource diff, victory
 * screen). Any dispatched {@link GameEvent} or {@link TableEvent} that arrives
 * with an attached `game` or `table` snapshot is treated as a delta update.
 */
const dealerReducer = createReducer<DealerState>(
    INIT_DEALER,
    on(DealerActions.deltaUpdated, (state, { game, table }) => ({ ...state, game, table })),
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
 * any dispatched {@link GameEvent} or {@link TableEvent}. Mirrors the pattern
 * from starwars-pwa where socket events arrive with a fresh snapshot attached.
 */
function applyEventSnapshots(state: DealerState, action: Action): DealerState {
    const event = action as SnapshotAction;
    if (!event.game && !event.table) {
        return state;
    }
    return {
        ...state,
        game: event.game ?? state.game,
        table: event.table ?? state.table,
    };
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
} = dealerFeature;
