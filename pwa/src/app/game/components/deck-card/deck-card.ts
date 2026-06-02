import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CardSize } from '../card/card';

/**
 * The draw deck rendered as a card-like tile: same dimensions and hover
 * behaviour as a real card, but its face shows the remaining count instead of
 * an element glyph. Clicking it (when selectable and non-empty) draws.
 */
@Component({
    selector: 'app-deck-card',
    standalone: true,
    templateUrl: './deck-card.html',
    styleUrls: ['./deck-card.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-size]': 'size()',
        '[class.selectable]': 'canDraw()',
        '[class.empty]': 'count() === 0',
        '(click)': 'onClick()',
    },
})
export class DeckCard {
    readonly count = input.required<number>();
    readonly size = input<CardSize>('md');
    readonly selectable = input<boolean>(false);

    readonly draw = output<void>();

    /** Only clickable when drawing is allowed and there are cards left. */
    readonly canDraw = computed(() => this.selectable() && this.count() > 0);

    onClick(): void {
        if (this.canDraw()) this.draw.emit();
    }
}
