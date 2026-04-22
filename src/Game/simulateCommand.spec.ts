import { expect } from 'chai';
import { simulateGameCommand } from './simulateCommand';
import { INIT_GAME_STATE } from './Game';
import { clientGameCommand } from './GameCommand/GameCommand';
import { Table } from '../Table/Table';
import { DEFAULT_OPTIONS } from './GameOptions';

function buildReadyTable(): Table {
	return {
		id: 'test-table',
		seats: [
			{ user: { id: 'alice', name: 'Alice', photoURL: '' }, sidePreference: 'light' },
			{ user: { id: 'bob',   name: 'Bob',   photoURL: '' }, sidePreference: 'dark' },
		],
		status: 'ready',
		options: DEFAULT_OPTIONS,
		createdAt: 0,
		updatedAt: 0,
	};
}

describe('simulateGameCommand', () => {
	it('simulates StartGame into a playable starting state', () => {
		const result = simulateGameCommand(
			INIT_GAME_STATE,
			clientGameCommand('StartGame', { table: buildReadyTable() })
		);

		expect(result.ok).to.equal(true);
		expect(result.state.phase).to.equal('starting-draft');
		expect(result.state.board.length).to.equal(6);
		expect(result.state.display.length).to.equal(4);
		expect(result.events.map(e => e.type)).to.include('Game Started');
	});

	it('leaves state unchanged on failure', () => {
		// Running StartGame against an already-started game fails the IS_PHASE('setup') check
		const start = simulateGameCommand(
			INIT_GAME_STATE,
			clientGameCommand('StartGame', { table: buildReadyTable() })
		);
		const second = simulateGameCommand(
			start.state,
			clientGameCommand('StartGame', { table: buildReadyTable() })
		);

		expect(second.ok).to.equal(false);
		expect(second.state).to.equal(start.state);
		expect(second.events).to.deep.equal([]);
	});

	it('recursively applies follow-up commands produced by a command', () => {
		const start = simulateGameCommand(
			INIT_GAME_STATE,
			clientGameCommand('StartGame', { table: buildReadyTable() })
		).state;

		// Dark drafts two of the four display cards.
		const draftIds: [string, string] = [start.display[0].id, start.display[1].id];
		const afterDraft = simulateGameCommand(
			start,
			clientGameCommand('DraftCards', { player: 'dark', cardIds: draftIds })
		);

		expect(afterDraft.ok).to.equal(true);
		expect(afterDraft.state.phase).to.equal('main-turn');
		expect(afterDraft.state.players.dark.hand.length).to.equal(2);
		expect(afterDraft.state.players.light.hand.length).to.equal(2);
	});
});
