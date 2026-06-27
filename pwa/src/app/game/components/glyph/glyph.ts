import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Glyph as GlyphSymbol } from 'axis-models';

const GLYPH_LABEL: Record<GlyphSymbol, string> = {
    '+': 'Pulse',
    'X': 'Cross',
    '▲': 'Drift',
    '↔': 'Row Repeater',
    '↕': 'Column Repeater',
};

const GLYPH_CLASS: Record<GlyphSymbol, string> = {
    '+': 'pulse',
    'X': 'cross',
    '▲': 'drift',
    '↔': 'row-repeater',
    '↕': 'col-repeater',
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
