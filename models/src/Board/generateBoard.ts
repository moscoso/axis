import { Color, COLORS } from '../Element/Element';
import { BoardCell, Game } from '../Game/Game';
import { shuffle } from '../Utility/shuffle';
import { Crux } from '../Zone/Zone';

const SIZE = 6;

/**
 * Generates a randomised 6×6 board and its six Cruxes for a new AXIS game.
 *
 * Crux placement obeys **Crux Exclusivity**: the six colors are dealt onto six
 * distinct rows and six distinct columns (a random row-permutation × a random
 * column-permutation), so every row and every column has exactly one Crux and
 * therefore exactly one color. Each non-Crux cell takes two colors — its row
 * color and its column color — which are always distinct (equal colors would
 * mean the cell is itself a Crux).
 */
export function generateBoard(): Pick<Game, 'board' | 'cruxes'> {
	// Color i sits at (rowPerm[i], colPerm[i]) — distinct rows and columns.
	const rowPerm = shuffle(Array.from({ length: SIZE }, (_, i) => i));
	const colPerm = shuffle(Array.from({ length: SIZE }, (_, i) => i));

	const cruxes: Crux[] = COLORS.map((color, i) => ({
		color,
		position: { row: rowPerm[i], col: colPerm[i] },
	}));

	// Which color owns each row / column.
	const rowColor: Color[] = new Array(SIZE);
	const colColor: Color[] = new Array(SIZE);
	for (const crux of cruxes) {
		rowColor[crux.position.row] = crux.color;
		colColor[crux.position.col] = crux.color;
	}

	const board: BoardCell[][] = Array.from({ length: SIZE }, (_, row) =>
		Array.from({ length: SIZE }, (_, col) => {
			const hasCrux = rowColor[row] === colColor[col];
			return {
				position: { row, col },
				rowColor: rowColor[row],
				colColor: colColor[col],
				stone: null,
				hasCrux,
				cruxColor: hasCrux ? rowColor[row] : null,
			};
		})
	);

	return { board, cruxes };
}
