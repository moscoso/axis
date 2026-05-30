import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
    Card as CardModel,
    Game,
    Glyph as GlyphSymbol,
    PlayerSide,
    Position,
    getBaseCost,
    getCardPaymentValue,
    getControlledElements,
    getDiscountedCost,
} from 'axis-models';
import { Glyph } from '../glyph/glyph';

interface ActivationRow {
    glyph: GlyphSymbol;
    max: number;
    chosen: number;
}

@Component({
    selector: 'app-action-panel',
    standalone: true,
    imports: [Glyph],
    templateUrl: './action-panel.html',
    styleUrls: ['./action-panel.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionPanel {
    readonly game = input.required<Game>();
    readonly player = input.required<PlayerSide>();
    readonly target = input<Position | null>(null);
    readonly paidCardIds = input<ReadonlySet<string>>(new Set());
    readonly chosenActivations = input<ReadonlyMap<GlyphSymbol, number>>(new Map());

    readonly confirm = output<void>();
    readonly cancel = output<void>();
    readonly activationChanged = output<{ glyph: GlyphSymbol; delta: number }>();

    readonly targetCell = computed(() => {
        const t = this.target();
        if (!t) return null;
        return this.game().board[t.row]?.[t.col] ?? null;
    });

    readonly baseCost = computed(() => {
        const cell = this.targetCell();
        return cell ? getBaseCost(cell) : 0;
    });

    readonly discountedCost = computed(() => {
        const t = this.target();
        if (!t) return 0;
        return getDiscountedCost(this.game(), this.player(), t);
    });

    /**
     * Effective discount actually applied: base − final cost. Uses the floored
     * cost (not the raw friendly-rune count) so the three lines always sum
     * cleanly — base − discount = cost — even when the discount would overshoot.
     */
    readonly discount = computed(() => this.baseCost() - this.discountedCost());

    readonly paidCards = computed<CardModel[]>(() => {
        const ids = this.paidCardIds();
        const hand = this.game().players[this.player()].hand;
        return hand.filter(c => ids.has(c.id));
    });

    readonly controlledElements = computed(() =>
        getControlledElements(this.game(), this.player())
    );

    readonly paymentValue = computed(() => {
        const controlled = this.controlledElements();
        return this.paidCards().reduce((sum, c) => sum + getCardPaymentValue(c, controlled), 0);
    });

    readonly canPay = computed(() => this.paymentValue() >= this.discountedCost());

    readonly activationRows = computed<ActivationRow[]>(() => {
        const cell = this.targetCell();
        if (!cell) return [];
        const counts = new Map<GlyphSymbol, number>();
        for (const g of cell.glyphs) counts.set(g, (counts.get(g) ?? 0) + 1);
        const chosen = this.chosenActivations();
        return Array.from(counts.entries()).map(([glyph, max]) => ({
            glyph,
            max,
            chosen: chosen.get(glyph) ?? 0,
        }));
    });

    readonly totalActivations = computed(() => {
        let total = 0;
        for (const row of this.activationRows()) total += row.chosen;
        return total;
    });

    readonly canConfirm = computed(
        () =>
            this.target() !== null &&
            this.canPay() &&
            this.totalActivations() === this.paymentValue()
    );

    increment(row: ActivationRow): void {
        if (row.chosen < row.max) {
            this.activationChanged.emit({ glyph: row.glyph, delta: +1 });
        }
    }

    decrement(row: ActivationRow): void {
        if (row.chosen > 0) {
            this.activationChanged.emit({ glyph: row.glyph, delta: -1 });
        }
    }

    onConfirm(): void {
        if (this.canConfirm()) this.confirm.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
