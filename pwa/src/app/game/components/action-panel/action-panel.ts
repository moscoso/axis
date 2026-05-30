import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
    Card as CardModel,
    Game,
    Glyph as GlyphSymbol,
    PlayerSide,
    Position,
    getBaseCost,
    getCardValue,
    getControlledElements,
    getDiscountedCost,
    getZoneForPosition,
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

    readonly paidCardValues = computed<number[]>(() => {
        const t = this.target();
        if (!t) return [];
        const targetElement = getZoneForPosition(this.game(), t).element;
        const controlled = this.controlledElements();
        return this.paidCards().map(c => getCardValue(c, targetElement, controlled));
    });

    readonly paymentValue = computed(() => this.paidCardValues().reduce((sum, v) => sum + v, 0));

    readonly canPay = computed(() => this.paymentValue() >= this.discountedCost());

    /**
     * True when a paid card buys no activation — an avoidable over-overpay.
     * Activations cap at the printed symbols, so if dropping the lowest-value
     * card still meets that cap, that card is pure waste. Blocks confirm so a
     * player can't accidentally burn cards.
     */
    readonly wasteful = computed(() => {
        const values = this.paidCardValues();
        if (values.length === 0) return false;
        return this.paymentValue() - Math.min(...values) >= this.baseCost();
    });

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

    /**
     * Activations equal the payment value, capped at the printed symbols. A
     * value-2 card on a 1-symbol space is a legal (if wasteful) overpay — you
     * just activate the one symbol; the surplus value is lost.
     */
    readonly requiredActivations = computed(() =>
        Math.min(this.paymentValue(), this.targetCell()?.glyphs.length ?? 0)
    );

    readonly canConfirm = computed(
        () =>
            this.target() !== null &&
            this.canPay() &&
            !this.wasteful() &&
            this.totalActivations() === this.requiredActivations()
    );

    increment(row: ActivationRow): void {
        if (row.chosen < row.max && this.totalActivations() < this.requiredActivations()) {
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
