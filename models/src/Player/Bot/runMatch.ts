import { User } from '@moscoso/models';
import { simulateGameCommand } from '../../Game/simulateCommand';
import { Game, INIT_GAME_STATE } from '../../Game/Game';
import { GameEvent } from '../../Game/GameEvent/GameEvent';
import { DEFAULT_OPTIONS, GameOptions } from '../../Game/GameOptions';
import { clientGameCommand } from '../../Game/GameCommand/GameCommand';
import { getLegalMoves } from '../../Selectors/LegalMoves';
import { Table } from '../../Table/Table';
import { PlayerSide } from '../Player';
import { getPublicState } from '../PublicGameState';
import { Bot } from './Bot';

export interface MatchOptions {
	/** Bot seated on the Light side. */
	light: Bot;
	/** Bot seated on the Dark side. */
	dark: Bot;
	/** Rule options for this match. Defaults to vanilla. */
	gameOptions?: GameOptions;
	/**
	 * Hard cap on moves before the match is declared a draw. Guards against
	 * buggy bots or deck-exhaustion loops. Generous default — real games are
	 * under 200 moves.
	 */
	maxMoves?: number;
}

export interface MatchResult {
	winner: PlayerSide | null;
	winReason: Game['winReason'];
	/** True if the match was halted by `maxMoves` rather than a real game end. */
	aborted: boolean;
	moveCount: number;
	turnCount: number;
	finalState: Game;
	events: GameEvent[];
}

/**
 * Plays a single headless match between two bots and returns the outcome.
 *
 * Side assignment is fixed: `options.light` plays Light, `options.dark` plays
 * Dark. This is achieved by building a {@link Table} with explicit side
 * preferences so {@link StartGame} doesn't flip the coin.
 *
 * Every call starts from {@link INIT_GAME_STATE}. Deck shuffle and board
 * generation still use `Math.random`, so match outcomes aren't deterministic
 * across runs unless you stub those upstream.
 */
export function runMatch(options: MatchOptions): MatchResult {
	const bots: Record<PlayerSide, Bot> = { light: options.light, dark: options.dark };
	const maxMoves = options.maxMoves ?? 2000;

	let state = startGame(options.gameOptions ?? DEFAULT_OPTIONS);
	const events: GameEvent[] = [];
	let moveCount = 0;
	let turnCount = 0;

	while (!isTerminal(state)) {
		if (moveCount >= maxMoves) {
			return {
				winner: state.winner,
				winReason: state.winReason,
				aborted: true,
				moveCount,
				turnCount,
				finalState: state,
				events,
			};
		}

		const side = whoActs(state);
		const legalMoves = getLegalMoves(state, side);
		if (legalMoves.length === 0) break;

		const publicState = getPublicState(state, side);
		const move = bots[side].chooseMove(publicState, legalMoves);

		if (!legalMoves.includes(move)) {
			throw new Error(
				`${bots[side].name} returned a move not in the legalMoves list ` +
				`(side=${side}, phase=${state.phase})`
			);
		}

		const applied = simulateGameCommand(state, move);
		if (!applied.ok) {
			throw new Error(
				`${bots[side].name} produced an invalid move: ${applied.error?.message ?? 'unknown error'}`
			);
		}

		state = applied.state;
		events.push(...applied.events);
		moveCount++;
		turnCount += applied.events.filter(e => e.type === 'Turn Ended').length;
	}

	return {
		winner: state.winner,
		winReason: state.winReason,
		aborted: false,
		moveCount,
		turnCount,
		finalState: state,
		events,
	};
}

function startGame(gameOptions: GameOptions): Game {
	const userA: User = { id: 'bot-light', name: 'Light', photoURL: '' };
	const userB: User = { id: 'bot-dark', name: 'Dark',  photoURL: '' };
	const table: Table = {
		id: 'match',
		seats: [
			{ user: userA, sidePreference: 'light' },
			{ user: userB, sidePreference: 'dark' },
		],
		status: 'ready',
		options: gameOptions,
		createdAt: 0,
		updatedAt: 0,
	};

	const result = simulateGameCommand(INIT_GAME_STATE, clientGameCommand('StartGame', { table }));
	if (!result.ok) {
		throw new Error(`StartGame failed: ${result.error?.message ?? 'unknown'}`);
	}
	return result.state;
}

function whoActs(state: Game): PlayerSide {
	if (state.phase === 'starting-draft') return 'dark';
	return state.currentTurn;
}

function isTerminal(state: Game): boolean {
	return state.winner !== null || state.phase === 'game-over';
}

/** Runs `n` matches and returns aggregate results. Useful for bot-vs-bot benchmarking. */
export interface SeriesResult {
	games: MatchResult[];
	lightWins: number;
	darkWins: number;
	draws: number;
	aborted: number;
	avgMoves: number;
	avgTurns: number;
}

export function runSeries(options: MatchOptions & { games: number }): SeriesResult {
	const { games, ...matchOptions } = options;
	const results: MatchResult[] = [];
	let lightWins = 0, darkWins = 0, draws = 0, aborted = 0;
	let totalMoves = 0, totalTurns = 0;

	for (let i = 0; i < games; i++) {
		const r = runMatch(matchOptions);
		results.push(r);
		if (r.aborted) aborted++;
		if (r.winner === 'light') lightWins++;
		else if (r.winner === 'dark') darkWins++;
		else draws++;
		totalMoves += r.moveCount;
		totalTurns += r.turnCount;
	}

	return {
		games: results,
		lightWins,
		darkWins,
		draws,
		aborted,
		avgMoves: totalMoves / games,
		avgTurns: totalTurns / games,
	};
}
