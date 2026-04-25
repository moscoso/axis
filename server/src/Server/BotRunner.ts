import {
	Bot,
	Dealer,
	Game,
	HeuristicBot,
	PlayerSide,
	RandomBot,
	getLegalMoves,
	getPublicState
} from 'axis-models';

/**
 * The id-prefix convention for synthetic bot users. Any user whose id begins
 * with this is treated as a bot and driven server-side.
 */
export const BOT_USER_PREFIX = 'bot-';

/** Tag a userId as a bot of a specific kind. */
export function botUserId(kind: 'random' | 'heuristic', label = 'v1'): string {
	return `${BOT_USER_PREFIX}${kind}-${label}`;
}

function isBotUser(userId: string | undefined | null): boolean {
	return !!userId && userId.startsWith(BOT_USER_PREFIX);
}

function botFromUserId(userId: string): Bot {
	if (userId.includes('random')) return new RandomBot({ name: userId });
	return new HeuristicBot({ name: userId });
}

/**
 * Drives bot players for a single {@link Dealer} (one game room).
 *
 * Responsibilities:
 *   - Listen for {@link Dealer.emitter} `GameUpdate` events.
 *   - When the active side is mapped to a bot user, choose and submit the
 *     next move on the bot's behalf.
 *   - Stop driving when the game ends.
 *
 * The runner is reactive: there is no internal turn loop. Each move triggers
 * its own GameUpdate, which re-enters this handler until either the game
 * is over or the active side belongs to a human.
 *
 * Bot identity:
 *   A user with id starting with `{@link BOT_USER_PREFIX}` is considered a
 *   bot. The kind (random / heuristic) is currently inferred from the id —
 *   adding a real `botType` field on `Seat` is a follow-up.
 *
 * Concurrency:
 *   Bot moves are scheduled via `setImmediate` to avoid recursing inside
 *   the Dealer's own emit cycle. All work is single-threaded under Node's
 *   event loop, so no locks are needed.
 */
export class BotRunner {
	/** userId → Bot instance for everyone seated at the table that is a bot. */
	private readonly bots = new Map<string, Bot>();
	private disposed = false;
	private inFlight = false;

	constructor(private readonly dealer: Dealer) {
		dealer.emitter.on('GameUpdate', () => this.onGameUpdate());
		dealer.emitter.on('TableUpdate', () => this.syncBotsFromTable());
		this.syncBotsFromTable();
	}

	/** Manually register a bot for a userId (used by hardcoded test rooms). */
	public register(userId: string): void {
		if (!isBotUser(userId)) {
			throw new Error(`BotRunner.register: ${userId} doesn't look like a bot id`);
		}
		this.bots.set(userId, botFromUserId(userId));
	}

	public dispose(): void {
		this.disposed = true;
		this.bots.clear();
	}

	/**
	 * Walk the table and reconcile the bot registry with seat occupancy.
	 * Adds new bot-prefixed users; drops registry entries for bots whose
	 * seat has vacated (e.g. after VacateTable).
	 */
	private syncBotsFromTable(): void {
		const seats = this.dealer.tableState.seats;
		const seated = new Set<string>();
		for (const seat of seats) {
			if (!seat || !isBotUser(seat.user.id)) continue;
			seated.add(seat.user.id);
			if (!this.bots.has(seat.user.id)) this.bots.set(seat.user.id, botFromUserId(seat.user.id));
		}
		for (const id of this.bots.keys()) {
			if (!seated.has(id)) this.bots.delete(id);
		}
	}

	private onGameUpdate(): void {
		if (this.disposed) return;
		// setImmediate yields back to the dealer's own emit chain so we
		// don't reenter executeGameCommand inside a still-running emit.
		// inFlight guards against piling up duplicates if multiple updates
		// land before the scheduled tick runs.
		if (this.inFlight) return;
		this.inFlight = true;
		setImmediate(() => {
			this.inFlight = false;
			this.driveIfBotsTurn();
		});
	}

	private driveIfBotsTurn(): void {
		if (this.disposed) return;
		const state = this.dealer.gameState;
		if (state.winner !== null || state.phase === 'game-over') return;

		const actingSide = whoActs(state);
		if (!actingSide) return;

		const userId = state.playerIds?.[actingSide];
		if (!userId) return;
		const bot = this.bots.get(userId);
		if (!bot) return;

		const legalMoves = getLegalMoves(state, actingSide);
		if (legalMoves.length === 0) return;

		const publicState = getPublicState(state, actingSide);
		const move = bot.chooseMove(publicState, legalMoves);
		const result = this.dealer.executeGameCommand(move);
		if (result.isFailure) {
			console.warn(`[BotRunner] ${bot.name} produced a rejected move:`, result.error);
		}
	}
}

/** The side whose turn it is to act, accounting for the draft phase. */
function whoActs(state: Game): PlayerSide | null {
	if (state.phase === 'starting-draft') return 'dark';
	if (state.phase === 'main-turn') return state.currentTurn;
	return null;
}
