import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Card as CardModel, Element } from 'axis-models';

export type CardSize = 'sm' | 'md' | 'lg';

const ELEMENT_GLYPH: Record<Element, string> = {
    fire: '🔥',
    earth: '🌱',
    air: '💨',
    water: '💧',
};

@Component({
    selector: 'app-card',
    standalone: true,
    templateUrl: './card.html',
    styleUrls: ['./card.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-element]': 'card().element',
        '[attr.data-size]': 'size()',
        '[class.selected]': 'selected()',
        '[class.selectable]': 'selectable()',
    },
})
export class Card {
    readonly card = input.required<CardModel>();
    readonly size = input<CardSize>('md');
    readonly selectable = input<boolean>(false);
    readonly selected = input<boolean>(false);

    readonly glyph = computed(() => ELEMENT_GLYPH[this.card().element]);
    readonly elementLabel = computed(() => this.card().element);
}
