import { expect } from 'chai';
import { simulateGameCommand } from '../Game/simulateCommand';
import { INIT_GAME_STATE } from '../Game/Game';
import { clientGameCommand } from '../Game/GameCommand/GameCommand';
import { DEFAULT_OPTIONS } from '../Game/GameOptions';
import { Table } from '../Table/Table';
import { getLegalMoves } from './LegalMoves';

function startedState() {
	const table: Table = {
		id: 't', status: 'ready', options: DEFAULT_OPTIONS, createdAt: 0, updatedAt: 0,
		seats: [
			{ user: { id: 'L', name: 'L', photoURL: '' }, sidePreference: 'light' },
			{ user: { id: 'D', name: 'D', photoURL: '' }, sidePreference: 'dark' },
		],
	};
	return simulateGameCommand(INIT_GAME_STATE, clientGameCommand('StartGame', { table })).state;
}

describe('getLegalMoves', () => {
	it('returns no moves in the setup phase', () => {
		expect(getLegalMoves(INIT_GAME_STATE, 'light')).to.deep.equal([]);
		expect(getLegalMoves(INIT_GAME_STATE, 'dark')).to.deep.equal([]);
	});

	it('only offers DraftCards to dark during starting-draft', () => {
		const state = startedState();
		expect(state.phase).to.equal('starting-draft');

		const lightMoves = getLegalMoves(state, 'light');
		const darkMoves = getLegalMoves(state, 'dark');

		expect(lightMoves).to.deep.equal([]);
		// 4 cards in display, choose 2 → C(4,2) = 6 options
		expect(darkMoves.length).to.equal(6);
		expect(darkMoves.every(m => m.name === 'DraftCards')).to.equal(true);
	});

	it('returns a non-empty move set in main-turn for the active side', () => {
		let state = startedState();
		const draftIds: [string, string] = [state.display[0].id, state.display[1].id];
		state = simulateGameCommand(
			state,
			clientGameCommand('DraftCards', { player: 'dark', cardIds: draftIds })
		).state;

		expect(state.phase).to.equal('main-turn');
		expect(state.currentTurn).to.equal('light');

		const lightMoves = getLegalMoves(state, 'light');
		const darkMoves  = getLegalMoves(state, 'dark');

		expect(lightMoves.length).to.be.greaterThan(0);
		expect(darkMoves).to.deep.equal([]);

		const kinds = new Set(lightMoves.map(m => m.name));
		expect(kinds.has('DrawCard')).to.equal(true);
		// Inscribe may or may not be possible depending on random board — but usually is.
	});

	it('returns only Draw options when the active player has pending draws', () => {
		let state = startedState();
		state = simulateGameCommand(
			state,
			clientGameCommand('DraftCards', {
				player: 'dark',
				cardIds: [state.display[0].id, state.display[1].id],
			})
		).state;

		// Force pending draws by mutating state (test-only shortcut).
		state = { ...state, pendingDraws: 2 };

		const moves = getLegalMoves(state, state.currentTurn);
		expect(moves.every(m => m.name === 'DrawCard')).to.equal(true);
	});
});
