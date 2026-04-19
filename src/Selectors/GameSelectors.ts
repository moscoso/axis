import { Card } from '../Card/Card';
import { Element } from '../Element/Element';
import { PlayerSide } from '../Player/Player';
import { CruxControl, Position, Zone } from '../Zone/Zone';
import { BoardCell, Game } from '../Game/Game';

export function getZoneForPosition(state: Game, position: Position): Zone {
	return state.zones.find(z =>
		position.row >= z.topLeft.row &&
		position.row < z.topLeft.row + 3 &&
		position.col >= z.topLeft.col &&
		position.col < z.topLeft.col + 3
	)!;
}

export function countFriendlyRunesInRowOrColumn(state: Game, player: PlayerSide, position: Position): number {
	let count = 0;
	for (let col = 0; col < 6; col++) {
		if (col === position.col) continue;
		const rune = state.board[position.row][col].rune;
		if (rune?.owner === player) count++;
	}
	for (let row = 0; row < 6; row++) {
		if (row === position.row) continue;
		const rune = state.board[row][position.col].rune;
		if (rune?.owner === player) count++;
	}
	return count;
}

export function getBaseCost(cell: BoardCell): number {
	return cell.glyphs.length;
}

export function getControlledElements(state: Game, player: PlayerSide): Element[] {
	return state.zones
		.filter(z => z.control === player)
		.map(z => z.element);
}

/** Returns 2 if the card's element matches a Crux the player controls (Bond), otherwise 1. */
export function getCardPaymentValue(card: Card, controlledElements: Element[]): 1 | 2 {
	return controlledElements.includes(card.element) ? 2 : 1;
}

export function getDiscountedCost(state: Game, player: PlayerSide, position: Position): number {
	const cell = state.board[position.row][position.col];
	const baseCost = getBaseCost(cell);
	const discount = countFriendlyRunesInRowOrColumn(state, player, position);
	return Math.max(0, baseCost - discount);
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

export function isBoardFull(state: Game): boolean {
	return state.board.every(row => row.every(cell => cell.rune !== null));
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
	let score = 0;
	for (const zone of state.zones) {
		if (zone.control !== player) continue;
		for (let row = zone.topLeft.row; row < zone.topLeft.row + 3; row++) {
			for (let col = zone.topLeft.col; col < zone.topLeft.col + 3; col++) {
				const rune = state.board[row][col].rune;
				// Every Null Rune (flux === 0) inside a controlled Zone scores +1
				if (rune !== null && rune.flux === 0) score++;
			}
		}
	}
	return score;
}

export function getFinalScore(state: Game, player: PlayerSide): number {
	return getTotalFluxScore(state, player) + getZoneAuraScore(state, player);
}
