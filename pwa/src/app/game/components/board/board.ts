import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Color, Game, Position, getCrux } from 'axis-models';
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
    /** Whether cells can be inscribed this turn. */
    readonly selectable = input<boolean>(false);
    /** The armed die color — drives eligible-cell + cross highlighting. */
    readonly armedColor = input<Color | null>(null);

    readonly cellClicked = output<Position>();

    readonly rows = computed(() => this.game().board);

    /** The cells of the armed color's cross (full row + column), as a key set. */
    private readonly crossCells = computed<Set<string>>(() => {
        const color = this.armedColor();
        const set = new Set<string>();
        if (!color) return set;
        const crux = getCrux(this.game(), color);
        if (!crux) return set;
        for (let c = 0; c < 6; c++) set.add(`${crux.position.row},${c}`);
        for (let r = 0; r < 6; r++) set.add(`${r},${crux.position.col}`);
        return set;
    });

    isSelected(pos: Position): boolean {
        const sel = this.selectedCell();
        return sel !== null && sel.row === pos.row && sel.col === pos.col;
    }

    /** An empty non-Crux cell matching the armed die color — a legal target. */
    eligible(pos: Position): boolean {
        const color = this.armedColor();
        if (!color || !this.selectable()) return false;
        const cell = this.game().board[pos.row]?.[pos.col];
        if (!cell || cell.hasCrux || cell.stone !== null) return false;
        return cell.rowColor === color || cell.colColor === color;
    }

    inCross(pos: Position): boolean {
        return this.crossCells().has(`${pos.row},${pos.col}`);
    }

    onCellClick(pos: Position): void {
        if (!this.eligible(pos)) return;
        this.cellClicked.emit(pos);
    }
}
