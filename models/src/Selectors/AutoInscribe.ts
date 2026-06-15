import { Card } from '../Card/Card';
import { Game } from '../Game/Game';
import { PlayerSide } from '../Player/Player';
import { Position } from '../Zone/Zone';
import {
	getBaseCost,
	getBondElements,
	getCardValue,
	getElementsForPosition,
} from './GameSelectors';

export interface AutoInscription {
	paidCardIds: string[];
}

/**
 * Picks a sensible default payment for `target`, sparing the player the manual
 * card clicks: the *cheapest* non-wasteful set of cards that covers the cell's
 * full printed cost. Every symbol on the cell activates automatically, so there
 * is nothing else to choose.
 *
 * The result satisfies the same precondition the engine enforces (CAN_PAY), so
 * it can be handed straight to InscribeRune. Returns null when the cell isn't a
 * legal inscribe target or the player can't afford it.
 */
export function autoSelectInscription(
	game: Game,
	player: PlayerSide,
	target: Position,
): AutoInscription | null {
	const cell = game.board[target.row]?.[target.col];
	if (!cell || cell.rune !== null || cell.hasCrux) return null;

	const cost = getBaseCost(cell);

	const targetElements = game.options.affinity === 'value' ? getElementsForPosition(game, target) : [];
	const controlled = getBondElements(game, player);
	const valueOf = (card: Card) => getCardValue(card, targetElements, controlled);

	const paidCards = selectCheapestPayment(game.players[player].hand, cost, valueOf);
	if (paidCards === null) return null;

	return { paidCardIds: paidCards.map(c => c.id) };
}

/**
 * Cheapest hand subset whose value covers `cost` without waste: minimizes total
 * paid value, then card count. Honors the engine's two payment rules — at most
 * `cost` cards, and no card that buys nothing (dropping the lowest-value card
 * must still fall short of the cost). Returns [] for a free cell (cost 0) and
 * null when nothing affords it.
 */
function selectCheapestPayment(
	hand: Card[],
	cost: number,
	valueOf: (card: Card) => number,
): Card[] | null {
	if (cost === 0) return [];

	const maxCards = Math.min(cost, hand.length);
	const candidates: { cards: Card[]; value: number }[] = [];

	// Brute-force subsets up to maxCards; hand (≤ ~8) and cost (≤ 6) are tiny.
	const choose = (start: number, current: Card[], value: number): void => {
		if (current.length > 0) {
			const minValue = Math.min(...current.map(valueOf));
			const covers = value >= cost;
			const noWaste = value - minValue < cost;
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
