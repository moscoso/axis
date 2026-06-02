import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { getBaseCost, getCardValue, getBondElements, getDiscountedCost, getZoneForPosition } from '../../Selectors/GameSelectors';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * Validates that the offered cards constitute a legal payment for a rune inscription:
 * - All card IDs must refer to cards currently in the player's hand.
 * - Number of cards offered must not exceed the cell's base cost.
 * - Effective payment value (Affinity/Bond) must meet the discounted cost.
 * - No paid card may be pure waste: every card must buy at least one activation
 *   (activations cap at the printed symbols), so accidental over-overpaying —
 *   e.g. dumping spare cards that do nothing — is rejected. A single high-value
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

	const baseCost = getBaseCost(cell);
	if (paidCardIds.length > baseCost) {
		return GameError.TooManyCardsPaid(`Base cost is ${baseCost}, cannot pay with ${paidCardIds.length} cards`);
	}

	const controlledElements = getBondElements(game, player);
	const targetElement = game.options.affinity ? getZoneForPosition(game, target).element : null;
	const cardValues = resolvedCards.map(card => getCardValue(card!, targetElement, controlledElements));
	const paymentValue = cardValues.reduce((sum, v) => sum + v, 0);

	const discountedCost = getDiscountedCost(game, player, target);
	if (paymentValue < discountedCost) {
		return GameError.InsufficientPayment(`Need effective payment of ${discountedCost}, got ${paymentValue}`);
	}

	// No wasted card: if dropping the lowest-value card still meets the activation
	// cap (the printed symbols), that card buys nothing and the payment is wasteful.
	const paymentWastesACard =
		cardValues.length > 0 && paymentValue - Math.min(...cardValues) >= baseCost;
	if (paymentWastesACard) {
		return GameError.WastefulPayment(`Payment ${paymentValue} exceeds what ${baseCost} symbol(s) can activate`);
	}

	return null;
};
