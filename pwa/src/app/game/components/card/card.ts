import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Card as CardModel, Element } from 'axis-models';

export type CardSize = 'sm' | 'md' | 'lg';

const ELEMENT_GLYPH: Record<Element, string> = {
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    comet: '☄️',
    planet: '🪐',
    'black-hole': '🌀',
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
    /** Suit ids are kebab-case ('black-hole'); display them with spaces. */
    readonly elementLabel = computed(() => this.card().element.replace('-', ' '));
}
