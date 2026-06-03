import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card as CardModel, PlayerSide, PlayerState } from 'axis-models';
import { Card } from '../card/card';
import { Glyph } from '../glyph/glyph';

@Component({
    selector: 'app-hand',
    standalone: true,
    imports: [Card, Glyph],
    templateUrl: './hand.html',
    styleUrls: ['./hand.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-side]': 'player().side' },
})
export class Hand {
    readonly player = input.required<PlayerState>();
    readonly selectedIds = input<ReadonlySet<string>>(new Set());
    readonly selectable = input<boolean>(false);
    /** Preview of cards the pending move would draw — rendered as trailing "?" ghosts. */
    readonly ghostDraws = input<number>(0);

    readonly cardSelected = output<CardModel>();

    readonly side = computed<PlayerSide>(() => this.player().side);
    readonly cards = computed(() => this.player().hand);
    /** A bare index list for the ghost "?" draw cards. */
    readonly ghostSlots = computed(() => Array.from({ length: this.ghostDraws() }, (_, i) => i));

    isSelected(card: CardModel): boolean {
        return this.selectedIds().has(card.id);
    }

    onPick(card: CardModel): void {
        if (this.selectable()) {
            this.cardSelected.emit(card);
        }
    }
}
