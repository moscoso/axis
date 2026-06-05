import { Card } from '../Card/Card';
import { Glyph } from '../Glyph/Glyph';
import { Game } from '../Game/Game';
import { PlayerSide } from '../Player/Player';
import { Position } from '../Zone/Zone';
import {
	getBaseCost,
	getBondElements,
	getCardValue,
	getDiscountedCost,
	getZoneForPosition,
} from './GameSelectors';

/** Default activation fill order: flux on the rune, then force, then draw. */
export const DEFAULT_ACTIVATION_PRIORITY: Glyph[] = ['+', '▲', '◇'];

export interface AutoInscription {
	paidCardIds: string[];
	/** Flattened activation multiset — one entry per activation. */
	activations: Glyph[];
}

/**
 * Picks a sensible default inscription for `target`, sparing the player the
 * manual card/activation clicks: the *cheapest* non-wasteful payment that
 * affords the cell, then activations filled to the cap in `priority` order.
 *
 * The result satisfies the same preconditions the engine enforces (CAN_PAY,
 * CAN_ACTIVATE), so it can be handed straight to InscribeRune. Returns null when
 * the cell isn't a legal inscribe target or the player can't afford it.
 */
export function autoSelectInscription(
	game: Game,
	player: PlayerSide,
	target: Position,
	priority: Glyph[] = DEFAULT_ACTIVATION_PRIORITY,
): AutoInscription | null {
	const cell = game.board[target.row]?.[target.col];
	if (!cell || cell.rune !== null || cell.hasCrux) return null;

	const baseCost = getBaseCost(cell);
	const discountedCost = getDiscountedCost(game, player, target);

	const targetElement = game.options.affinity ? getZoneForPosition(game, target).element : null;
	const controlled = getBondElements(game, player);
	const valueOf = (card: Card) => getCardValue(card, targetElement, controlled);

	const paidCards = selectCheapestPayment(game.players[player].hand, baseCost, discountedCost, valueOf);
	if (paidCards === null) return null;

	const paymentValue = paidCards.reduce((sum, c) => sum + valueOf(c), 0);
	const activationCount = Math.min(paymentValue, cell.glyphs.length);

	return {
		paidCardIds: paidCards.map(c => c.id),
		activations: fillActivations(cell.glyphs, activationCount, priority),
	};
}

/**
 * Cheapest hand subset whose value covers `discountedCost` without waste:
 * minimizes total paid value, then card count. Honors the engine's two payment
 * rules — at most `baseCost` cards, and no card that buys nothing (dropping the
 * lowest-value card must still fall short of the activation cap). Returns [] for
 * a free cell (cost 0) and null when nothing affords it.
 */
function selectCheapestPayment(
	hand: Card[],
	baseCost: number,
	discountedCost: number,
	valueOf: (card: Card) => number,
): Card[] | null {
	if (discountedCost === 0) return [];

	const maxCards = Math.min(baseCost, hand.length);
	const candidates: { cards: Card[]; value: number }[] = [];

	// Brute-force subsets up to maxCards; hand (≤ ~8) and baseCost (≤ 3) are tiny.
	const choose = (start: number, current: Card[], value: number): void => {
		if (current.length > 0) {
			const minValue = Math.min(...current.map(valueOf));
			const covers = value >= discountedCost;
			const noWaste = value - minValue < baseCost;
			if (covers && noWaste) candidates.push({ cards: [...current], value });
		}
		if (current.length === maxCards) return;
		for (let i = start; i < hand.length; i++) {
			current.push(hand[i]);
			choose(i + 1, current, value + valueOf(hand[i]));
			current.pop();
		}
	};
	choose(0, [], 0);

	if (candidates.length === 0) return null;
	// Cheapest by total value, then fewest cards.
	candidates.sort((a, b) => a.value - b.value || a.cards.length - b.cards.length);
	return candidates[0].cards;
}

/** Fills `count` activations from the cell's printed glyphs, in `priority` order. */
function fillActivations(printedGlyphs: Glyph[], count: number, priority: Glyph[]): Glyph[] {
	const counts = new Map<Glyph, number>();
	for (const g of printedGlyphs) counts.set(g, (counts.get(g) ?? 0) + 1);

	// Priority glyphs first, then any remaining printed types (e.g. shift glyphs).
	const order = [...priority, ...[...counts.keys()].filter(g => !priority.includes(g))];

	const out: Glyph[] = [];
	for (const glyph of order) {
		let avail = counts.get(glyph) ?? 0;
		while (avail > 0 && out.length < count) {
			out.push(glyph);
			avail--;
		}
		if (out.length === count) break;
	}
	return out;
}
