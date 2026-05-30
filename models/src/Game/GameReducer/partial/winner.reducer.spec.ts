import { expect } from 'chai';
import { gameReducer } from '../Game.reducer';
import { Game, INIT_GAME_STATE, BoardCell } from '../../Game';
import { TurnEnded } from '../../GameEvent/GameEvent';

function buildEmptyBoard(): BoardCell[][] {
	// A 6×6 board of empty non-crux cells, each with a single '+' glyph so
	// every cell has baseCost 1. Row/column helpers in GameSelectors assume
	// a 6×6 grid, so we keep the full shape even for a minimal scenario.
	return Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col): BoardCell => ({
			position: { row, col },
			zoneId: '',
			glyphs: ['+'],
			rune: null,
			hasCrux: false,
		}))
	);
}

function stuckState(overrides: Partial<Game> = {}): Game {
	return {
		...INIT_GAME_STATE,
		id: 'stuck',
		phase: 'main-turn',
		board: buildEmptyBoard(),
		// The four 3×3 elemental Zones every real game has. hasAnyLegalMove now
		// resolves each cell's Zone (for Affinity), so the state must be valid.
		zones: [
			{ id: 'z-fire',  element: 'fire',  topLeft: { row: 0, col: 0 }, cruxPosition: { row: 0, col: 0 }, control: 'unbound' },
			{ id: 'z-earth', element: 'earth', topLeft: { row: 0, col: 3 }, cruxPosition: { row: 0, col: 3 }, control: 'unbound' },
			{ id: 'z-air',   element: 'air',   topLeft: { row: 3, col: 0 }, cruxPosition: { row: 3, col: 0 }, control: 'unbound' },
			{ id: 'z-water', element: 'water', topLeft: { row: 3, col: 3 }, cruxPosition: { row: 3, col: 3 }, control: 'unbound' },
		],
		players: {
			light: { side: 'light', hand: [{ id: 'c-light', element: 'fire' }] },
			dark:  { side: 'dark',  hand: [] },
		},
		playerIds: { light: 'u-light', dark: 'u-dark' },
		currentTurn: 'light',
		deck: [],
		discard: [],
		display: [],
		pendingDraws: 0,
		pendingStartOfTurnDraws: 0,
		winner: null,
		winReason: null,
		...overrides,
	};
}

describe('winnerReducer — Turn Ended stuck state', () => {
	it('declares the side that just ended the winner when the incoming side has no legal moves', () => {
		// Light has a card; Dark has an empty hand, empty deck, empty display.
		// Every empty cell costs 1 → Dark cannot inscribe and cannot draw.
		const state = stuckState();

		const next = gameReducer(new TurnEnded({ player: 'light' }), state);

		expect(next.winner).to.equal('light');
		expect(next.winReason).to.equal('last-rune');
		expect(next.phase).to.equal('game-over');
	});

	it('does not end the game when the incoming side still has moves', () => {
		// Dark has a card — can inscribe any cost-1 cell.
		const state = stuckState({
			players: {
				light: { side: 'light', hand: [{ id: 'c-light', element: 'fire' }] },
				dark:  { side: 'dark',  hand: [{ id: 'c-dark',  element: 'fire' }] },
			},
		});

		const next = gameReducer(new TurnEnded({ player: 'light' }), state);

		expect(next.winner).to.equal(null);
		expect(next.winReason).to.equal(null);
		expect(next.phase).to.equal('main-turn');
		expect(next.currentTurn).to.equal('dark');
	});

	it('is a no-op on Turn Ended when the game is already over', () => {
		const state = stuckState({ winner: 'dark', winReason: 'fluxmate', phase: 'game-over' });

		const next = gameReducer(new TurnEnded({ player: 'light' }), state);

		expect(next.winner).to.equal('dark');
		expect(next.winReason).to.equal('fluxmate');
	});
});
