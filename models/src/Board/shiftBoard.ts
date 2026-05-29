import { ShiftGlyph } from '../Glyph/Glyph';
import { BoardCell } from '../Game/Game';
import { Position } from '../Zone/Zone';

const BOARD_SIZE = 6;

/**
 * Slides the row (← →) or column (↑ ↓) containing `anchor` by one step in the
 * arrow's direction, with edge wraparound. The full cell payload — glyphs,
 * rune, and Crux flag — travels together; `position` and `zoneId` stay fixed
 * to grid coordinates.
 */
export function shiftBoard(
	board: BoardCell[][],
	dir: ShiftGlyph,
	anchor: Position
): BoardCell[][] {
	const next = board.map(row => row.map(cell => ({ ...cell, glyphs: [...cell.glyphs] })));

	if (dir === '↑' || dir === '↓') {
		const col = anchor.col;
		const stack = next.map(row => row[col]);
		const rotated = dir === '↑'
			? [...stack.slice(1), stack[0]]
			: [stack[BOARD_SIZE - 1], ...stack.slice(0, BOARD_SIZE - 1)];
		for (let r = 0; r < BOARD_SIZE; r++) {
			next[r][col] = adopt(next[r][col], rotated[r]);
		}
	} else {
		const row = anchor.row;
		const line = next[row];
		const rotated = dir === '←'
			? [...line.slice(1), line[0]]
			: [line[BOARD_SIZE - 1], ...line.slice(0, BOARD_SIZE - 1)];
		for (let c = 0; c < BOARD_SIZE; c++) {
			next[row][c] = adopt(next[row][c], rotated[c]);
		}
	}

	return next;
}

function adopt(host: BoardCell, content: BoardCell): BoardCell {
	return {
		position: host.position,
		zoneId: host.zoneId,
		glyphs: content.glyphs,
		rune: content.rune,
		hasCrux: content.hasCrux,
	};
}
