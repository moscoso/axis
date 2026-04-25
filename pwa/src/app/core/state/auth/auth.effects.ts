import { inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { filter, from, map, switchMap, tap } from 'rxjs';
import { FireAuthService } from '../../firebase/auth/FireAuth.service';
import { ToastService } from '../../../shared/toast/toast.service';
import { AuthActions, AuthApiActions } from './auth.actions';

export const loggedInEffect = createEffect(
    (actions$ = inject(Actions), router = inject(Router), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.loginCompleted),
            tap(() => {
                toaster.dismiss();
                router.navigateByUrl('/game');
            })
        ),
    { functional: true, dispatch: false }
);

export const signedUpEffect = createEffect(
    (actions$ = inject(Actions), router = inject(Router), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.signupCompleted),
            tap(() => {
                toaster.dismiss();
                toaster.success('Sign up completed!');
                router.navigateByUrl('/create-profile');
            })
        ),
    { functional: true, dispatch: false }
);

export const loginFailedEffect = createEffect(
    (actions$ = inject(Actions), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.loginFailed),
            tap(({ error }) => toaster.failed('Login Failed', (error as Error)?.message))
        ),
    { functional: true, dispatch: false }
);

export const signupFailedEffect = createEffect(
    (actions$ = inject(Actions), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.signupFailed),
            tap(({ error }) => toaster.failed('Sign Up Failed', (error as Error)?.message))
        ),
    { functional: true, dispatch: false }
);

export const resetPasswordFailedEffect = createEffect(
    (actions$ = inject(Actions), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.passwordResetFailed),
            tap(({ error }) => toaster.failed('Password Reset Failed', (error as Error)?.message))
        ),
    { functional: true, dispatch: false }
);

export const passwordResetCompletedEffect = createEffect(
    (actions$ = inject(Actions), router = inject(Router), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthActions.passwordResetCompleted),
            tap(() => {
                toaster.success('Password Reset Successfully');
                router.navigateByUrl('/login');
            })
        ),
    { functional: true, dispatch: false }
);

export const authenticationFailedEffect = createEffect(
    (actions$ = inject(Actions), toaster = inject(ToastService)) =>
        actions$.pipe(
            ofType(AuthApiActions.authenticationFailed),
            tap(({ error }) => toaster.failed('Something went wrong', (error as Error)?.message))
        ),
    { functional: true, dispatch: false }
);

export const loginWithEmailAndPasswordEffect = createEffect(
    (actions$ = inject(Actions), auth = inject(FireAuthService)) =>
        actions$.pipe(
            ofType(AuthActions.loginWithEmailAttempted),
            switchMap(({ email, password }) =>
                from(
                    auth
                        .signInWithEmailAndPassword(email, password)
                        .then(() => AuthActions.loginCompleted())
                        .catch(error => AuthActions.loginFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const loginAsGuestEffect = createEffect(
    (actions$ = inject(Actions), auth = inject(FireAuthService)) =>
        actions$.pipe(
            ofType(AuthActions.loginAsGuestAttempted),
            switchMap(() =>
                from(
                    auth
                        .signInAsGuest()
                        .then(() => AuthActions.loginCompleted())
                        .catch(error => AuthActions.loginFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const logoutByRouteEffect = createEffect(
    (router = inject(Router)) =>
        router.events.pipe(
            filter((event): event is NavigationEnd => event instanceof NavigationEnd),
            filter(event => event.urlAfterRedirects === '/logout'),
            map(() => AuthActions.logoutRequested())
        ),
    { functional: true }
);

export const logoutEffect = createEffect(
    (actions$ = inject(Actions), auth = inject(FireAuthService), router = inject(Router)) =>
        actions$.pipe(
            ofType(AuthActions.logoutRequested),
            tap(() => router.navigateByUrl('/')),
            switchMap(() =>
                from(
                    auth
                        .signOut()
                        .then(() => AuthApiActions.authenticationRevoked())
                        .catch(error => AuthApiActions.authenticationFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const resetPasswordEffect = createEffect(
    (actions$ = inject(Actions), auth = inject(FireAuthService)) =>
        actions$.pipe(
            ofType(AuthActions.passwordResetRequested),
            switchMap(({ email }) =>
                from(
                    auth
                        .sendPasswordResetEmail(email)
                        .then(() => AuthActions.passwordResetCompleted())
                        .catch(error => AuthActions.passwordResetFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const signupEffect = createEffect(
    (actions$ = inject(Actions), auth = inject(FireAuthService)) =>
        actions$.pipe(
            ofType(AuthActions.signupRequested),
            switchMap(({ email, password }) =>
                from(
                    auth
                        .createUserWithEmailAndPassword(email, password)
                        .then(() => AuthActions.signupCompleted())
                        .catch(error => AuthActions.signupFailed({ error }))
                )
            )
        ),
    { functional: true }
);

export const authEffects = {
    loggedInEffect,
    signedUpEffect,
    loginFailedEffect,
    signupFailedEffect,
    resetPasswordFailedEffect,
    passwordResetCompletedEffect,
    authenticationFailedEffect,
    loginWithEmailAndPasswordEffect,
    loginAsGuestEffect,
    logoutByRouteEffect,
    logoutEffect,
    resetPasswordEffect,
    signupEffect,
};
