import { Card } from '../Card/Card';
import { Game } from '../Game/Game';
import { PlayerSide } from './Player';

/**
 * A view of {@link Game} as seen by a single side — opponent's hand and
 * deck contents are hidden (only counts are exposed). Display and discard are
 * public so they remain full.
 *
 * Bots **must** make decisions from this view. Any bot that touches the full
 * {@link Game} is peeking at hidden information; search/simulation code
 * may operate on full state but must sample unknowns rather than read them.
 */
export interface PublicGameState {
	id: string;
	phase: Game['phase'];
	board: Game['board'];
	zones: Game['zones'];
	currentTurn: PlayerSide;
	rift: number;
	discard: Card[];
	display: Card[];
	pendingDraws: number;
	pendingStartOfTurnDraws: number;
	options: Game['options'];
	winner: PlayerSide | null;
	winReason: Game['winReason'];

	/** Which side this view is for — all "own"/"opponent" fields are relative to this. */
	side: PlayerSide;
	/** The full hand for `side`. */
	ownHand: Card[];
	/** Card count for the opponent's hand — contents hidden. */
	opponentHandSize: number;
	/** Remaining cards in the draw pile. Order and identities hidden. */
	deckSize: number;
	/** Remaining cards in the discard pile — public, order preserved. */
	discardSize: number;
}

/** Builds a {@link PublicGameState} for `side` from the authoritative full state. */
export function getPublicState(state: Game, side: PlayerSide): PublicGameState {
	const opponent: PlayerSide = side === 'light' ? 'dark' : 'light';
	return {
		id: state.id,
		phase: state.phase,
		board: state.board,
		zones: state.zones,
		currentTurn: state.currentTurn,
		rift: state.rift,
		discard: state.discard,
		display: state.display,
		pendingDraws: state.pendingDraws,
		pendingStartOfTurnDraws: state.pendingStartOfTurnDraws,
		options: state.options,
		winner: state.winner,
		winReason: state.winReason,

		side,
		ownHand: state.players[side].hand,
		opponentHandSize: state.players[opponent].hand.length,
		deckSize: state.deck.length,
		discardSize: state.discard.length,
	};
}
