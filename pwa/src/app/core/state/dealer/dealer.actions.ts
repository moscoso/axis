import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Card, GameCommand, Game, Table, TableCommand } from 'axis-models';

export const DealerActions = createActionGroup({
    source: 'Dealer',
    events: {
        'Ability Initiated': props<{ card: Card }>(),
        'Ability Canceled': emptyProps(),
        'Cancel Declare': emptyProps(),
        'Card Focused': props<{ card: Card }>(),
        'Card Unfocused': emptyProps(),
        'Delta Updated': props<{ game: Game; table: Table }>(),
        'Host Signaled': props<{ command: TableCommand }>(),
        'Player Signaled': props<{ command: GameCommand }>(),
        'Select Attacker': props<{ card: Card }>(),
        'Unselect Attacker': props<{ card: Card }>(),
        'Victory Screen Closed': emptyProps(),
    },
});
