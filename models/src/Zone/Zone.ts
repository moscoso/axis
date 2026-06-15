import { Element } from '../Element/Element';
import { PlayerSide } from '../Player/Player';

export type CruxControl = PlayerSide | 'unbound';

export interface Position {
	row: number; // 0–5
	col: number; // 0–5
}

export interface Zone {
	id: string;
	element: Element;
	/**
	 * Rectangle bounds for the `'region'` board model only. Absent in the
	 * `'cross'` model, where a Zone is its Crux's row + column rather than a
	 * rectangle — membership is derived from {@link cruxPosition}.
	 */
	topLeft?: Position;
	/** Cells spanned horizontally (region model: 2×3 rectangles, either orientation). */
	width?: number;
	/** Cells spanned vertically (region model only). */
	height?: number;
	cruxPosition: Position;
	control: CruxControl;
}
