import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { Color, Game, Glyph, PlayerSide, Position, getCrux } from 'axis-models';
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
    /** Whether cells can be inscribed this turn. */
    readonly selectable = input<boolean>(false);
    /** The armed die color — drives eligible-cell + cross highlighting. */
    readonly armedColor = input<Color | null>(null);
    /** The cell holding the pending (not-yet-confirmed) placement, if any. */
    readonly pendingTarget = input<Position | null>(null);
    /** The glyph face that would land (armed die's face). */
    readonly pendingGlyph = input<Glyph | null>(null);
    /** Side that owns the pending placement. */
    readonly pendingOwner = input<PlayerSide | null>(null);
    /** Show the A–F × 1–6 coordinate rails framing the grid. */
    readonly showGuides = input<boolean>(true);

    /** A cell was chosen as the target (via click or drop). */
    readonly cellChosen = output<Position>();

    readonly rows = computed(() => this.game().board);

    /** Static [0..5] index list for iterating the coordinate rails. */
    readonly axis = [0, 1, 2, 3, 4, 5];

    /** Column letter (A–F) and row number (1–6) for the chess-style rails. */
    colLabel(c: number): string { return String.fromCharCode(65 + c); }
    rowLabel(r: number): string { return String(r + 1); }

    private readonly dragOver = signal<string | null>(null);

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

    isPending(pos: Position): boolean {
        const p = this.pendingTarget();
        return p !== null && p.row === pos.row && p.col === pos.col;
    }

    ghostGlyphFor(pos: Position): Glyph | null {
        return this.isPending(pos) ? this.pendingGlyph() : null;
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

    isDragOver(pos: Position): boolean {
        return this.dragOver() === `${pos.row},${pos.col}`;
    }

    onChoose(pos: Position): void {
        if (!this.eligible(pos)) return;
        this.cellChosen.emit(pos);
    }

    onDragOver(pos: Position, event: DragEvent): void {
        if (!this.eligible(pos)) return;
        event.preventDefault(); // allow drop
        this.dragOver.set(`${pos.row},${pos.col}`);
    }

    onDragLeave(pos: Position): void {
        if (this.isDragOver(pos)) this.dragOver.set(null);
    }

    onDrop(pos: Position, event: DragEvent): void {
        event.preventDefault();
        this.dragOver.set(null);
        this.onChoose(pos);
    }
}
