import { createSelector } from '@ngrx/store';
import { PlayerSide, PlayerState } from 'axis-models';
import { selectUserID } from '../auth/auth.feature';
import { selectDealerState } from './dealer.feature';

/** Select a player by their side ('light' | 'dark'). */
export const selectPlayer = (side: PlayerSide) =>
    createSelector(selectDealerState, state => state.game.players[side]);

/** Select the seat (if any) whose user matches the authenticated user. */
export const selectUserSeat = createSelector(selectDealerState, selectUserID, (state, userID) =>
    state.table.seats.find(seat => seat !== null && seat.user.id === userID) ?? null
);

/**
 * Select the authenticated user as a {@link PlayerState}.
 * Returns `undefined` if the user is not seated or has not chosen a side yet.
 */
export const selectUserAsPlayer = createSelector(
    selectDealerState,
    selectUserSeat,
    (state, seat): PlayerState | undefined => {
        const side = seat?.sidePreference;
        if (side !== 'light' && side !== 'dark') {
            return undefined;
        }
        return state.game.players[side];
    }
);

/** Whether the authenticated user currently occupies a seat at the table. */
export const selectUserIsSeated = createSelector(
    selectUserSeat,
    seat => seat !== null
);
