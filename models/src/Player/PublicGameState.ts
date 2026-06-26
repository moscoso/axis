import { Game } from '../Game/Game';
import { PlayerSide } from './Player';

/**
 * A view of {@link Game} as seen by a single side. The dice game has **no
 * hidden information** — the board, Cruxes, dice pool, score, and Rift are all
 * public — so this is effectively the full state minus the RNG seed (which must
 * stay secret so neither side can foresee future rolls).
 *
 * `side` marks whose perspective this view is for; "own"/"opponent" framing in
 * bots is derived from it.
 */
export interface PublicGameState {
	id: string;
	phase: Game['phase'];
	board: Game['board'];
	cruxes: Game['cruxes'];
	dice: Game['dice'];
	currentTurn: PlayerSide;
	rift: number;
	score: Game['score'];
	winner: PlayerSide | null;
	winReason: Game['winReason'];
	options: Game['options'];

	/** Which side this view is for. */
	side: PlayerSide;
}

/** Builds a {@link PublicGameState} for `side` from the authoritative full state. */
export function getPublicState(state: Game, side: PlayerSide): PublicGameState {
	return {
		id: state.id,
		phase: state.phase,
		board: state.board,
		cruxes: state.cruxes,
		dice: state.dice,
		currentTurn: state.currentTurn,
		rift: state.rift,
		score: state.score,
		winner: state.winner,
		winReason: state.winReason,
		options: state.options,
		side,
	};
}
