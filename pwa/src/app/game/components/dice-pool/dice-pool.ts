import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Color, Die } from 'axis-models';
import { Glyph } from '../glyph/glyph';
import { COLOR_SYMBOL } from '../board-cell/board-cell';

@Component({
    selector: 'app-dice-pool',
    standalone: true,
    imports: [Glyph],
    templateUrl: './dice-pool.html',
    styleUrls: ['./dice-pool.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DicePool {
    readonly dice = input.required<Die[]>();
    /** The currently armed die color, if any. */
    readonly armedColor = input<Color | null>(null);
    /** Whether dice can be picked this turn. */
    readonly pickable = input<boolean>(false);

    readonly diePicked = output<Color>();

    readonly colorSymbol = COLOR_SYMBOL;

    onPick(color: Color): void {
        if (!this.pickable()) return;
        this.diePicked.emit(color);
    }
}
