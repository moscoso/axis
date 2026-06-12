import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Element, PlayerSide, Seat, Zone } from 'axis-models';

const ELEMENT_SYMBOL: Record<Element, string> = {
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    comet: '☄️',
    planet: '🪐',
    'black-hole': '🌀',
};

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
    readonly zones = input<Zone[]>([]);
    /** Whether it's this player's turn — lights up the panel when true. */
    readonly isActive = input<boolean>(false);

    readonly name = computed(() => this.seat()?.user.name ?? '—');
    readonly photoURL = computed(() => this.seat()?.user.photoURL ?? '');
    readonly initial = computed(() => this.name().charAt(0).toUpperCase());

    /** The elements of cruxes this side controls. */
    readonly controlledElements = computed<Element[]>(() =>
        this.zones()
            .filter(z => z.control === this.side())
            .map(z => z.element)
    );

    elementSymbol(el: Element): string {
        return ELEMENT_SYMBOL[el];
    }
}
