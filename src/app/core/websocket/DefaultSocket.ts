import { ApplicationRef } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';
import { BehaviorSubject, Observable } from 'rxjs';
import { websocket } from '../../../config/websocket';

const config: SocketIoConfig = { url: websocket.url, options: {} };

export class DefaultSocket extends Socket {
    /** Current connection status of the socket. */
    protected readonly connected$ = new BehaviorSubject<boolean>(false);
    /** Current latency (ms) between this client and the server. */
    private readonly latency$ = new BehaviorSubject<number>(Number.POSITIVE_INFINITY);
    /** The time at which ping was last sent to measure for latency. */
    private pingTime = 0;

    constructor(appRef: ApplicationRef) {
        super(config, appRef);
        this.on('connect', () => this.connected$.next(true));
        this.on('disconnect', () => this.connected$.next(false));
        this.ping();
    }

    isConnected$(): Observable<boolean> {
        return this.connected$;
    }

    getLatency$(): Observable<number> {
        return this.latency$;
    }

    isConnected(): boolean {
        return this.connected$.getValue();
    }

    protected ping(): void {
        this.pingTime = Date.now();
        this.emit('pingLatency', () => this.pong());
    }

    protected pong(): void {
        const latency = Date.now() - this.pingTime;
        this.latency$.next(latency);
        setTimeout(() => this.ping(), 5000);
    }
}
