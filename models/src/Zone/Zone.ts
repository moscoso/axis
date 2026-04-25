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
	topLeft: Position;
	cruxPosition: Position;
	control: CruxControl;
}
