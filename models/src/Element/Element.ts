/**
 * The six celestial colors. Each die, each Crux, and (via its row + column
 * Cruxes) every board cell carries a color. Color is the only axis that gates
 * which die may inscribe which cell — it is orthogonal to the Light/Dark side.
 */
export type Element = 'sun' | 'moon' | 'star' | 'comet' | 'planet' | 'spiral';

/** Reads as `Color` at call sites where the celestial-color role is what matters. */
export type Color = Element;

/** Canonical color order (board generation, dice pool, UI iteration). */
export const ELEMENTS: Element[] = ['sun', 'moon', 'star', 'comet', 'planet', 'spiral'];

/** Alias of {@link ELEMENTS} for color-centric call sites. */
export const COLORS = ELEMENTS;
