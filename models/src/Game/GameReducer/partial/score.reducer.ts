import { GameEvent } from '../../GameEvent/GameEvent';
import { Game } from '../../Game';

export function scoreReducer(event: GameEvent, state: Game): Game {
	switch (event.type) {
		case 'Game Started':
			return { ...state, score: { light: 0, dark: 0 } };

		case 'Glyph Inscribed': {
			const { scoreDelta } = event.payload;
			return {
				...state,
				score: {
					light: state.score.light + scoreDelta.light,
					dark:  state.score.dark  + scoreDelta.dark,
				},
			};
		}

		default:
			return state;
	}
}
