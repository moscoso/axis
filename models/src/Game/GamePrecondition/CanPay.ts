import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { getBaseCost, getCardValue, getControlledElements, getDiscountedCost, getZoneForPosition } from '../../Selectors/GameSelectors';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * Validates that the offered cards constitute a legal payment for a rune inscription:
 * - All card IDs must refer to cards currently in the player's hand.
 * - Number of cards offered must not exceed the cell's base cost.
 * - Effective payment value (accounting for Bond) must meet the discounted cost.
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

	const controlledElements = getControlledElements(game, player);
	const targetElement = getZoneForPosition(game, target).element;
	const paymentValue = resolvedCards.reduce(
		(sum, card) => sum + getCardValue(card!, targetElement, controlledElements), 0
	);

	const discountedCost = getDiscountedCost(game, player, target);
	if (paymentValue < discountedCost) {
		return GameError.InsufficientPayment(`Need effective payment of ${discountedCost}, got ${paymentValue}`);
	}

	return null;
};
