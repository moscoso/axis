/**
 * The six glyph faces shared by every die. A glyph is stamped onto a cell when a
 * die is inscribed, and fires when a chain reaches it.
 *
 * - `+` Pulse        — inscriber scores 1 per orthogonally-adjacent friendly stone.
 * - `X` Cross        — inscriber scores 1 per diagonally-adjacent friendly stone.
 * - `▲` Drift        — pushes the Rift 1 toward the inscriber.
 * - `↔` Row Repeater — triggers its two row neighbors (cascades through Repeaters).
 * - `↕` Col Repeater — triggers its two column neighbors (cascades through Repeaters).
 * - `■` Block        — stops opponent-initiated chains in its direction.
 */
export type Glyph = '+' | 'X' | '▲' | '↔' | '↕' | '■';

/** Every glyph face, in canonical order (die faces, UI iteration). */
export const GLYPHS: Glyph[] = ['+', 'X', '▲', '↔', '↕', '■'];

export type RepeaterGlyph = '↔' | '↕';

export function isRepeater(g: Glyph): g is RepeaterGlyph {
	return g === '↔' || g === '↕';
}
