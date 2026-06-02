import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DealerFacade } from '../../../core/state/dealer/dealer.facade';
import { EventLogEntry } from '../../../core/state/dealer/dealer.state';
import { Drawer } from '../drawer/drawer';

@Component({
    selector: 'app-event-log',
    standalone: true,
    imports: [Drawer],
    templateUrl: './event-log.html',
    styleUrls: ['./event-log.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventLog {
    private readonly dealer = inject(DealerFacade);

    readonly close = output<void>();

    private readonly events = toSignal(this.dealer.selectState('events'), {
        initialValue: [] as EventLogEntry[],
    });

    /** Newest entries first so the top of the list is the latest event. */
    readonly entries = computed(() => {
        const list = this.events();
        return list.slice().reverse();
    });

    trackById(_: number, entry: EventLogEntry): number {
        return entry.id;
    }

    onClose(): void {
        this.close.emit();
    }

    formatTime(at: number): string {
        const d = new Date(at);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        const s = d.getSeconds().toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }
}
