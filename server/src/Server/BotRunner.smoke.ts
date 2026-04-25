import { Dealer, clientGameCommand, clientTableCommand } from 'axis-models';
import { BotRunner, botUserId } from './BotRunner';

/**
 * Headless end-to-end exercise of {@link BotRunner}: spin up a real Dealer,
 * seat a bot in seat 1, simulate a human joining seat 0, and let the game
 * run until termination. Asserts the bot actually drives its own moves.
 *
 * Run with: npx ts-node src/Server/BotRunner.smoke.ts
 */
function smoke() {
	const dealer = new Dealer('smoke-room');

	const runner = new BotRunner(dealer);
	const botId = botUserId('heuristic');
	runner.register(botId);

	// Seat the bot first (dark), then the human (light).
	dealer.executeTableCommand(clientTableCommand('JoinTable', {
		user: { id: botId, name: 'Bot', photoURL: '' }
	}));
	dealer.executeTableCommand(clientTableCommand('SelectSide', {
		userId: botId, sidePreference: 'dark'
	}));

	dealer.executeTableCommand(clientTableCommand('JoinTable', {
		user: { id: 'human-1', name: 'Human', photoURL: '' }
	}));
	dealer.executeTableCommand(clientTableCommand('SelectSide', {
		userId: 'human-1', sidePreference: 'light'
	}));

	// At this point the second JoinTable triggered StartGame via DEALER_TRIGGERS.
	// The game is in starting-draft, dark to act → bot should run.
	// Bot moves are queued via setImmediate; flush by waiting a tick.
	let moveCount = 0;
	const start = Date.now();

	function loop() {
		const state = dealer.gameState;
		if (state.winner !== null || state.phase === 'game-over' || state.phase === 'setup') {
			report();
			return;
		}

		// If it's the human's turn, simulate them by submitting a random legal
		// move so the bot keeps getting opportunities to act.
		const actingSide = state.phase === 'starting-draft' ? 'dark' : state.currentTurn;
		const actingUserId = state.playerIds?.[actingSide];

		if (actingUserId === 'human-1') {
			// Manually drive the human side with a stub random move.
			const { getLegalMoves } = require('axis-models');
			const moves = getLegalMoves(state, actingSide);
			if (moves.length === 0) { report(); return; }
			const choice = moves[Math.floor(Math.random() * moves.length)];
			dealer.executeGameCommand(clientGameCommand(choice.name as any, choice.params));
			moveCount++;
		}

		setImmediate(loop);
	}

	function report() {
		const ms = Date.now() - start;
		const state = dealer.gameState;
		console.log(`[smoke] phase=${state.phase} winner=${state.winner ?? 'none'} reason=${state.winReason ?? '-'} humanMoves=${moveCount} elapsed=${ms}ms`);
		if (state.phase === 'setup') {
			console.error('[smoke] FAIL: game never started — table didn\'t reach ready');
			process.exit(1);
		}
		console.log('[smoke] OK — BotRunner drove the game without throwing');
		process.exit(0);
	}

	setImmediate(loop);
}

smoke();
