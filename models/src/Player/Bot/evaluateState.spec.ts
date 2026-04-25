import { expect } from 'chai';
import { INIT_GAME_STATE, Game } from '../../Game/Game';
import { simulateGameCommand } from '../../Game/simulateCommand';
import { clientGameCommand } from '../../Game/GameCommand/GameCommand';
import { DEFAULT_OPTIONS } from '../../Game/GameOptions';
import { Table } from '../../Table/Table';
import { DEFAULT_WEIGHTS, evaluateState } from './evaluateState';

function startedMainTurn(): Game {
	const table: Table = {
		id: 't', status: 'ready', options: DEFAULT_OPTIONS, createdAt: 0, updatedAt: 0,
		seats: [
			{ user: { id: 'L', name: 'L', photoURL: '' }, sidePreference: 'light' },
			{ user: { id: 'D', name: 'D', photoURL: '' }, sidePreference: 'dark' },
		],
	};
	const started = simulateGameCommand(INIT_GAME_STATE, clientGameCommand('StartGame', { table })).state;
	return simulateGameCommand(
		started,
		clientGameCommand('DraftCards', {
			player: 'dark',
			cardIds: [started.display[0].id, started.display[1].id],
		})
	).state;
}

describe('evaluateState', () => {
	it('returns a large positive number when mySide has won', () => {
		const state = { ...startedMainTurn(), winner: 'light' as const };
		expect(evaluateState(state, 'light')).to.equal(DEFAULT_WEIGHTS.win);
	});

	it('returns a large negative number when mySide has lost', () => {
		const state = { ...startedMainTurn(), winner: 'dark' as const };
		expect(evaluateState(state, 'light')).to.equal(DEFAULT_WEIGHTS.loss);
	});

	it('is symmetric — scoring is inverted when you flip sides', () => {
		const state = { ...startedMainTurn(), rift: 3 };
		const lightScore = evaluateState(state, 'light');
		const darkScore  = evaluateState(state, 'dark');
		expect(lightScore).to.equal(-darkScore);
	});

	it('rewards rift in your direction', () => {
		const base   = startedMainTurn();
		const rifted = { ...base, rift: 5 };
		expect(evaluateState(rifted, 'light')).to.be.greaterThan(evaluateState(base, 'light'));
		expect(evaluateState(rifted, 'dark')).to.be.lessThan(evaluateState(base, 'dark'));
	});
});
