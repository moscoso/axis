import { Element } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';
import { BoardCell, Game } from '../Game/Game';
import { shuffle } from '../Utility/shuffle';
import { Zone } from '../Zone/Zone';

const ELEMENTS: Element[] = ['fire', 'earth', 'air', 'water'];
const GLYPHS: Glyph[] = ['+', '▲', '◇'];
const GLYPH_ORDER: Record<Glyph, number> = { '+': 0, '▲': 1, '◇': 2 };

const QUADRANTS = [
	{ id: 'TL', topLeft: { row: 0, col: 0 } },
	{ id: 'TR', topLeft: { row: 0, col: 3 } },
	{ id: 'BL', topLeft: { row: 3, col: 0 } },
	{ id: 'BR', topLeft: { row: 3, col: 3 } },
] as const;

function randomGlyph(): Glyph {
	return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

function placeCruxes(): { TL: { row: number; col: number }; TR: { row: number; col: number }; BL: { row: number; col: number }; BR: { row: number; col: number } } {
	const [tlRow, trRow] = shuffle([0, 1, 2]);
	const [blRow, brRow] = shuffle([3, 4, 5]);
	const [tlCol, blCol] = shuffle([0, 1, 2]);
	const [trCol, brCol] = shuffle([3, 4, 5]);

	return {
		TL: { row: tlRow, col: tlCol },
		TR: { row: trRow, col: trCol },
		BL: { row: blRow, col: blCol },
		BR: { row: brRow, col: brCol },
	};
}

/**
 * Generates a randomised 6×6 board and 4 zones for a new AXIS game.
 * - Elements are randomly assigned to quadrants.
 * - Cruxes are placed obeying row/column exclusivity across all 4 quadrants.
 * - Each zone's 8 non-crux cells receive costs 1–8 exactly once (shuffled).
 * - Glyphs are randomly assigned with equal 33% weight per type.
 */
export function generateBoard(): Pick<Game, 'board' | 'zones'> {
	const elements = shuffle(ELEMENTS);
	const cruxes = placeCruxes();
	const cruxKeys = ['TL', 'TR', 'BL', 'BR'] as const;

	// Build empty 6×6 grid
	const board: BoardCell[][] = Array.from({ length: 6 }, (_, row) =>
		Array.from({ length: 6 }, (_, col) => ({
			position: { row, col },
			zoneId: '',
			glyphs: [] as Glyph[],
			rune: null,
			hasCrux: false,
		}))
	);

	const zones: Zone[] = QUADRANTS.map(({ id, topLeft }, i) => {
		const key = cruxKeys[i];
		const cruxPosition = cruxes[key];
		const element = elements[i];

		// Each zone's 8 non-crux cells get costs 1–8 exactly once, shuffled
		const costs = shuffle([1, 2, 3, 4, 5, 6, 7, 8]);
		let costIndex = 0;

		for (let r = topLeft.row; r < topLeft.row + 3; r++) {
			for (let c = topLeft.col; c < topLeft.col + 3; c++) {
				const isCrux = r === cruxPosition.row && c === cruxPosition.col;
				board[r][c].zoneId = id;
				board[r][c].hasCrux = isCrux;
				board[r][c].glyphs = isCrux
					? []
					: Array.from({ length: costs[costIndex++] }, randomGlyph)
						.sort((a, b) => GLYPH_ORDER[a] - GLYPH_ORDER[b]);
			}
		}

		return {
			id,
			element,
			topLeft,
			cruxPosition,
			control: 'unbound',
		};
	});

	return { board, zones };
}
