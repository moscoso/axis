import { Card } from '../Card/Card';
import { Element } from '../Element/Element';
import { PlayerSide } from '../Player/Player';
import { CruxControl, Position, Zone } from '../Zone/Zone';
import { BoardCell, Game } from '../Game/Game';

/**
 * The single Zone whose rectangle contains `position` — `'region'` model only.
 * In the `'cross'` model use {@link getZonesForPosition} instead (a cell belongs
 * to two Zones there).
 */
export function getZoneForPosition(state: Game, position: Position): Zone {
	return state.zones.find(z =>
		z.topLeft !== undefined &&
		position.row >= z.topLeft.row &&
		position.row < z.topLeft.row + z.height! &&
		position.col >= z.topLeft.col &&
		position.col < z.topLeft.col + z.width!
	)!;
}

/**
 * Every Zone a cell belongs to. In the `'region'` model that's exactly one (the
 * containing rectangle). In the `'cross'` model a non-Crux cell belongs to two —
 * the Crux on its row and the Crux on its column — while a Crux cell belongs to
 * the one Zone it anchors. Order is [rowCrux, colCrux] when they differ.
 */
export function getZonesForPosition(state: Game, position: Position): Zone[] {
	if (state.options.zoneModel === 'cross') {
		const rowZone = state.zones.find(z => z.cruxPosition.row === position.row);
		const colZone = state.zones.find(z => z.cruxPosition.col === position.col);
		const zones: Zone[] = [];
		if (rowZone) zones.push(rowZone);
		if (colZone && colZone !== rowZone) zones.push(colZone);
		return zones;
	}
	return [getZoneForPosition(state, position)];
}

/** The element(s) a cell sits in — its Affinity home suit(s). One or (cross) two. */
export function getElementsForPosition(state: Game, position: Position): Element[] {
	return getZonesForPosition(state, position).map(z => z.element);
}

export function getBaseCost(cell: BoardCell): number {
	return cell.glyphs.length;
}

export function getControlledElements(state: Game, player: PlayerSide): Element[] {
	return state.zones
		.filter(z => z.control === player)
		.map(z => z.element);
}

/**
 * Crux-controlled elements that confer Bond to `player`, or `[]` when the Bond
 * bonus is off. Feed straight into {@link getCardValue} as `controlledElements`.
 */
export function getBondElements(state: Game, player: PlayerSide): Element[] {
	return state.options.cruxBonus.bond ? getControlledElements(state, player) : [];
}

/**
 * A card's payment/activation value (capped at 2): worth 2 via Affinity (it
 * matches one of the target cell's home suit(s) — pass `[]` `targetElements` to
 * disable) or Bond (its element's Crux controlled — pass `[]` `controlledElements`
 * to disable, or {@link getBondElements} to honor the toggle). Otherwise 1; the
 * two never stack. `targetElements` holds one suit in the region model and up to
 * two (the cell's row + column Cruxes) in the cross model.
 */
export function getCardValue(
	card: Card,
	targetElements: Element[],
	controlledElements: Element[]
): 1 | 2 {
	if (targetElements.includes(card.element)) return 2;     // Affinity (home Zone)
	if (controlledElements.includes(card.element)) return 2; // Bond (controlled Crux, any Zone)
	return 1;
}

export function getFluxTotalForCruxLines(state: Game, cruxPosition: Position, player: PlayerSide): number {
	let total = 0;
	for (let col = 0; col < 6; col++) {
		const rune = state.board[cruxPosition.row][col].rune;
		if (rune?.owner === player && rune.flux > 0) total += rune.flux;
	}
	for (let row = 0; row < 6; row++) {
		if (row === cruxPosition.row) continue; // row already counted above
		const rune = state.board[row][cruxPosition.col].rune;
		if (rune?.owner === player && rune.flux > 0) total += rune.flux;
	}
	return total;
}

export function recomputeZones(state: Game): Zone[] {
	return state.zones.map(zone => {
		const lightFlux = getFluxTotalForCruxLines(state, zone.cruxPosition, 'light');
		const darkFlux  = getFluxTotalForCruxLines(state, zone.cruxPosition, 'dark');
		let control: CruxControl;
		if (lightFlux > 0 && lightFlux > darkFlux) control = 'light';
		else if (darkFlux > 0 && darkFlux > lightFlux) control = 'dark';
		else control = 'unbound';
		return { ...zone, control };
	});
}

