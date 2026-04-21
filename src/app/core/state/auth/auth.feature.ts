import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions, AuthApiActions } from './auth.actions';
import { AuthModel, INIT_AUTH_MODEL } from './auth.model';

export const authFeature = createFeature({
    name: 'auth',
    reducer: createReducer<AuthModel>(
        INIT_AUTH_MODEL,
        on(AuthApiActions.authenticated, (state, { authenticatedUser }) => ({
            ...state,
            userID: authenticatedUser.uid,
            userInfo: authenticatedUser,
            isAuthenticated: true,
            isInProgress: false,
            error: null,
        })),
        on(AuthApiActions.authenticationRevoked, state => ({
            ...state,
            userID: undefined,
            userInfo: undefined,
            isAuthenticated: false,
            isInProgress: false,
        })),
        on(
            AuthActions.loginWithEmailAttempted,
            AuthActions.loginAsGuestAttempted,
            AuthActions.loginWithFacebookAttempted,
            AuthActions.loginWithGoogleAttempted,
            AuthActions.signupRequested,
            AuthActions.passwordResetRequested,
            state => ({ ...state, error: null, isInProgress: true })
        ),
        on(
            AuthActions.loginCompleted,
            AuthActions.signupCompleted,
            AuthActions.passwordResetCompleted,
            state => ({ ...state, error: null, isInProgress: false })
        ),
        on(AuthActions.logoutRequested, state => ({ ...state, isInProgress: true })),
        on(
            AuthActions.loginFailed,
            AuthActions.signupFailed,
            AuthActions.passwordResetFailed,
            AuthApiActions.authenticationFailed,
            (state, { error }) => ({
                ...state,
                isInProgress: false,
                isAuthenticated: false,
                error,
            })
        )
    ),
});

export const {
    name: authFeatureKey,
    reducer: authReducer,
    selectAuthState,
    selectUserID,
    selectUserInfo,
    selectIsAuthenticated,
    selectIsInProgress,
    selectError,
} = authFeature;
