import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
    Card as CardModel,
    Game,
    PlayerSide,
    Position,
    getBaseCost,
    getCardValue,
    getBondElements,
    getZoneForPosition,
} from 'axis-models';
import { Glyph } from '../glyph/glyph';

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

    readonly confirm = output<void>();
    readonly cancel = output<void>();

    readonly targetCell = computed(() => {
        const t = this.target();
        if (!t) return null;
        return this.game().board[t.row]?.[t.col] ?? null;
    });

    readonly cost = computed(() => {
        const cell = this.targetCell();
        return cell ? getBaseCost(cell) : 0;
    });

    readonly handSize = computed<number>(() =>
        this.game().players[this.player()].hand.length
    );

    readonly paidCards = computed<CardModel[]>(() => {
        const ids = this.paidCardIds();
        const hand = this.game().players[this.player()].hand;
        return hand.filter(c => ids.has(c.id));
    });

    readonly controlledElements = computed(() =>
        getBondElements(this.game(), this.player())
    );

    readonly paidCardValues = computed<number[]>(() => {
        const t = this.target();
        if (!t) return [];
        const g = this.game();
        const targetElement = g.options.affinity ? getZoneForPosition(g, t).element : null;
        const controlled = this.controlledElements();
        return this.paidCards().map(c => getCardValue(c, targetElement, controlled));
    });

    readonly paymentValue = computed(() => this.paidCardValues().reduce((sum, v) => sum + v, 0));

    readonly canPay = computed(() => this.paymentValue() >= this.cost());

    /**
     * True when a paid card buys nothing — an avoidable overpay. If dropping the
     * lowest-value card still covers the cost, that card is pure waste. Blocks
     * confirm so a player can't accidentally burn cards.
     */
    readonly wasteful = computed(() => {
        const values = this.paidCardValues();
        if (values.length === 0) return false;
        return this.paymentValue() - Math.min(...values) >= this.cost();
    });

    readonly canConfirm = computed(
        () => this.target() !== null && this.canPay() && !this.wasteful()
    );

    onConfirm(): void {
        if (this.canConfirm()) this.confirm.emit();
    }

    onCancel(): void {
        this.cancel.emit();
    }
}
