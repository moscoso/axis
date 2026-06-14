import { Card } from '../Card/Card';
import { PlayerSide } from '../Player/Player';
import { Position } from '../Zone/Zone';
import { Game } from '../Game/Game';
import { GameCommand, clientGameCommand } from '../Game/GameCommand/GameCommand';
import {
	getBaseCost,
	getCardValue,
	getBondElements,
	getZoneForPosition,
} from './GameSelectors';
import { getForceRoom, getSpellChargeTargets } from './SpellSelectors';
import { Element } from '../Element/Element';

/**
 * Enumerates every legal move available to `side` in the current state.
 *
 * Returned commands are constructed via {@link clientGameCommand} — the `game`
 * param is not injected, matching the shape a human client would send. Pass
 * them to {@link simulateGameCommand} or {@link Dealer.executeGameCommand}.
 *
 * Phase coverage:
 * - `setup` / `game-over` → returns []
 * - `starting-draft` → `DraftCards` choices for dark (light waits)
 * - `main-turn` with pending draws → `DrawCard` options only
 * - `main-turn` otherwise → every valid `InscribeRune` + every `DrawCard` option
 *
 * Inscribe enumeration is combinatorial. For each empty cell we try every
 * subset of hand-card payments that legally covers the cell's full printed
 * cost (every symbol then activates automatically). Bounded by hand size
 * (≤ ~8) and cost (≤ 6), which keeps this tractable for brute-force bots.
 */
export function getLegalMoves(state: Game, side: PlayerSide): GameCommand[] {
	if (state.phase === 'setup' || state.phase === 'game-over') return [];
	if (state.winner !== null) return [];

	if (state.phase === 'starting-draft') {
		if (side !== 'dark') return [];
		return enumerateDrafts(state);
	}

	// main-turn
	if (state.currentTurn !== side) return [];

	const mustDraw = state.pendingDraws > 0 || state.pendingStartOfTurnDraws > 0;
	const drawMoves = enumerateDraws(state, side);

	if (mustDraw) return drawMoves;

	return [
		...enumerateInscribes(state, side),
		...enumerateSpellCasts(state, side),
		...drawMoves,
	];
}

/**
 * Enumerates legal {@link CastSpell} moves: each display Spell the player can
 * afford (Force room ≥ cost) at every anchor where it would charge at least one
 * of the player's runes. Anchors that buff nothing are skipped — casting there
 * only spends Force for no gain.
 */
function enumerateSpellCasts(state: Game, side: PlayerSide): GameCommand[] {
	if (!state.options.spells) return [];

	const moves: GameCommand[] = [];
	const room = getForceRoom(state, side);

	for (const spell of state.spellDisplay) {
		if (spell.forceCost > room) continue;
		for (let r = 0; r < state.board.length; r++) {
			for (let c = 0; c < state.board[r].length; c++) {
				const anchor: Position = { row: r, col: c };
				if (getSpellChargeTargets(state, side, spell.shape, anchor).length === 0) continue;
				moves.push(clientGameCommand('CastSpell', { player: side, spellId: spell.id, anchor }));
			}
		}
	}
	return moves;
}

function enumerateDrafts(state: Game): GameCommand[] {
	const display = state.display;
	const moves: GameCommand[] = [];
	for (let i = 0; i < display.length; i++) {
		for (let j = i + 1; j < display.length; j++) {
			moves.push(
				clientGameCommand('DraftCards', {
					player: 'dark',
					cardIds: [display[i].id, display[j].id],
				})
			);
		}
	}
	return moves;
}

function enumerateDraws(state: Game, side: PlayerSide): GameCommand[] {
	const moves: GameCommand[] = [];
	for (const card of state.display) {
		// Cast: the DrawCardParams union trips Omit<> distribution.
		moves.push(clientGameCommand('DrawCard', { player: side, from: 'display', cardId: card.id } as any));
	}
	if (state.deck.length > 0) {
		moves.push(clientGameCommand('DrawCard', { player: side, from: 'deck' } as any));
	}
	return moves;
}

function enumerateInscribes(state: Game, side: PlayerSide): GameCommand[] {
	const moves: GameCommand[] = [];
	const hand = state.players[side].hand;
	const controlled = getBondElements(state, side);

	for (let r = 0; r < state.board.length; r++) {
		for (let c = 0; c < state.board[r].length; c++) {
			const cell = state.board[r][c];
			if (cell.rune !== null) continue;
			if (cell.hasCrux) continue;

			const position: Position = { row: r, col: c };
			const cost = getBaseCost(cell);

			// Zero-cost cell: no payment. Single move.
			if (cost === 0) {
				moves.push(
					clientGameCommand('InscribeRune', {
						player: side,
						target: position,
						paidCardIds: [],
					})
				);
				continue;
			}

			// Otherwise: enumerate every hand subset (size ≤ cost) that covers the cost.
			const targetElement = state.options.affinity === 'value' ? getZoneForPosition(state, position).element : null;
			forEachPaymentSubset(hand, cost, targetElement, controlled, (subset, paymentValue) => {
				if (paymentValue < cost) return;
				// No wasted card: dropping the lowest-value card must fall below the
				// cost, else a paid card buys nothing.
				const minValue = Math.min(...subset.map(card => getCardValue(card, targetElement, controlled)));
				if (paymentValue - minValue >= cost) return;
				moves.push(
					clientGameCommand('InscribeRune', {
						player: side,
						target: position,
						paidCardIds: subset.map(card => card.id),
					})
				);
			});
		}
	}
	return moves;
}

/** Enumerates all subsets of `hand` with size in [0, maxSize], yielding the subset and its payment value. */
function forEachPaymentSubset(
	hand: Card[],
	maxSize: number,
	targetElement: Element | null,
	controlled: ReturnType<typeof getBondElements>,
	visit: (subset: Card[], paymentValue: number) => void
): void {
	const n = hand.length;
	const cap = Math.min(maxSize, n);

	function recurse(start: number, current: Card[], value: number): void {
		if (current.length > 0) visit(current, value);
		if (current.length === cap) return;
		for (let i = start; i < n; i++) {
			current.push(hand[i]);
			recurse(i + 1, current, value + getCardValue(hand[i], targetElement, controlled));
			current.pop();
		}
	}
	recurse(0, [], 0);
}
