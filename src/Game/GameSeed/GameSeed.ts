import { UserID } from '@moscoso/models';
import { Card } from '../../Card/Card';
import { BoardCell } from '../Game';
import { Zone } from '../../Zone/Zone';

/**
 * A {@link GameSeed} captures everything needed to reproduce the exact starting
 * state of an AXIS game — board layout, deck order, side assignment, and the
 * moment the game was created. Each game begins from a unique seed.
 */
export interface GameSeed {
	board:       BoardCell[][];
	zones:       Zone[];
	/** Remaining draw pile after the display is dealt (index 0 = top). */
	deck:        Card[];
	/** The four face-up cards available at the start of the draft. */
	display:     Card[];
	lightPlayer: UserID;
	darkPlayer:  UserID;
	createdAt:   number;
}
