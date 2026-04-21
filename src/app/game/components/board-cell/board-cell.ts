import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BoardCell as BoardCellModel, Element, Zone } from 'axis-models';
import { Glyph } from '../glyph/glyph';
import { Rune } from '../rune/rune';

@Component({
    selector: 'app-board-cell',
    standalone: true,
    imports: [Glyph, Rune],
    templateUrl: './board-cell.html',
    styleUrls: ['./board-cell.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[attr.data-element]': 'element()',
        '[attr.data-has-crux]': 'cell().hasCrux',
        '[attr.data-has-rune]': '!!cell().rune',
        '[class.selectable]': 'selectable()',
        '[class.selected]': 'selected()',
    },
})
export class BoardCell {
    readonly cell = input.required<BoardCellModel>();
    readonly zone = input.required<Zone | undefined>();
    readonly selectable = input<boolean>(false);
    readonly selected = input<boolean>(false);

    readonly element = computed<Element | null>(() => this.zone()?.element ?? null);
    readonly rune = computed(() => this.cell().rune);
    readonly glyphs = computed(() => this.cell().glyphs);
}
