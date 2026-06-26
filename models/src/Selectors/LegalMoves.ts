import { PlayerSide } from '../Player/Player';
import { Game } from '../Game/Game';
import { GameCommand, clientGameCommand } from '../Game/GameCommand/GameCommand';

/**
 * Enumerates every legal move available to `side` in the current state.
 *
 * Returned commands are constructed via {@link clientGameCommand} — the `game`
 * param is not injected, matching the shape a human client would send. Pass
 * them to {@link simulateGameCommand} or {@link Dealer.executeGameCommand}.
 *
 * In the dice game a move is just `(cell, color)`: pick a die whose color is one
 * of the empty cell's two colors and inscribe its current face. Every empty
 * non-Crux cell therefore yields exactly two moves (its row color and its column
 * color), so enumeration is at most 30 × 2 = 60 commands.
 */
export function getLegalMoves(state: Game, side: PlayerSide): GameCommand[] {
	if (state.phase !== 'main-turn') return [];
	if (state.winner !== null) return [];
	if (state.currentTurn !== side) return [];

	const moves: GameCommand[] = [];
	for (const row of state.board) {
		for (const cell of row) {
			if (cell.hasCrux || cell.stone !== null) continue;
			for (const color of [cell.rowColor, cell.colColor]) {
				moves.push(clientGameCommand('InscribeGlyph', {
					player: side,
					dieColor: color,
					target: cell.position,
				}));
			}
		}
	}
	return moves;
}
