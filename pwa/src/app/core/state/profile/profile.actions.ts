import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ProfileData } from './profile.state';

export const ProfileActions = createActionGroup({
    source: 'Profile',
    events: {
        'Profile Requested': props<{ profileID: string }>(),
        'Profile Fetch Completed': props<{ profileData: ProfileData }>(),
        'Profile Fetch Failed': props<{ error: unknown }>(),
        'Profile Cleared': emptyProps(),
    },
});
