import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SidePreference, Table, clientTableCommand } from 'axis-models';
import { firstValueFrom } from 'rxjs';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';
import { ToastService } from '../../../shared/toast/toast.service';
import { WebsocketService } from '../../../core/websocket/websocket.service';
import { Seat } from '../seat/seat';
import { SideSelector } from '../side-selector/side-selector';

/** Server-side test room with a HeuristicBot pre-seated in seat 1. */
const BOT_TEST_ROOM = 'bot-test';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, Seat, SideSelector],
    templateUrl: './lobby.html',
    styleUrls: ['./lobby.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
    readonly table = input.required<Table>();

    private readonly auth = inject(AuthFacade);
    private readonly dealer = inject(DealerFacade);
    private readonly socket = inject(WebsocketService);
    private readonly toast = inject(ToastService);
    private readonly userId = toSignal(this.auth.selectUserID(), { initialValue: 'unknown' });

    readonly seatA = computed(() => this.table().seats[0]);
    readonly seatB = computed(() => this.table().seats[1]);
    readonly status = computed(() => this.table().status);

    readonly userIsSeated = computed(() => {
        const uid = this.userId();
        return this.table().seats.some(s => s?.user.id === uid);
    });

    readonly mySidePreference = computed<SidePreference | null>(() => {
        const uid = this.userId();
        const seat = this.table().seats.find(s => s?.user.id === uid);
        return seat?.sidePreference ?? null;
    });

    readonly statusMessage = computed(() => {
        switch (this.status()) {
            case 'waiting':
                return this.userIsSeated()
                    ? 'Waiting for another player…'
                    : 'Click a seat to join — or play against the AI.';
            case 'ready':
                return 'Both seats filled — starting soon.';
            case 'in-progress':
                return 'Game in progress.';
            case 'finished':
                return 'Game finished.';
            default:
                return '';
        }
    });

    /**
     * Switches the client to the server's permanent `bot-test` room (where seat
     * 1 is pre-occupied by the HeuristicBot) and seats the user in seat 0. The
     * server's BotRunner picks up from there and drives the bot's turns.
     */
    async onPlayVsAI(): Promise<void> {
        try {
            const id = await this.auth.getUserID();
            const info = await firstValueFrom(this.auth.selectUserInfo());
            const user = {
                id,
                name: info?.displayName || info?.email?.split('@')[0] || 'Player',
                photoURL: info?.photoURL ?? '',
            };
            this.socket.switchRoom(BOT_TEST_ROOM);
            this.dealer.signalAsHost(clientTableCommand('JoinTable', { user }));
        } catch (error) {
            this.toast.failed('Could not start AI game', (error as Error)?.message);
        }
    }
}
