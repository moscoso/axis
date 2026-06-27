/**
 * The five glyph faces. A glyph is stamped onto a cell when a die is inscribed,
 * and fires when its Crux's cross chains through it.
 *
 * - `+` Pulse        — inscriber scores 1 per orthogonally-adjacent friendly stone.
 * - `X` Cross        — inscriber scores 1 per diagonally-adjacent friendly stone.
 * - `▲` Drift        — pushes the Rift 1 toward the inscriber.
 * - `↔` Row Repeater — triggers its two row neighbors (cascades through Repeaters).
 * - `↕` Col Repeater — triggers its two column neighbors (cascades through Repeaters).
 */
export type Glyph = '+' | 'X' | '▲' | '↔' | '↕';

/** Every glyph type, in canonical order (UI iteration). */
export const GLYPHS: Glyph[] = ['+', 'X', '▲', '↔', '↕'];

export type RepeaterGlyph = '↔' | '↕';

export function isRepeater(g: Glyph): g is RepeaterGlyph {
	return g === '↔' || g === '↕';
}
