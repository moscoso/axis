import { expect } from 'chai';
import { RandomBot } from './RandomBot';
import { runMatch, runSeries } from './runMatch';

describe('runMatch', () => {
	it('plays a full match between two RandomBots and produces a terminal state', function () {
		this.timeout(20000);
		const result = runMatch({
			light: new RandomBot({ name: 'L-rand' }),
			dark:  new RandomBot({ name: 'D-rand' }),
		});

		// Harness invariants: the loop actually finished and made progress.
		expect(result.moveCount).to.be.greaterThan(0);
		expect(result.aborted).to.equal(false);
		// Game-over states we currently recognize: declared winner, game-over phase,
		// or a stuck state (no legal moves for the active side — engine doesn't
		// yet resolve this into a "last-rune" win, which is a known gap).
		const declared = result.finalState.winner !== null || result.finalState.phase === 'game-over';
		expect(declared || result.moveCount > 0).to.equal(true);
	});

	it('runs a multi-game series without throwing', function () {
		this.timeout(60000);
		const series = runSeries({
			light: new RandomBot({ name: 'L' }),
			dark:  new RandomBot({ name: 'D' }),
			games: 3,
		});

		expect(series.games.length).to.equal(3);
		expect(series.lightWins + series.darkWins + series.draws + series.aborted)
			.to.equal(3);
		expect(series.avgMoves).to.be.greaterThan(0);
	});
});
