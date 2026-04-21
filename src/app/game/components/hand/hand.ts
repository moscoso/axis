import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card as CardModel, PlayerSide, PlayerState } from 'axis-models';
import { Card } from '../card/card';

@Component({
    selector: 'app-hand',
    standalone: true,
    imports: [Card],
    templateUrl: './hand.html',
    styleUrls: ['./hand.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-side]': 'player().side' },
})
export class Hand {
    readonly player = input.required<PlayerState>();
    readonly selectedIds = input<ReadonlySet<string>>(new Set());
    readonly selectable = input<boolean>(false);

    readonly cardSelected = output<CardModel>();

    readonly side = computed<PlayerSide>(() => this.player().side);
    readonly cards = computed(() => this.player().hand);

    isSelected(card: CardModel): boolean {
        return this.selectedIds().has(card.id);
    }

    onPick(card: CardModel): void {
        if (this.selectable()) {
            this.cardSelected.emit(card);
        }
    }
}
