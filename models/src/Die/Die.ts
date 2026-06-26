import { Color } from '../Element/Element';
import { Glyph } from '../Glyph/Glyph';

/**
 * One of the six pool dice. A die's {@link Color} is fixed for the whole game;
 * its {@link Glyph} `face` is what gets inscribed and changes on every reroll.
 * Dice are never consumed — picking a die means picking its color, and the
 * inscribed glyph is whatever face it currently shows.
 */
export interface Die {
	color: Color;
	face: Glyph;
}
