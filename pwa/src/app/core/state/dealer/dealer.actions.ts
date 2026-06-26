import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Color, GameCommand, Game, Table, TableCommand } from 'axis-models';

export const DealerActions = createActionGroup({
    source: 'Dealer',
    events: {
        /** The player armed a die from the pool (by its color). */
        'Die Selected': props<{ color: Color }>(),
        /** The player cleared their armed die. */
        'Die Unselected': emptyProps(),
        'Delta Updated': props<{ game: Game; table: Table }>(),
        'Host Signaled': props<{ command: TableCommand }>(),
        'Player Signaled': props<{ command: GameCommand }>(),
        'Victory Screen Closed': emptyProps(),
    },
});
