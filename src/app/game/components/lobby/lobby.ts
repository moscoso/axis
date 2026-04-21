import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidePreference, Table } from 'axis-models';
import { AuthFacade } from '../../../core/state/auth/auth.facade';
import { Seat } from '../seat/seat';
import { SideSelector } from '../side-selector/side-selector';

@Component({
    selector: 'app-lobby',
    standalone: true,
    imports: [Seat, SideSelector],
    templateUrl: './lobby.html',
    styleUrls: ['./lobby.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Lobby {
    readonly table = input.required<Table>();

    private readonly auth = inject(AuthFacade);
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
                    : 'Click a seat to join.';
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
}
