import { Color } from '../Element/Element';

export interface Position {
	row: number; // 0–5
	col: number; // 0–5
}

/**
 * A {@link Crux} is a fixed colored marker that owns the row and column it sits
 * on. The six Cruxes occupy six distinct rows and six distinct columns (Crux
 * Exclusivity), so every row and every column has exactly one color. A Crux cell
 * cannot be inscribed; inscribing a cell of a Crux's color fires that Crux's
 * cross (its full row + column).
 */
export interface Crux {
	color: Color;
	position: Position;
}
