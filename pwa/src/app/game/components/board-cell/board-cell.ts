import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoardCell as BoardCellModel, Color } from 'axis-models';
import { Glyph } from '../glyph/glyph';

/** Emoji marker per celestial color, shown on Crux cells and color swatches. */
export const COLOR_SYMBOL: Record<Color, string> = {
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    comet: '☄️',
    planet: '🪐',
    spiral: '🌀',
};

@Component({
    selector: 'app-board-cell',
    standalone: true,
    imports: [Glyph],
    templateUrl: './board-cell.html',
    styleUrls: ['./board-cell.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-row-color]': 'cell().rowColor',
        '[attr.data-col-color]': 'cell().colColor',
        '[attr.data-has-crux]': 'cell().hasCrux',
        '[attr.data-has-stone]': '!!cell().stone',
        '[attr.data-owner]': 'cell().stone?.owner ?? null',
        '[class.selectable]': 'selectable()',
        '[class.selected]': 'selected()',
        '[class.eligible]': 'eligible()',
        '[class.dim]': 'dim()',
        '[class.in-cross]': 'inCross()',
    },
})
export class BoardCell {
    readonly cell = input.required<BoardCellModel>();
    readonly selectable = input<boolean>(false);
    readonly selected = input<boolean>(false);
    /** This empty cell matches the armed die's color — a legal inscribe target. */
    readonly eligible = input<boolean>(false);
    /** Fade the cell to signal it's not a valid target right now. */
    readonly dim = input<boolean>(false);
    /** On the cross that the armed die would fire. */
    readonly inCross = input<boolean>(false);

    readonly stone = computed(() => this.cell().stone);
    readonly cruxSymbol = computed(() => {
        const color = this.cell().cruxColor;
        return color ? COLOR_SYMBOL[color] : '';
    });
    readonly rowSymbol = computed(() => COLOR_SYMBOL[this.cell().rowColor]);
    readonly colSymbol = computed(() => COLOR_SYMBOL[this.cell().colColor]);
}
