import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
    Game,
    PlayerSide,
    Position,
    Zone,
    getCardPaymentValue,
    getControlledElements,
    getDiscountedCost,
    getFluxTotalForCruxLines,
} from 'axis-models';
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
    /** The player whose perspective drives affordability dimming. */
    readonly player = input<PlayerSide | null>(null);

    readonly cellClicked = output<Position>();

    readonly rows = computed(() => this.game().board);

    /** Static [0..5] index list for iterating row/column edge headers in the template. */
    readonly axis = [0, 1, 2, 3, 4, 5];

    readonly zonesById = computed(() => {
        const map = new Map<string, Zone>();
        for (const z of this.game().zones) map.set(z.id, z);
        return map;
    });

    /**
     * Per-row and per-column friendly-rune counts for both sides. A player's
     * discount on an empty cell is exactly `rows[r] + cols[c]` for their side
     * (the target cell is empty, so it never contributes to its own count), so
     * these edge tallies let a player read either side's discount field at a
     * glance without selecting anything.
     */
    readonly tallies = computed(() => {
        const board = this.game().board;
        const blank = () => ({ light: 0, dark: 0 });
        const rows = this.axis.map(blank);
        const cols = this.axis.map(blank);
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                const owner = board[r]?.[c]?.rune?.owner;
                if (owner === 'light') {
                    rows[r].light++;
                    cols[c].light++;
                } else if (owner === 'dark') {
                    rows[r].dark++;
                    cols[c].dark++;
                }
            }
        }
        return { rows, cols };
    });

    /** Total payment value the active player could put down from their current hand. */
    readonly maxPayment = computed(() => {
        const player = this.player();
        if (!player) return 0;
        const g = this.game();
        const controlled = getControlledElements(g, player);
        return g.players[player].hand.reduce(
            (sum, card) => sum + getCardPaymentValue(card, controlled),
            0
        );
    });

    zoneFor(zoneId: string): Zone | undefined {
        return this.zonesById().get(zoneId);
    }

    isSelected(pos: Position): boolean {
        const sel = this.selectedCell();
        return sel !== null && sel.row === pos.row && sel.col === pos.col;
    }

    /**
     * A cell is "affordable" when it's an empty inscribe target whose discounted
     * cost (base glyphs − friendly runes in row/col) is within the active
     * player's max possible payment. Returns true for non-empty cells so we
     * don't pointlessly dim cells that aren't inscribe targets anyway.
     */
    isAffordable(pos: Position): boolean {
        const player = this.player();
        if (!player) return true;
        const g = this.game();
        const cell = g.board[pos.row]?.[pos.col];
        if (!cell || cell.rune !== null) return true;
        if (cell.hasCrux) return false; // Crux cells are permanently off-limits for inscribing.
        return getDiscountedCost(g, player, pos) <= this.maxPayment();
    }

    /**
     * Control badge for a Crux cell: the flux lead on its row+column lines,
     * signed like the scoreboard (`+` = light, `−` = dark), colored by the
     * side that controls the Zone. Null for non-Crux cells and for unbound
     * Cruxes (a tie or no flux), which show no badge.
     */
    cruxBadge(pos: Position): { text: string; owner: PlayerSide } | null {
        const g = this.game();
        const cell = g.board[pos.row]?.[pos.col];
        if (!cell?.hasCrux) return null;
        const zone = this.zoneFor(cell.zoneId);
        if (!zone || zone.control === 'unbound') return null;
        const diff =
            getFluxTotalForCruxLines(g, pos, 'light') -
            getFluxTotalForCruxLines(g, pos, 'dark');
        return { text: diff > 0 ? `+${diff}` : `${diff}`, owner: zone.control };
    }

    onCellClick(pos: Position): void {
        if (!this.selectable()) return;
        if (!this.isAffordable(pos)) return;
        this.cellClicked.emit(pos);
    }

    /**
     * Tracks the cell the mouse is over WHEN that cell has a rune. Used to
     * paint the row + column it's on as "in the cross" so the player can
     * eyeball its reach (discount lines, crux-line flux).
     */
    readonly hoveredRune = signal<Position | null>(null);

    onCellHover(pos: Position): void {
        const cell = this.game().board[pos.row]?.[pos.col];
        if (cell?.rune) this.hoveredRune.set(pos);
    }

    onCellLeave(pos: Position): void {
        const hover = this.hoveredRune();
        if (hover && hover.row === pos.row && hover.col === pos.col) {
            this.hoveredRune.set(null);
        }
    }

    isInCross(pos: Position): boolean {
        const hover = this.hoveredRune();
        if (!hover) return false;
        if (hover.row === pos.row && hover.col === pos.col) return false; // exclude origin
        return hover.row === pos.row || hover.col === pos.col;
    }
}
