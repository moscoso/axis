import { Bot, HeuristicBot, RandomBot, runSeries, SeriesResult } from '../src/Player/Bot';

const GAMES = Number(process.argv[2] ?? 20);

function bench(label: string, lightFactory: () => Bot, darkFactory: () => Bot): SeriesResult {
	const t0 = Date.now();
	// Play both match-ups so side-bias (Light goes first) doesn't skew the result.
	const half = Math.max(1, Math.floor(GAMES / 2));
	const forward = runSeries({ light: lightFactory(), dark: darkFactory(), games: half });
	const reverse = runSeries({ light: darkFactory(), dark: lightFactory(), games: GAMES - half });
	const ms = Date.now() - t0;

	// "A" = whoever the first factory built; "B" = the second, regardless of side.
	const aWins = forward.lightWins + reverse.darkWins;
	const bWins = forward.darkWins  + reverse.lightWins;
	const draws = forward.draws     + reverse.draws;
	const aborted = forward.aborted + reverse.aborted;
	const total = aWins + bWins + draws + aborted;
	const decided = aWins + bWins;

	console.log(`\n  ${label}  (${GAMES} games, ${ms}ms)`);
	console.log(`    A wins:    ${aWins} / ${total}${decided ? `  (${(aWins / decided * 100).toFixed(1)}% of decided)` : ''}`);
	console.log(`    B wins:    ${bWins} / ${total}`);
	console.log(`    draws:     ${draws}`);
	console.log(`    aborted:   ${aborted}`);

	return {
		games: [...forward.games, ...reverse.games],
		lightWins: aWins,
		darkWins: bWins,
		draws,
		aborted,
		avgMoves: (forward.avgMoves * forward.games.length + reverse.avgMoves * reverse.games.length) / total,
		avgTurns: (forward.avgTurns * forward.games.length + reverse.avgTurns * reverse.games.length) / total,
	};
}

console.log(`\n  Axis bot benchmark  (N=${GAMES} per matchup)\n`);

bench(
	'Random vs Random (baseline — should be ~50/50)',
	() => new RandomBot({ name: 'Rand-A' }),
	() => new RandomBot({ name: 'Rand-B' }),
);

bench(
	'Heuristic vs Random (target: >55% for Heuristic)',
	() => new HeuristicBot({ name: 'Heur' }),
	() => new RandomBot({ name: 'Rand' }),
);

console.log();
