import { expect } from 'chai';
import { HeuristicBot } from './HeuristicBot';
import { RandomBot } from './RandomBot';
import { runMatch, runSeries } from './runMatch';

describe('HeuristicBot', () => {
	it('plays a full match against RandomBot without throwing', function () {
		this.timeout(30000);
		const result = runMatch({
			light: new HeuristicBot({ name: 'Heur-L' }),
			dark:  new RandomBot({ name: 'Rand-D' }),
		});
		expect(result.moveCount).to.be.greaterThan(0);
		expect(result.aborted).to.equal(false);
	});

	it('wins comfortably against RandomBot over a short series', function () {
		this.timeout(120000);
		const series = runSeries({
			light: new HeuristicBot({ name: 'Heur' }),
			dark:  new RandomBot({ name: 'Rand' }),
			games: 10,
		});

		// Assert a loose lower bound — tight thresholds would flake.
		// The full benchmark (via `npm run bot:smoke`) uses 100+ games.
		const decidedGames = series.lightWins + series.darkWins;
		if (decidedGames > 0) {
			const lightWinRate = series.lightWins / decidedGames;
			expect(lightWinRate).to.be.greaterThan(0.5);
		}
	});
});
