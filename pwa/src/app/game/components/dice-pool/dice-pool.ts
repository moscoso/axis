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
    /** Whether dice can be picked/dragged this turn. */
    readonly pickable = input<boolean>(false);

    /** Tap to arm (or toggle) a die. */
    readonly diePicked = output<Color>();
    /** Drag began from a die — arm it so eligible cells light up. */
    readonly dragStarted = output<Color>();
    readonly dragEnded = output<void>();

    readonly colorSymbol = COLOR_SYMBOL;

    onPick(color: Color): void {
        if (!this.pickable()) return;
        this.diePicked.emit(color);
    }

    onDragStart(color: Color, event: DragEvent): void {
        if (!this.pickable()) {
            event.preventDefault();
            return;
        }
        // dataTransfer must carry something for Firefox to start the drag.
        event.dataTransfer?.setData('text/plain', color);
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        this.dragStarted.emit(color);
    }

    onDragEnd(): void {
        this.dragEnded.emit();
    }
}
