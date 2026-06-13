import { expect } from 'chai';
import { boardReducer } from './board.reducer';
import { Game, INIT_GAME_STATE, BoardCell } from '../../Game';
import { RuneInscribed } from '../../GameEvent/GameEvent';
import { Glyph } from '../../../Glyph/Glyph';

function emptyBoard(): BoardCell[][] {
	return Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col): BoardCell => ({
			position: { row, col },
			zoneId: '',
			glyphs: [],
			rune: null,
			hasCrux: false,
		}))
	);
}

function gameWith(board: BoardCell[][]): Game {
	return { ...INIT_GAME_STATE, board };
}

describe('boardReducer — Rune Inscribed shift activations', () => {
	it("places the rune with flux = base charge + number of '+' activations", () => {
		const state = gameWith(emptyBoard());
		const event = new RuneInscribed({
			player: 'light',
			position: { row: 2, col: 2 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [],
			activations: ['+', '+'] as Glyph[],
		});

		const next = boardReducer(event, state);

		// Default base charge is 0, so two `+` activations land flux 2.
		expect(next.board[2][2].rune).to.deep.equal({ owner: 'light', flux: 2 });
	});

	it('honors a base charge of 0 (classic Null Rune semantics)', () => {
		const state: Game = {
			...gameWith(emptyBoard()),
			options: { ...INIT_GAME_STATE.options, baseRuneCharge: 0 },
		};
		const event = new RuneInscribed({
			player: 'light',
			position: { row: 2, col: 2 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [],
			activations: [] as Glyph[],
		});

		const next = boardReducer(event, state);

		expect(next.board[2][2].rune).to.deep.equal({ owner: 'light', flux: 0 });
	});

	it("slides the target row/column when shift glyphs are activated, carrying the just-placed rune", () => {
		const state: Game = {
			...gameWith(emptyBoard()),
			options: { ...INIT_GAME_STATE.options, shiftGlyphs: true },
		};
		const event = new RuneInscribed({
			player: 'dark',
			position: { row: 4, col: 1 },
			rune: { owner: 'dark', flux: 0 },
			paidCards: [],
			activations: ['→'] as Glyph[],
		});

		const next = boardReducer(event, state);

		// Rune was placed at (4,1), then a → shift slid row 4 right by 1.
		expect(next.board[4][1].rune).to.equal(null);
		expect(next.board[4][2].rune?.owner).to.equal('dark');
	});

	it('applies multiple shift activations in order', () => {
		const board = emptyBoard();
		// Mark a Crux at (3,3) so we can trace its motion.
		board[3][3].hasCrux = true;
		const state: Game = {
			...gameWith(board),
			options: { ...INIT_GAME_STATE.options, shiftGlyphs: true },
		};

		const event = new RuneInscribed({
			player: 'light',
			position: { row: 3, col: 0 },
			rune: { owner: 'light', flux: 0 },
			paidCards: [],
			// Inscribe at (3,0); two ← shifts on row 3 → Crux moves from col 3 to col 1.
			activations: ['←', '←'] as Glyph[],
		});

		const next = boardReducer(event, state);

		expect(next.board[3][1].hasCrux).to.equal(true);
		expect(next.board[3][3].hasCrux).to.equal(false);
	});

	it('does not slide the board when options.shiftGlyphs is off', () => {
		const state: Game = {
			...gameWith(emptyBoard()),
			options: { ...INIT_GAME_STATE.options, shiftGlyphs: false },
		};
		const event = new RuneInscribed({
			player: 'dark',
			position: { row: 4, col: 1 },
			rune: { owner: 'dark', flux: 0 },
			paidCards: [],
			activations: ['→'] as Glyph[],
		});

		const next = boardReducer(event, state);

		// Rune stays put; no row slide occurs.
		expect(next.board[4][1].rune?.owner).to.equal('dark');
		expect(next.board[4][2].rune).to.equal(null);
	});
});
