import { createFeature, createReducer, on } from '@ngrx/store';
import { ProfileActions } from './profile.actions';
import { INIT_PROFILE_STATE, ProfileState } from './profile.state';

export const profileFeature = createFeature({
    name: 'profile',
    reducer: createReducer<ProfileState>(
        INIT_PROFILE_STATE,
        on(ProfileActions.profileRequested, state => ({
            ...state,
            fetchInProgress: true,
            error: null,
        })),
        on(ProfileActions.profileFetchCompleted, (state, { profileData }) => ({
            ...state,
            fetchInProgress: false,
            profileData,
        })),
        on(ProfileActions.profileFetchFailed, (state, { error }) => ({
            ...state,
            fetchInProgress: false,
            error,
        })),
        on(ProfileActions.profileCleared, state => ({
            ...state,
            profileData: null,
        }))
    ),
});

export const {
    name: profileFeatureKey,
    reducer: profileReducer,
    selectProfileState,
    selectProfileData,
    selectFetchInProgress,
} = profileFeature;
