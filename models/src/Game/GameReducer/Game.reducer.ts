import { combineReducers, deepCopy } from '@moscoso/models';
import { GameEvent } from '../GameEvent/GameEvent';
import { Game } from '../Game';
import { boardReducer }        from './partial/board.reducer';
import { deckReducer }         from './partial/deck.reducer';
import { discardReducer }      from './partial/discard.reducer';
import { displayReducer }      from './partial/display.reducer';
import { handReducer }         from './partial/hand.reducer';
import { pendingDrawsReducer } from './partial/pendingDraws.reducer';
import { phaseReducer }        from './partial/phase.reducer';
import { playerIdsReducer }    from './partial/playerIds.reducer';
import { riftReducer }         from './partial/rift.reducer';
import { spellsReducer }       from './partial/spells.reducer';
import { turnReducer }         from './partial/turn.reducer';
import { winnerReducer }       from './partial/winner.reducer';
import { zonesReducer }        from './partial/zones.reducer';

/**
 * The main game state reducer. Reducers are applied sequentially — order matters:
 * board → rift → zones → winner must run in that order so each step
 * sees the freshest state when checking victory conditions.
 */
export function gameReducer(event: GameEvent, state: Game): Game {
	const game: Game = deepCopy(state);
	return combineReducers(game, event, [
		playerIdsReducer,
		handReducer,
		discardReducer,
		deckReducer,
		displayReducer,
		spellsReducer,
		pendingDrawsReducer,
		phaseReducer,
		boardReducer,
		riftReducer,
		zonesReducer,
		winnerReducer,
		turnReducer
	]);
}
