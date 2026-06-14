import { expect } from 'chai';
import { simulateGameCommand } from './simulateCommand';
import { INIT_GAME_STATE, Game, BoardCell } from './Game';
import { clientGameCommand } from './GameCommand/GameCommand';
import { Table } from '../Table/Table';
import { DEFAULT_OPTIONS } from './GameOptions';
import { Glyph } from '../Glyph/Glyph';

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

	it('allows overpaying a 1-symbol space with a value-2 Affinity card (surplus wasted)', () => {
		// Regression: a Water card (worth 2 via Affinity) on a 1-symbol Water cell
		// must be a legal inscribe — activations cap at the printed symbol, the
		// extra value is wasted rather than blocking the move.
		const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
			Array.from({ length: 6 }, (_, col): BoardCell => ({
				position: { row, col },
				zoneId: '',
				glyphs: [] as Glyph[],
				rune: null,
				hasCrux: false,
			}))
		);
		board[0][0].glyphs = ['+']; // 1-symbol target in the Water Zone

		const state: Game = {
			...INIT_GAME_STATE,
			id: 'overpay',
			phase: 'main-turn',
			currentTurn: 'dark',
			options: { ...INIT_GAME_STATE.options, affinity: 'value' },
			board,
			zones: [
				{ id: 'z-comet', element: 'comet', topLeft: { row: 0, col: 0 }, width: 3, height: 3, cruxPosition: { row: 0, col: 2 }, control: 'unbound' },
				{ id: 'z-sun',  element: 'sun',  topLeft: { row: 0, col: 3 }, width: 3, height: 3, cruxPosition: { row: 0, col: 5 }, control: 'unbound' },
				{ id: 'z-moon', element: 'moon', topLeft: { row: 3, col: 0 }, width: 3, height: 3, cruxPosition: { row: 5, col: 2 }, control: 'unbound' },
				{ id: 'z-star',   element: 'star',   topLeft: { row: 3, col: 3 }, width: 3, height: 3, cruxPosition: { row: 5, col: 5 }, control: 'unbound' },
			],
			players: {
				light: { side: 'light', hand: [] },
				dark:  { side: 'dark',  hand: [{ id: 'w1', element: 'comet' }] },
			},
		};

		const result = simulateGameCommand(
			state,
			clientGameCommand('InscribeRune', {
				player: 'dark',
				target: { row: 0, col: 0 },
				paidCardIds: ['w1'],
			})
		);

		expect(result.ok).to.equal(true);
		// Base charge 0 + one `+` activation (surplus payment wasted) = flux 1.
		expect(result.state.board[0][0].rune).to.deep.equal({ owner: 'dark', flux: 1 });
	});

	it('rejects a wasteful overpay where a paid card buys no activation', () => {
		// Two value-2 Water cards on a 2-symbol Water cell = payment 4, but only 2
		// activations possible — the second card is pure waste, so it's illegal.
		const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
			Array.from({ length: 6 }, (_, col): BoardCell => ({
				position: { row, col },
				zoneId: '',
				glyphs: [] as Glyph[],
				rune: null,
				hasCrux: false,
			}))
		);
		board[0][0].glyphs = ['+', '+']; // 2-symbol target in the Water Zone

		const state: Game = {
			...INIT_GAME_STATE,
			id: 'wasteful',
			phase: 'main-turn',
			currentTurn: 'dark',
			options: { ...INIT_GAME_STATE.options, affinity: 'value' },
			board,
			zones: [
				{ id: 'z-comet', element: 'comet', topLeft: { row: 0, col: 0 }, width: 3, height: 3, cruxPosition: { row: 0, col: 2 }, control: 'unbound' },
				{ id: 'z-sun',  element: 'sun',  topLeft: { row: 0, col: 3 }, width: 3, height: 3, cruxPosition: { row: 0, col: 5 }, control: 'unbound' },
				{ id: 'z-moon', element: 'moon', topLeft: { row: 3, col: 0 }, width: 3, height: 3, cruxPosition: { row: 5, col: 2 }, control: 'unbound' },
				{ id: 'z-star',   element: 'star',   topLeft: { row: 3, col: 3 }, width: 3, height: 3, cruxPosition: { row: 5, col: 5 }, control: 'unbound' },
			],
			players: {
				light: { side: 'light', hand: [] },
				dark:  { side: 'dark',  hand: [{ id: 'w1', element: 'comet' }, { id: 'w2', element: 'comet' }] },
			},
		};

		const result = simulateGameCommand(
			state,
			clientGameCommand('InscribeRune', {
				player: 'dark',
				target: { row: 0, col: 0 },
				paidCardIds: ['w1', 'w2'],
			})
		);

		expect(result.ok).to.equal(false);
		expect(result.state.board[0][0].rune).to.equal(null);
	});
});
