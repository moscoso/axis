import { PlayerSide } from '../../Player/Player';
import { Position } from '../../Zone/Zone';
import { Glyph } from '../../Glyph/Glyph';
import { getCardValue, getControlledElements, getZoneForPosition } from '../../Selectors/GameSelectors';
import { Game } from '../Game';
import { GameError } from '../GameError/GameError';
import { GamePreconditionValidator } from './GamePrecondition';

/**
 * Validates both the activation count and glyph usage for a rune inscription.
 * - Number of activations must equal the effective payment value.
 * - No glyph may be activated more times than it appears in the cell's printed glyphs.
 */
export const CAN_ACTIVATE: GamePreconditionValidator = (
	{ game, player, target, paidCardIds, chosenActivations }: {
		game: Game;
		player: PlayerSide;
		target: Position;
		paidCardIds: string[];
		chosenActivations: Glyph[];
	}
) => {
	const cell = game.board[target.row][target.col];
	const controlledElements = getControlledElements(game, player);
	const targetElement = getZoneForPosition(game, target).element;
	const hand = game.players[player].hand;

	const paymentValue = paidCardIds.reduce((sum, id) => {
		const card = hand.find(c => c.id === id);
		return sum + (card ? getCardValue(card, targetElement, controlledElements) : 0);
	}, 0);

	// Activations equal the payment value, but capped at the printed symbols:
	// overpaying a small space (e.g. a value-2 card on a 1-symbol cell) is legal,
	// the surplus value is simply wasted rather than blocking the move.
	const requiredActivations = Math.min(paymentValue, cell.glyphs.length);
	if (chosenActivations.length !== requiredActivations) {
		return GameError.InvalidActivationCount(`Expected ${requiredActivations} activations, got ${chosenActivations.length}`);
	}

	const printedCounts: Partial<Record<Glyph, number>> = {};
	for (const glyph of cell.glyphs) {
		printedCounts[glyph] = (printedCounts[glyph] ?? 0) + 1;
	}

	const chosenCounts: Partial<Record<Glyph, number>> = {};
	for (const glyph of chosenActivations) {
		chosenCounts[glyph] = (chosenCounts[glyph] ?? 0) + 1;
	}

	for (const [glyph, count] of Object.entries(chosenCounts) as [Glyph, number][]) {
		if (count > (printedCounts[glyph] ?? 0)) {
			return GameError.InvalidActivationCount(
				`Cannot activate '${glyph}' ${count}× — only ${printedCounts[glyph] ?? 0} printed`
			);
		}
	}

	return null;
};
