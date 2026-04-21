import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Game, Position, Zone } from 'axis-models';
import { BoardCell } from '../board-cell/board-cell';

@Component({
    selector: 'app-board',
    standalone: true,
    imports: [BoardCell],
    templateUrl: './board.html',
    styleUrls: ['./board.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Board {
    readonly game = input.required<Game>();
    readonly selectedCell = input<Position | null>(null);
    readonly selectable = input<boolean>(false);

    readonly cellClicked = output<Position>();

    readonly rows = computed(() => this.game().board);
    readonly zonesById = computed(() => {
        const map = new Map<string, Zone>();
        for (const z of this.game().zones) map.set(z.id, z);
        return map;
    });

    zoneFor(zoneId: string): Zone | undefined {
        return this.zonesById().get(zoneId);
    }

    isSelected(pos: Position): boolean {
        const sel = this.selectedCell();
        return sel !== null && sel.row === pos.row && sel.col === pos.col;
    }

    onCellClick(pos: Position): void {
        if (this.selectable()) {
            this.cellClicked.emit(pos);
        }
    }
}