/**
 * True when every inscribable cell has a Rune. Crux cells count as "filled"
 * because they can never be inscribed on (`IS_CELL_EMPTY` rejects them), so
 * holding the rest of the predicate hostage to them would make this forever
 * false. Used by the winner reducer to declare last-rune the moment the
 * board is finished, regardless of whatever cards are still in the deck.
 */
export function isBoardFull(state: Game): boolean {
	return state.board.every(row => row.every(cell => cell.hasCrux || cell.rune !== null));
}

export function getTotalFluxScore(state: Game, player: PlayerSide): number {
	let total = 0;
	for (const row of state.board) {
		for (const cell of row) {
			if (cell.rune?.owner === player) total += cell.rune.flux;
		}
	}
	return total;
}

export function getZoneAuraScore(state: Game, player: PlayerSide): number {
	if (state.options.zoneModel === 'cross') return crossAuraScore(state, player);

	let score = 0;
	for (const zone of state.zones) {
		if (zone.control !== player) continue;
		for (let row = zone.topLeft!.row; row < zone.topLeft!.row + zone.height!; row++) {
			for (let col = zone.topLeft!.col; col < zone.topLeft!.col + zone.width!; col++) {
				const rune = state.board[row][col].rune;
				// Every Null Rune (flux === 0) inside a controlled Zone scores +1
				if (rune !== null && rune.flux === 0) score++;
			}
		}
	}
	return score;
}

/**
 * Cross-model Aura: a Zone is its Crux's row + column, so we walk those lines for
 * each Zone `player` controls and count Null Runes. Cells at the intersection of
 * two controlled Zones score once per controlled Zone (up to +2) — owning both
 * crossing Cruxes is rewarded.
 */
function crossAuraScore(state: Game, player: PlayerSide): number {
	let score = 0;
	for (const zone of state.zones) {
		if (zone.control !== player) continue;
		const { row: cruxRow, col: cruxCol } = zone.cruxPosition;
		for (let col = 0; col < 6; col++) {
			const rune = state.board[cruxRow][col].rune;
			if (rune !== null && rune.flux === 0) score++;
		}
		for (let row = 0; row < 6; row++) {
			if (row === cruxRow) continue; // crux row already counted above
			const rune = state.board[row][cruxCol].rune;
			if (rune !== null && rune.flux === 0) score++;
		}
	}
	return score;
}

export function getFinalScore(state: Game, player: PlayerSide): number {
	return getTotalFluxScore(state, player) + getZoneAuraScore(state, player);
}

/**
 * Fast predicate: does `player` have at least one legal move in the current
 * main-turn state? A cheap alternative to enumerating every move — checks
 * draw availability, then whether any empty non-crux cell is affordable by
 * the top-payment-value cards in hand (capped at the cell's base cost).
 *
 * Returns false outside main-turn, for the non-active player, or when a game
 * has already ended.
 */
export function hasAnyLegalMove(state: Game, player: PlayerSide): boolean {
	if (state.phase !== 'main-turn') return false;
	if (state.winner !== null) return false;
	if (state.currentTurn !== player) return false;

	if (state.display.length > 0 || state.deck.length > 0) return true;

	// Display and deck are both empty. A pending-draw state here is a dead-end —
	// the player cannot inscribe until draws are resolved and there's nothing
	// to draw.
	if (state.pendingDraws > 0 || state.pendingStartOfTurnDraws > 0) return false;

	const hand = state.players[player].hand;
	const controlled = getBondElements(state, player);

	for (let r = 0; r < state.board.length; r++) {
		for (let c = 0; c < state.board[r].length; c++) {
			const cell = state.board[r][c];
			if (cell.rune !== null) continue;
			if (cell.hasCrux) continue;

			const position: Position = { row: r, col: c };
			const cost = getBaseCost(cell);
			if (cost === 0) return true;

			// Card values are Zone-dependent (Affinity), so rank per target. In the
			// cross model a cell has two home suits, so any matching card scores 2.
			const targetElements = state.options.affinity === 'value' ? getElementsForPosition(state, position) : [];
			const sortedValues = hand
				.map(card => getCardValue(card, targetElements, controlled))
				.sort((a, b) => b - a);

			const limit = Math.min(cost, sortedValues.length);
			let sum = 0;
			for (let i = 0; i < limit; i++) sum += sortedValues[i];
			if (sum >= cost) return true;
		}
	}
	return false;
}
