import { GameError } from './GameError/GameError';
import { GameEvent } from './GameEvent/GameEvent';
import { Game } from './Game';
import { GameCommand } from './GameCommand/GameCommand';
import { gameReducer } from './GameReducer/Game.reducer';

/**
 * Result of simulating a {@link GameCommand} against a {@link Game} in isolation.
 * Pure version of {@link Dealer.executeGameCommand} — no emitters, no broadcast,
 * no dealer triggers. Intended for bots that need to look ahead or score
 * hypothetical moves without mutating the live game.
 */
export interface CommandSimulation {
	ok: boolean;
	/** The resulting state. Identical to the input on failure. */
	state: Game;
	/** Every event produced, in order, including those from follow-up commands. */
	events: GameEvent[];
	error?: GameError;
}

/**
 * Simulates a {@link GameCommand} against a {@link Game} without any side
 * effects — the input state is never mutated. Use this for bot lookahead and
 * "what-if" scoring; the live engine path goes through {@link Dealer.executeGameCommand}.
 *
 * - Injects the game state into the command's params (matching what the Dealer does).
 * - Folds each produced event through {@link gameReducer} to build the next state.
 * - Recursively applies any follow-up commands against the updated state.
 *
 * Note: {@link DEALER_TRIGGERS} (StartGame on join, RecordGame on end, etc.) are
 * intentionally NOT fired here. Those concern lobby/session transitions, not
 * mid-game play, so bots don't need them.
 */
export function simulateGameCommand(state: Game, command: GameCommand<any>): CommandSimulation {
	command.params.game = state;

	let result;
	try {
		result = command.execute();
	} catch (error: any) {
		return { ok: false, state, events: [], error };
	}

	if (!result.isSuccess) {
		return { ok: false, state, events: [], error: result.error };
	}

	let nextState = state;
	const events: GameEvent[] = [];

	for (const event of result.value.events) {
		nextState = gameReducer(event, nextState);
		events.push(event);
	}

	for (const followUp of result.value.commands) {
		// A winning command (InscribeRune producing fluxmate, rift-break, or
		// last-rune) leaves the state in game-over. Subsequent auto-queued
		// commands like EndTurn would then fail IS_NOT_GAME_OVER. Skip them —
		// the primary command's events have already decided the outcome.
		if (nextState.winner !== null || nextState.phase === 'game-over') break;

		const sub = simulateGameCommand(nextState, followUp);
		if (!sub.ok) return { ok: false, state, events: [], error: sub.error };
		nextState = sub.state;
		events.push(...sub.events);
	}

	return { ok: true, state: nextState, events };
}
