import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
    Game,
    PlayerSide,
    Position,
    Rune,
    SpellShape,
    Zone,
    getBaseCost,
    getCardValue,
    getBondElements,
    getDiscountedCost,
    getFluxTotalForCruxLines,
    getSpellFootprint,
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
    /** The simulated rune for the selected target — carries charged flux into the ghost. */
    readonly previewRune = input<Rune | null>(null);
    /** The full simulated post-inscribe state — drives the Crux flux-lead delta chips. */
    readonly previewGame = input<Game | null>(null);
    /** Show the discount guideline edges (per-row/column rune tallies). */
    readonly showGuides = input<boolean>(true);
    /** When set, the board is in Spell targeting mode for this footprint shape. */
    readonly castShape = input<SpellShape | null>(null);

    readonly cellClicked = output<Position>();
    /** Fired when a cell is chosen as a Spell anchor (casting mode only). */
    readonly anchorPicked = output<Position>();

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

    /**
     * Guide-rail seat assignment. The perspective player sits at the bottom, so
     * their tallies hug the bottom + left rails (nearest them); the opponent's
     * sit on the top + right. Falls back to light-at-bottom for spectators.
     * Colour still tracks the actual side; only the *position* is perspective-
     * relative.
     */
    readonly bottomSide = computed<PlayerSide>(() => this.player() ?? 'light');
    readonly topSide = computed<PlayerSide>(() => (this.bottomSide() === 'light' ? 'dark' : 'light'));

    colTally(c: number, side: PlayerSide): number {
        return this.tallies().cols[c][side];
    }
    rowTally(r: number, side: PlayerSide): number {
        return this.tallies().rows[r][side];
    }

    /**
     * Best payment value the active player could put toward a *specific* cell.
     * Card values are Zone-dependent now (Affinity doubles a card in its home
     * Zone), so this is per-target: take the highest-value cards up to the
     * cell's base cost (you can't pay with more cards than printed symbols).
     */
    private maxPaymentFor(pos: Position): number {
        const player = this.player();
        if (!player) return 0;
        const g = this.game();
        const cell = g.board[pos.row]?.[pos.col];
        if (!cell) return 0;
        // Affinity makes a card's value Zone-dependent; null when the toggle is off
        // (Bond still applies). Don't bail on a missing zone — Bond is independent.
        const zoneElement = this.zoneFor(cell.zoneId)?.element ?? null;
        const targetElement = g.options.affinity ? zoneElement : null;
        const controlled = getBondElements(g, player);
        const values = g.players[player].hand
            .map(card => getCardValue(card, targetElement, controlled))
            .sort((a, b) => b - a);
        const limit = Math.min(getBaseCost(cell), values.length);
        let sum = 0;
        for (let i = 0; i < limit; i++) sum += values[i];
        return sum;
    }

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
        if (cell?.rune !== null) return true;
        if (cell.hasCrux) return false; // Crux cells are permanently off-limits for inscribing.
        return getDiscountedCost(g, player, pos) <= this.maxPaymentFor(pos);
    }

    /**
     * Control badge for a Crux cell: the flux lead on its row+column lines,
     * signed like the scoreboard (`+` = light, `−` = dark), colored by the
     * side that controls the Zone. Null for non-Crux cells and for unbound
     * Cruxes (a tie or no flux), which show no badge.
     */
    cruxBadge(pos: Position): { text: string; owner: PlayerSide | 'unbound'; preview: boolean } | null {
        const g = this.game();
        const cell = g.board[pos.row]?.[pos.col];
        if (!cell?.hasCrux) return null;

        const lead = (s: Game) =>
            getFluxTotalForCruxLines(s, pos, 'light') - getFluxTotalForCruxLines(s, pos, 'dark');

        // Show the projected result when a pending placement changes this Crux's
        // lines; otherwise the live state. The preview flag drives the dotted style.
        const sim = this.previewGame();
        const preview = sim !== null && lead(sim) !== lead(g);
        const state = preview ? sim : g;

        const zone = state.zones.find(
            z => z.cruxPosition.row === pos.row && z.cruxPosition.col === pos.col
        );
        if (!zone) return null;

        // A committed unbound Crux shows nothing; but a move that *contests* one
        // into a tie surfaces a neutral dotted "0" so the change is still legible.
        if (zone.control === 'unbound') {
            return preview ? { text: '0', owner: 'unbound', preview: true } : null;
        }

        const diff = lead(state);
        return { text: diff > 0 ? `+${diff}` : `${diff}`, owner: zone.control, preview };
    }

    onCellClick(pos: Position): void {
        // Casting mode: any cell is a valid anchor.
        if (this.castShape()) {
            this.anchorPicked.emit(pos);
            return;
        }
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

    /** Tracks the mouse over an empty cell — drives the "you can play here" ghost. */
    readonly hoveredEmpty = signal<Position | null>(null);

    /** Tracks the hovered anchor while in Spell casting mode. */
    readonly hoveredAnchor = signal<Position | null>(null);

    onCellHover(pos: Position): void {
        const cell = this.game().board[pos.row]?.[pos.col];
        if (!cell) return;
        if (this.castShape()) { this.hoveredAnchor.set(pos); return; }
        if (cell.rune) this.hoveredRune.set(pos);
        else this.hoveredEmpty.set(pos);
    }

    onCellLeave(pos: Position): void {
        const here = (p: Position | null) => p?.row === pos.row && p.col === pos.col;
        if (here(this.hoveredRune())) this.hoveredRune.set(null);
        if (here(this.hoveredEmpty())) this.hoveredEmpty.set(null);
        if (here(this.hoveredAnchor())) this.hoveredAnchor.set(null);
    }

    /**
     * The hovered Spell footprint, split into the cells it covers and the subset
     * that would actually be charged (the caster's own runes). Empty when not
     * casting or nothing is hovered.
     */
    private readonly footprint = computed<{ cells: Set<string>; charge: Set<string> }>(() => {
        const shape = this.castShape();
        const anchor = this.hoveredAnchor();
        const cells = new Set<string>();
        const charge = new Set<string>();
        if (!shape || !anchor) return { cells, charge };
        const player = this.player();
        for (const p of getSpellFootprint(shape, anchor)) {
            const key = `${p.row},${p.col}`;
            cells.add(key);
            if (player && this.game().board[p.row]?.[p.col]?.rune?.owner === player) charge.add(key);
        }
        return { cells, charge };
    });

    inFootprint(pos: Position): boolean {
        return this.footprint().cells.has(`${pos.row},${pos.col}`);
    }
    willCharge(pos: Position): boolean {
        return this.footprint().charge.has(`${pos.row},${pos.col}`);
    }

    /**
     * The ghost rune to render on a cell, or null for none. The selected target
     * shows the *simulated* rune (so charged flux appears as a number); a
     * hovered affordable empty cell shows a blank flux-0 stone — a "you can play
     * here" reminder. Requires an inscribe-enabled board and a known player.
     */
    ghostFor(pos: Position): Rune | null {
        const player = this.player();
        if (!player || !this.selectable() || this.castShape()) return null;
        const cell = this.game().board[pos.row]?.[pos.col];
        if (!cell || cell.rune !== null || cell.hasCrux) return null;
        if (!this.isAffordable(pos)) return null;
        if (this.isSelected(pos)) return this.previewRune() ?? { owner: player, flux: 0 };
        const hovered = this.hoveredEmpty();
        const isHovered = hovered?.row === pos.row && hovered.col === pos.col;
        return isHovered ? { owner: player, flux: 0 } : null;
    }

    isInCross(pos: Position): boolean {
        const hover = this.hoveredRune();
        if (!hover) return false;
        if (hover.row === pos.row && hover.col === pos.col) return false; // exclude origin
        return hover.row === pos.row || hover.col === pos.col;
    }
}
