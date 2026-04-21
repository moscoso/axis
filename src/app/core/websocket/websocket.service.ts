import { ApplicationRef, inject, Injectable } from '@angular/core';
import { GameCommand, TableCommand } from 'axis-models';
import { Observable } from 'rxjs';
import { ToastService } from '../../shared/toast/toast.service';
import { DealerFacade } from '../state/dealer/dealer.facade';
import { DefaultSocket } from './DefaultSocket';

const DEFAULT_ROOM_ID = 'blackhole';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
    private static socket: DefaultSocket;

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
        WebsocketService.socket.emit('connectionHandshake', { userID });
        WebsocketService.socket.emit('SyncRequested', { roomID });
        this.listen();
    }

    listen(): void {
        const socket = WebsocketService.socket;
        socket.on('connect', () =>
            WebsocketService.socket.emit('SyncRequested', { roomID: DEFAULT_ROOM_ID })
        );
        socket.on('DeltaUpdate', (payload: { game: any; table: any }) =>
            this.dealer.receivedDeltaEvent(payload.game, payload.table)
        );
        socket.fromEvent('GameUpdate').subscribe((update: any) => {
            update.events.forEach((event: any) => this.dealer.receivedGameEvent(event, update.game));
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
