import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { getBaseCost, getCardValue, getBondElements, getElementsForPosition } from '../../Selectors/GameSelectors';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * Validates that the offered cards constitute a legal payment for a rune inscription.
 * Cost is the cell's full printed symbol count — there are no row/column discounts.
 * - All card IDs must refer to cards currently in the player's hand.
 * - Number of cards offered must not exceed the cost.
 * - Effective payment value (Affinity/Bond — a card may count as 2) must meet the cost.
 * - No paid card may be pure waste: dropping the lowest-value card must fall short of
 *   the cost, so dumping spare cards that buy nothing is rejected. A single high-value
 *   card may still overshoot by 1 when it can't be split (the only way to pay).
 */
export const CAN_PAY: GamePreconditionValidator = (
	{ game, player, target, paidCardIds }: { game: Game; player: PlayerSide; target: Position; paidCardIds: string[] }
) => {
	const cell = game.board[target.row][target.col];
	const hand = game.players[player].hand;

	const resolvedCards = paidCardIds.map(id => hand.find(c => c.id === id) ?? null);
	if (resolvedCards.some(c => c === null)) {
		return GameError.UndefinedCommandArguments();
	}

	const cost = getBaseCost(cell);
	if (paidCardIds.length > cost) {
		return GameError.TooManyCardsPaid(`Cost is ${cost}, cannot pay with ${paidCardIds.length} cards`);
	}

	const controlledElements = getBondElements(game, player);
	const targetElements = game.options.affinity === 'value' ? getElementsForPosition(game, target) : [];
	const cardValues = resolvedCards.map(card => getCardValue(card!, targetElements, controlledElements));
	const paymentValue = cardValues.reduce((sum, v) => sum + v, 0);

	if (paymentValue < cost) {
		return GameError.InsufficientPayment(`Need effective payment of ${cost}, got ${paymentValue}`);
	}

	// No wasted card: if dropping the lowest-value card still covers the cost,
	// that card buys nothing and the payment is wasteful.
	const paymentWastesACard =
		cardValues.length > 0 && paymentValue - Math.min(...cardValues) >= cost;
	if (paymentWastesACard) {
		return GameError.WastefulPayment(`Payment ${paymentValue} exceeds the cost of ${cost}`);
	}

	return null;
};
