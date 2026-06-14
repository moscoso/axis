import { expect } from 'chai';
import { simulateGameCommand } from '../Game/simulateCommand';
import { Game, INIT_GAME_STATE } from '../Game/Game';
import { clientGameCommand } from '../Game/GameCommand/GameCommand';
import { DEFAULT_OPTIONS } from '../Game/GameOptions';
import { Table } from '../Table/Table';
import { Element } from '../Element/Element';
import { Position } from '../Zone/Zone';
import { autoSelectInscription } from './AutoInscribe';
import { getZoneForPosition } from './GameSelectors';

function startedState(): Game {
	const table: Table = {
		id: 't', status: 'ready',
		options: { ...DEFAULT_OPTIONS, startOfTurnDraws: 0, affinity: 'value' },
		createdAt: 0, updatedAt: 0,
		seats: [
			{ user: { id: 'L', name: 'L', photoURL: '' }, sidePreference: 'light' },
			{ user: { id: 'D', name: 'D', photoURL: '' }, sidePreference: 'dark' },
		],
	};
	return simulateGameCommand(INIT_GAME_STATE, clientGameCommand('StartGame', { table })).state;
}

/** A fresh main-turn state with `light` to act (dark has drafted). */
function mainTurnState(): Game {
	const state = startedState();
	const draftIds: [string, string] = [state.display[0].id, state.display[1].id];
	return simulateGameCommand(
		state,
		clientGameCommand('DraftCards', { player: 'dark', cardIds: draftIds })
	).state;
}

function setCell(state: Game, pos: Position, patch: Record<string, unknown>): Game {
	const board = state.board.map(r => r.map(c => ({ ...c })));
	board[pos.row][pos.col] = { ...board[pos.row][pos.col], ...patch } as typeof board[0][0];
	return { ...state, board };
}

function withLightHand(state: Game, hand: { id: string; element: Element }[]): Game {
	return { ...state, players: { ...state.players, light: { ...state.players.light, hand } } };
}

function inscribe(state: Game, target: Position, paidCardIds: string[]) {
	return simulateGameCommand(
		state,
		clientGameCommand('InscribeRune', { player: 'light', target, paidCardIds })
	);
}

describe('autoSelectInscription', () => {
	it('returns null for crux and occupied cells', () => {
		const state = mainTurnState();
		const crux = state.zones[0].cruxPosition;
		expect(autoSelectInscription(state, 'light', crux)).to.equal(null);

		const occupied = { row: 0, col: 0 };
		const dirty = setCell(state, occupied, { rune: { owner: 'dark', flux: 0 } });
		expect(autoSelectInscription(dirty, 'light', occupied)).to.equal(null);
	});

	it('picks the empty (free) move on a zero-cost cell', () => {
		const target: Position = { row: 0, col: 0 };
		const state = setCell(mainTurnState(), target, { glyphs: [], rune: null, hasCrux: false });

		const auto = autoSelectInscription(state, 'light', target);
		expect(auto).to.deep.equal({ paidCardIds: [] });
		expect(inscribe(state, target, []).ok).to.equal(true);
	});

	it('prefers the cheaper card by VALUE, not just count (Affinity-aware)', () => {
		const target: Position = { row: 0, col: 0 };
		let state = setCell(mainTurnState(), target, { glyphs: ['+'], rune: null, hasCrux: false });
		const zoneEl = getZoneForPosition(state, target).element;
		const otherEl = (['sun', 'moon', 'star', 'comet'] as Element[]).find(e => e !== zoneEl)!;
		// 'match' is worth 2 here via Affinity; 'other' is worth 1. Cost is 1.
		state = withLightHand(state, [{ id: 'match', element: zoneEl }, { id: 'other', element: otherEl }]);

		const auto = autoSelectInscription(state, 'light', target)!;
		expect(auto.paidCardIds).to.deep.equal(['other']);
		expect(inscribe(state, target, auto.paidCardIds).ok).to.equal(true);
	});

	it('covers the full printed cost — no row/column discount', () => {
		const target: Position = { row: 0, col: 0 };
		let state = mainTurnState();
		state = { ...state, options: { ...state.options, affinity: 'off' } };
		// 3 printed glyphs: cost is the full 3 even with a friendly rune in the row.
		state = setCell(state, target, { glyphs: ['◇', '▲', '+'], rune: null, hasCrux: false });
		state = setCell(state, { row: 0, col: 1 }, { rune: { owner: 'light', flux: 0 } });
		state = withLightHand(state, [
			{ id: 'a', element: 'sun' }, { id: 'b', element: 'sun' }, { id: 'c', element: 'sun' },
		]);

		const auto = autoSelectInscription(state, 'light', target)!;
		expect(auto.paidCardIds.slice().sort()).to.deep.equal(['a', 'b', 'c']);
		expect(inscribe(state, target, auto.paidCardIds).ok).to.equal(true);
	});

	it('every auto-selected inscription is engine-legal', () => {
		let state = mainTurnState();
		state = withLightHand(state, [
			{ id: 'h1', element: 'sun' }, { id: 'h2', element: 'moon' },
			{ id: 'h3', element: 'star' }, { id: 'h4', element: 'comet' },
		]);

		let tested = 0;
		for (let r = 0; r < 6; r++) {
			for (let c = 0; c < 6; c++) {
				const cell = state.board[r][c];
				if (cell.rune !== null || cell.hasCrux) continue;
				const auto = autoSelectInscription(state, 'light', { row: r, col: c });
				if (!auto) continue;
				const sim = inscribe(state, { row: r, col: c }, auto.paidCardIds);
				expect(sim.ok, `cell ${r},${c}: ${sim.error?.message ?? ''}`).to.equal(true);
				tested++;
			}
		}
		expect(tested).to.be.greaterThan(0);
	});
});
