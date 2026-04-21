import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs';
import { WebsocketService } from '../../websocket/websocket.service';
import { DealerActions } from './dealer.actions';

const DEFAULT_ROOM_ID = 'blackhole';

export const hostSignaledEffect = createEffect(
    (actions$ = inject(Actions), socket = inject(WebsocketService)) =>
        actions$.pipe(
            ofType(DealerActions.hostSignaled),
            tap(({ command }) => socket.emitTableAction(command, DEFAULT_ROOM_ID))
        ),
    { functional: true, dispatch: false }
);

export const playerSignaledEffect = createEffect(
    (actions$ = inject(Actions), socket = inject(WebsocketService)) =>
        actions$.pipe(
            ofType(DealerActions.playerSignaled),
            tap(({ command }) => socket.emitGameAction(command, DEFAULT_ROOM_ID))
        ),
    { functional: true, dispatch: false }
);

export const dealerEffects = {
    hostSignaledEffect,
    playerSignaledEffect,
};
