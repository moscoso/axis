import { RandomBot, runSeries } from '../src/Player/Bot';

const light = new RandomBot({ name: 'Light-Rand' });
const dark  = new RandomBot({ name: 'Dark-Rand' });
const games = Number(process.argv[2] ?? 20);

const t0 = Date.now();
const series = runSeries({ light, dark, games });
const ms = Date.now() - t0;

const outcomes = series.games.map((g, i) => {
	const who = g.winner ?? (g.aborted ? 'ABORT' : '—');
	return `#${(i + 1).toString().padStart(2)}  ${who.padEnd(6)}  ${g.winReason ?? ''} — ${g.moveCount} moves, ${g.turnCount} turns`;
});

console.log('\n  Axis RandomBot-vs-RandomBot smoke test\n');
console.log(outcomes.join('\n'));
console.log();
console.log(`  Light wins:  ${series.lightWins}`);
console.log(`  Dark wins:   ${series.darkWins}`);
console.log(`  Draws:       ${series.draws}`);
console.log(`  Aborted:     ${series.aborted}`);
console.log(`  Avg moves:   ${series.avgMoves.toFixed(1)}`);
console.log(`  Avg turns:   ${series.avgTurns.toFixed(1)}`);
console.log(`  Total time:  ${ms}ms`);
console.log();
