import { expect } from 'chai';
import { simulateGameCommand } from '../Game/simulateCommand';
import { INIT_GAME_STATE } from '../Game/Game';
import { clientGameCommand } from '../Game/GameCommand/GameCommand';
import { DEFAULT_OPTIONS } from '../Game/GameOptions';
import { Table } from '../Table/Table';
import { getPublicState } from './PublicGameState';

function startedMainTurnState() {
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

describe('getPublicState', () => {
	it('exposes own hand but only the opponent hand size', () => {
		const state = startedMainTurnState();
		const lightView = getPublicState(state, 'light');

		expect(lightView.side).to.equal('light');
		expect(lightView.ownHand).to.deep.equal(state.players.light.hand);
		expect(lightView.opponentHandSize).to.equal(state.players.dark.hand.length);
		expect((lightView as any).deck).to.equal(undefined);
		expect((lightView as any).players).to.equal(undefined);
	});

	it('reports deckSize and discardSize instead of raw piles', () => {
		const state = startedMainTurnState();
		const view = getPublicState(state, 'dark');

		expect(view.deckSize).to.equal(state.deck.length);
		expect(view.discardSize).to.equal(state.discard.length);
	});
});
