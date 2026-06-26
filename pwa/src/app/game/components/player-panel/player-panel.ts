import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { PlayerSide, Seat } from 'axis-models';

@Component({
    selector: 'app-player-panel',
    standalone: true,
    templateUrl: './player-panel.html',
    styleUrls: ['./player-panel.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-side]': 'side()',
        '[attr.data-turn]': 'isActive()',
    },
})
export class PlayerPanel {
    readonly side = input.required<PlayerSide>();
    readonly seat = input<Seat | null>(null);
    /** This side's running point score. */
    readonly score = input<number>(0);
    /** Whether it's this player's turn — lights up the panel when true. */
    readonly isActive = input<boolean>(false);

    readonly name = computed(() => this.seat()?.user.name ?? '—');
    readonly photoURL = computed(() => this.seat()?.user.photoURL ?? '');
    readonly initial = computed(() => this.name().charAt(0).toUpperCase());
}
