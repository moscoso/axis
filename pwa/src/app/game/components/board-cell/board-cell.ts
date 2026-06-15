import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoardCell as BoardCellModel, Element, Rune as RuneModel, Zone } from 'axis-models';
import { Glyph } from '../glyph/glyph';
import { Rune } from '../rune/rune';

const ELEMENT_SYMBOL: Record<Element, string> = {
    sun: '☀️',
    moon: '🌙',
    star: '⭐',
    comet: '☄️',
    planet: '🪐',
    'black-hole': '🌀',
};

@Component({
    selector: 'app-board-cell',
    standalone: true,
    imports: [Glyph, Rune],
    templateUrl: './board-cell.html',
    styleUrls: ['./board-cell.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-element]': 'element()',
        '[attr.data-row-element]': 'rowElement()',
        '[attr.data-col-element]': 'colElement()',
        '[attr.data-has-crux]': 'cell().hasCrux',
        '[attr.data-has-rune]': '!!cell().rune',
        '[class.selectable]': 'selectable()',
        '[class.selected]': 'selected()',
        '[class.dim]': 'dim()',
        '[class.in-cross]': 'inCross()',
        '[class.in-footprint]': 'inFootprint()',
        '[class.will-charge]': 'willCharge()',
    },
})
export class BoardCell {
    readonly cell = input.required<BoardCellModel>();
    readonly zone = input.required<Zone | undefined>();
    /**
     * Suit colouring the horizontal (row) axis rail. In the `'cross'` model this
     * is the cell's row Crux suit; in `'region'` it's the cell's single Zone.
     */
    readonly rowElement = input<Element | null>(null);
    /**
     * Suit colouring the vertical (column) axis rail — the column Crux suit in
     * `'cross'`. Equals {@link rowElement} on Crux cells and in `'region'`, so the
     * axis cross renders as one colour there.
     */
    readonly colElement = input<Element | null>(null);
    readonly selectable = input<boolean>(false);
    readonly selected = input<boolean>(false);
    /** Fade the cell to signal that it's not a valid inscribe target right now. */
    readonly dim = input<boolean>(false);
    /** Part of the row/column cross of the currently-hovered rune. */
    readonly inCross = input<boolean>(false);
    /** Covered by the hovered Spell footprint (casting mode). */
    readonly inFootprint = input<boolean>(false);
    /** Inside the footprint AND holds a rune the Spell would charge. */
    readonly willCharge = input<boolean>(false);
    /**
     * Crux control badge: signed flux lead + the side that controls the Zone.
     * `preview` is true when this is a projected (pending-move) result — rendered
     * dotted to distinguish it from the committed value.
     */
    readonly cruxBadge = input<{ text: string; owner: 'light' | 'dark' | 'unbound'; preview: boolean } | null>(null);
    /** When set, render a semi-transparent preview rune — a "you can play here" ghost. */
    readonly ghost = input<RuneModel | null>(null);
    /** Projected flux for the committed rune after a pending move; renders "current → next". */
    readonly fluxPreview = input<number | null>(null);

    readonly element = computed<Element | null>(() => this.zone()?.element ?? null);
    readonly rune = computed(() => this.cell().rune);
    readonly glyphs = computed(() => this.cell().glyphs);
    readonly cruxSymbol = computed(() => {
        const el = this.element();
        return el ? ELEMENT_SYMBOL[el] : '';
    });
}
