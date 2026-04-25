import { ApplicationRef, inject, Injectable } from '@angular/core';
import { Game, GameCommand, INIT_GAME_STATE, TableCommand, gameReducer } from 'axis-models';
import { Observable } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { DealerFacade } from '../state/dealer/dealer.facade';
import { DefaultSocket } from './DefaultSocket';

export const DEFAULT_ROOM_ID = 'blackhole';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
    private static socket: DefaultSocket;

    /** The room the client is currently subscribed to. Mutable so the user can
     *  switch rooms (e.g. enter the `bot-test` room via "Play vs AI"). Effects
     *  and emitters read from this rather than a const so a single switch
     *  redirects all subsequent traffic without re-plumbing every dispatcher. */
    private currentRoomID: string = DEFAULT_ROOM_ID;

    /**
     * Running mirror of the latest authoritative {@link Game} snapshot, kept in
     * sync with the store via DeltaUpdate / GameUpdate. We use it as the
     * starting state for client-side replay through {@link gameReducer} so we
     * can dispatch each individual event with its OWN intermediate snapshot
     * — otherwise every event in a batch would carry the same end-of-batch
     * state and NgRx devtools time travel through actions would all show the
     * final game (board "stuck", everything else apparently changing because
     * it's keyed off action type, not game payload).
     */
    private latestGame: Game = INIT_GAME_STATE;

    private readonly appRef = inject(ApplicationRef);
    private readonly dealer = inject(DealerFacade);
    private readonly toast = inject(ToastService);

    constructor() {
        if (!WebsocketService.socket) {
            WebsocketService.socket = new DefaultSocket(this.appRef);
        }
    }

    /** Connect to the websocket and listen to socket events. */
    join(userID: string, roomID: string = DEFAULT_ROOM_ID): void {
        this.currentRoomID = roomID;
        WebsocketService.socket.emit('connectionHandshake', { userID });
        WebsocketService.socket.emit('SyncRequested', { roomID });
        this.listen();
    }

    /**
     * Switch the client to a different room mid-session. Re-issues a
     * SyncRequested so the new room's table/game state arrives. Subsequent
     * gameAction/tableAction emits will target this room.
     */
    switchRoom(roomID: string): void {
        if (this.currentRoomID === roomID) return;
        this.currentRoomID = roomID;
        WebsocketService.socket.emit('SyncRequested', { roomID });
    }

    /** The room id all subsequent emits target. */
    getCurrentRoomID(): string {
        return this.currentRoomID;
    }

    listen(): void {
        const socket = WebsocketService.socket;
        socket.on('connect', () =>
            WebsocketService.socket.emit('SyncRequested', { roomID: this.currentRoomID })
        );
        socket.on('DeltaUpdate', (payload: { game: any; table: any }) => {
            const roomDoesNotExistOnServer = !payload.game && !payload.table;
            if (roomDoesNotExistOnServer) {
                this.toast.failed(`Room "${this.currentRoomID}" not found on server`);
                return;
            }
            if (payload.game) this.latestGame = payload.game;
            this.dealer.receivedDeltaEvent(payload.game, payload.table);
        });
        socket.fromEvent('GameUpdate').subscribe((update: any) => {
            // Replay each event through gameReducer locally so the dispatched
            // action carries its own per-event game snapshot. Without this,
            // every event in a batch shares `update.game` (the END state),
            // and NgRx time travel collapses the board to the final position.
            update.events.forEach((event: any) => {
                this.latestGame = gameReducer(event, this.latestGame);
                this.dealer.receivedGameEvent(event, this.latestGame);
            });
        });
        socket.on('TableUpdate', (payload: any) => {
            payload.events.forEach((event: any) => this.dealer.receivedTableEvent(event, payload.table));
        });
        socket.on('GameError', (payload: any) => {
            console.warn('GameError', payload);
            this.toast.failed(payload.error?.detail ?? payload.error?.reason ?? 'Game Error');
        });
        socket.on('TableError', (payload: any) => {
            console.warn('TableError', payload);
            this.toast.failed(payload.error?.detail ?? payload.error?.reason ?? 'Table Error');
        });
        socket.on('CommandError', (payload: any) => {
            console.warn('ServerError', payload);
            this.toast.failed(payload.error?.detail ?? payload.error?.reason ?? 'Server Error');
        });
    }

    getLatency$(): Observable<number> {
        return WebsocketService.socket.getLatency$();
    }

    isConnected$(): Observable<boolean> {
        return WebsocketService.socket.isConnected$();
    }

    emitGameAction(command: GameCommand, roomID: string): void {
        WebsocketService.socket.emit('gameAction', { command: JSON.stringify(command), roomID });
    }

    emitTableAction(command: TableCommand, roomID: string): void {
        WebsocketService.socket.emit('tableAction', { command: JSON.stringify(command), roomID });
    }
}
