import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { WebsocketService } from '../websocket.service';

@Component({
    selector: 'app-connection-status',
    standalone: true,
    templateUrl: './connection-status.html',
    styleUrls: ['./connection-status.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionStatus {
    private readonly socket = inject(WebsocketService);

    readonly connected = toSignal(this.socket.isConnected$(), { initialValue: false });
    readonly latency = toSignal(this.socket.getLatency$(), {
        initialValue: Number.POSITIVE_INFINITY,
    });
    readonly hasLatency = computed(() => this.latency() !== Number.POSITIVE_INFINITY);
    readonly latencyClass = computed(() => {
        const ms = this.latency();
        if (ms >= 1500) return 'high-latency';
        if (ms >= 500) return 'medium-latency';
        return '';
    });
}
