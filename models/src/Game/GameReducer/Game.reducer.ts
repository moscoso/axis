import { combineReducers, deepCopy } from '@moscoso/models';
import { GameEvent } from '../GameEvent/GameEvent';
import { Game } from '../Game';
import { boardReducer }     from './partial/board.reducer';
import { diceReducer }      from './partial/dice.reducer';
import { phaseReducer }     from './partial/phase.reducer';
import { playerIdsReducer } from './partial/playerIds.reducer';
import { riftReducer }      from './partial/rift.reducer';
import { scoreReducer }     from './partial/score.reducer';
import { turnReducer }      from './partial/turn.reducer';
import { winnerReducer }    from './partial/winner.reducer';

/**
 * The main game state reducer. Reducers are applied sequentially — order matters:
 * board (place stone) → score/rift (apply chain deltas) → winner (read fresh
 * score + rift to check victory) must run in that order. turn flips last so the
 * winner check sees the acting side.
 */
export function gameReducer(event: GameEvent, state: Game): Game {
	const game: Game = deepCopy(state);
	return combineReducers(game, event, [
		playerIdsReducer,
		phaseReducer,
		boardReducer,
		scoreReducer,
		diceReducer,
		riftReducer,
		winnerReducer,
		turnReducer,
	]);
}
