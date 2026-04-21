import { inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, firstValueFrom, from, map, switchMap } from 'rxjs';
import { ProfileService } from '../../firebase/profile/profile.service';
import { AuthApiActions } from '../auth/auth.actions';
import { ProfileActions } from './profile.actions';
import { selectProfileData } from './profile.feature';

export const loginEffect = createEffect(
    (actions$ = inject(Actions)) =>
        actions$.pipe(
            ofType(AuthApiActions.authenticated),
            map(({ authenticatedUser }) =>
                ProfileActions.profileRequested({ profileID: authenticatedUser.uid })
            )
        ),
    { functional: true }
);

export const logoutEffect = createEffect(
    (actions$ = inject(Actions), store = inject(Store)) =>
        actions$.pipe(
            ofType(AuthApiActions.authenticationRevoked),
            switchMap(() => store.select(selectProfileData)),
            filter(profile => profile !== null),
            map(() => ProfileActions.profileCleared())
        ),
    { functional: true }
);

export const profileRequestedEffect = createEffect(
    (actions$ = inject(Actions), profileService = inject(ProfileService)) =>
        actions$.pipe(
            ofType(ProfileActions.profileRequested),
            switchMap(({ profileID }) =>
                from(
                    firstValueFrom(profileService.getProfile(profileID))
                        .then(profileData => ProfileActions.profileFetchCompleted({ profileData }))
                        .catch(error => ProfileActions.profileFetchFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const profileEffects = {
    loginEffect,
    logoutEffect,
    profileRequestedEffect,
};
