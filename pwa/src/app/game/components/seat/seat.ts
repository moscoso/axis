import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Seat as SeatModel, clientTableCommand } from 'axis-models';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';
import { JoinForm } from '../join-form/join-form';

/** id-prefix the server's BotRunner watches for. */
const BOT_USER_PREFIX = 'bot-';

@Component({
    selector: 'app-seat',
    standalone: true,
    imports: [MatButtonModule, MatIconModule],
    templateUrl: './seat.html',
    styleUrls: ['./seat.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-occupied]': '!!seat()' },
})
export class Seat {
    readonly seat = input.required<SeatModel | null>();
    readonly seatIndex = input.required<0 | 1>();

    private readonly dealer = inject(DealerFacade);
    private readonly dialog = inject(MatDialog);

    private readonly userIsSeated = toSignal(this.dealer.selectUserIsSeated(), {
        initialValue: false,
    });

    readonly occupant = computed(() => this.seat()?.user ?? null);
    readonly sidePreference = computed(() => this.seat()?.sidePreference ?? null);
    readonly canJoin = computed(() => this.seat() === null && !this.userIsSeated());
    /** The bot button is offered for any empty seat — the user doesn't need to be seated themselves. */
    readonly canAddBot = computed(() => this.seat() === null);

    onJoin(): void {
        if (!this.canJoin()) return;
        this.dialog.open(JoinForm, {
            panelClass: 'axis-join-dialog',
            width: '360px',
        });
    }

    /**
     * Seats a synthetic bot user. The server's BotRunner picks it up by id
     * prefix and drives its turns once the game starts.
     */
    onAddBot(): void {
        if (!this.canAddBot()) return;
        const id = `${BOT_USER_PREFIX}heuristic-${randomSuffix()}`;
        const user = { id, name: 'Axis AI (Heuristic)', photoURL: '' };
        this.dealer.signalAsHost(clientTableCommand('JoinTable', { user }));
    }
}

function randomSuffix(): string {
    return Math.random().toString(36).slice(2, 8);
}
