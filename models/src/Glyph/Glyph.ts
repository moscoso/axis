export type Glyph = '+' | '▲' | '◇' | '↑' | '→' | '↓' | '←';

export type ShiftGlyph = '↑' | '→' | '↓' | '←';

export const SHIFT_GLYPHS: ShiftGlyph[] = ['↑', '→', '↓', '←'];

export function isShiftGlyph(g: Glyph): g is ShiftGlyph {
	return g === '↑' || g === '→' || g === '↓' || g === '←';
}
