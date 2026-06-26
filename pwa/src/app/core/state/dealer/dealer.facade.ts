import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import {
    Color,
    GameCommand,
    GameEvent,
    Game,
    PlayerSide,
    PlayerState,
    Seat,
    Table,
    TableCommand,
    TableEvent,
} from 'axis-models';
import { firstValueFrom, map, Observable } from 'rxjs';
import { DealerActions } from './dealer.actions';
import { selectDealerState, selectGame } from './dealer.feature';
import {
    selectPlayer,
    selectUserAsPlayer,
    selectUserIsSeated,
    selectUserSeat,
} from './dealer.selector';
import { DealerState } from './dealer.state';

@Injectable({ providedIn: 'root' })
export class DealerFacade {
    private readonly store = inject(Store);

    get<T>(observable: Observable<T>): Promise<T> {
        return firstValueFrom(observable);
    }

    closeVictoryScreen(): void {
        this.store.dispatch(DealerActions.victoryScreenClosed());
    }

    /** Arm a die (by color) to inscribe with. */
    selectDie(color: Color): void {
        this.store.dispatch(DealerActions.dieSelected({ color }));
    }

    /** Clear the armed die. */
    unselectDie(): void {
        this.store.dispatch(DealerActions.dieUnselected());
    }

    /** Dispatch a DeltaUpdated event to the store. */
    receivedDeltaEvent(game: Game, table: Table): void {
        this.store.dispatch(DealerActions.deltaUpdated({ game, table }));
    }

    /** Dispatch a {@link GameEvent} to the store. Implements {@link Action} via its `type`. */
    receivedGameEvent(event: GameEvent, update: Game): void {
        this.store.dispatch({ ...event, game: update } as unknown as ReturnType<
            typeof DealerActions.deltaUpdated
        >);
    }

    /** Dispatch a {@link TableEvent} to the store. */
    receivedTableEvent(event: TableEvent, update: Table): void {
        this.store.dispatch({ ...event, table: update } as unknown as ReturnType<
            typeof DealerActions.deltaUpdated
        >);
    }

    signalAsPlayer(command: GameCommand): void {
        this.store.dispatch(DealerActions.playerSignaled({ command }));
    }

    signalAsHost(command: TableCommand): void {
        this.store.dispatch(DealerActions.hostSignaled({ command }));
    }

    selectState(): Observable<DealerState>;
    selectState<K extends keyof DealerState>(propertyName: K): Observable<DealerState[K]>;
    selectState<K extends keyof DealerState>(
        propertyName?: K
    ): Observable<DealerState | DealerState[K]> {
        const state$ = this.store.select(selectDealerState);
        if (!propertyName) {
            return state$;
        }
        return state$.pipe(map(state => state[propertyName]));
    }

    selectGame(): Observable<Game> {
        return this.store.select(selectGame);
    }

    selectPlayer(side: PlayerSide): Observable<PlayerState> {
        return this.store.select(selectPlayer(side));
    }

    async selectUsersPlayerSide(): Promise<PlayerSide | undefined> {
        const player = await firstValueFrom(this.store.select(selectUserAsPlayer));
        return player?.side;
    }

    selectUserAsPlayer(): Observable<PlayerState | undefined> {
        return this.store.select(selectUserAsPlayer);
    }

    selectUserSeat(): Observable<Seat | null> {
        return this.store.select(selectUserSeat);
    }

    selectUserIsSeated(): Observable<boolean> {
        return this.store.select(selectUserIsSeated);
    }
}
