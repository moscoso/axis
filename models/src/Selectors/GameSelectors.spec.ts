import { expect } from 'chai';
import { isBoardFull } from './GameSelectors';
import { BoardCell, Game, INIT_GAME_STATE } from '../Game/Game';
import { PlayerSide } from '../Player/Player';

function buildBoard(layout: { hasCrux?: boolean; rune?: PlayerSide | null }[][]): BoardCell[][] {
	return layout.map((row, rowIndex) =>
		row.map((cell, colIndex): BoardCell => ({
			position: { row: rowIndex, col: colIndex },
			zoneId: '',
			glyphs: [],
			rune: cell.rune ? { owner: cell.rune, flux: 0 } : null,
			hasCrux: cell.hasCrux ?? false,
		}))
	);
}

function gameWith(board: BoardCell[][]): Game {
	return { ...INIT_GAME_STATE, board };
}

describe('isBoardFull', () => {
	it('is false for an entirely empty 6×6 board', () => {
		const empty = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => ({})));
		expect(isBoardFull(gameWith(buildBoard(empty)))).to.equal(false);
	});

	it('is true when every cell has a rune', () => {
		const all = Array.from({ length: 6 }, () =>
			Array.from({ length: 6 }, () => ({ rune: 'light' as PlayerSide }))
		);
		expect(isBoardFull(gameWith(buildBoard(all)))).to.equal(true);
	});

	it('treats Crux cells as filled even though they cannot be inscribed on', () => {
		// 4 cruxes in the corners, the remaining 32 cells all have runes.
		// Crux cells can never receive a rune (IS_CELL_EMPTY rejects them),
		// so a board where every inscribable cell is filled IS full.
		const board = Array.from({ length: 6 }, (_, r) =>
			Array.from({ length: 6 }, (_, c) => {
				const isCorner = (r === 0 || r === 5) && (c === 0 || c === 5);
				if (isCorner) return { hasCrux: true };
				return { rune: 'dark' as PlayerSide };
			})
		);
		expect(isBoardFull(gameWith(buildBoard(board)))).to.equal(true);
	});

	it('is false when an inscribable (non-crux) cell is still empty', () => {
		const board = Array.from({ length: 6 }, (_, r) =>
			Array.from({ length: 6 }, (_, c) => {
				if (r === 0 && c === 0) return { hasCrux: true };
				if (r === 5 && c === 5) return {}; // empty inscribable cell
				return { rune: 'light' as PlayerSide };
			})
		);
		expect(isBoardFull(gameWith(buildBoard(board)))).to.equal(false);
	});
});
