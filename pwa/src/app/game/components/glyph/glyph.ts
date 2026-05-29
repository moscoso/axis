import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Glyph as GlyphSymbol } from 'axis-models';

const GLYPH_LABEL: Record<GlyphSymbol, string> = {
    '+': 'Flux',
    '▲': 'Force',
    '◇': 'Draw',
    '↑': 'Shift Up',
    '→': 'Shift Right',
    '↓': 'Shift Down',
    '←': 'Shift Left',
};

const GLYPH_CLASS: Record<GlyphSymbol, string> = {
    '+': 'flux',
    '▲': 'force',
    '◇': 'draw',
    '↑': 'shift-up',
    '→': 'shift-right',
    '↓': 'shift-down',
    '←': 'shift-left',
};

@Component({
    selector: 'app-glyph',
    standalone: true,
    template: `<span [attr.aria-label]="label()">{{ symbol() }}</span>`,
    styleUrls: ['./glyph.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: { '[attr.data-kind]': 'kind()' },
})
export class Glyph {
    readonly symbol = input.required<GlyphSymbol>();
    readonly label = computed(() => GLYPH_LABEL[this.symbol()]);
    readonly kind = computed(() => GLYPH_CLASS[this.symbol()]);
}
