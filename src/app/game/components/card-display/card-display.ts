import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card as CardModel } from 'axis-models';
import { Card, CardSize } from '../card/card';

@Component({
    selector: 'app-card-display',
    standalone: true,
    imports: [Card],
    templateUrl: './card-display.html',
    styleUrls: ['./card-display.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-compact]': 'compact()' },
})
export class CardDisplay {
    readonly cards = input.required<CardModel[]>();
    readonly deckSize = input<number>(0);
    readonly discardSize = input<number>(0);
    readonly selectable = input<boolean>(false);
    /** Compact mode shrinks pile tiles and uses `sm` cards so the whole display fits a narrow rail. */
    readonly compact = input<boolean>(false);

    readonly cardSelected = output<CardModel>();

    readonly hasDeck = computed(() => this.deckSize() > 0);
    readonly hasDiscard = computed(() => this.discardSize() > 0);
    readonly cardSize = computed<CardSize>(() => (this.compact() ? 'sm' : 'md'));

    onPick(card: CardModel): void {
        if (this.selectable()) {
            this.cardSelected.emit(card);
        }
    }
}
