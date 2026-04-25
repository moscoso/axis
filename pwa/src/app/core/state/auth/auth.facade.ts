import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { User, UserInfo } from 'firebase/auth';
import { firstValueFrom, Observable } from 'rxjs';
import { distinctUntilChanged, first, map } from 'rxjs/operators';
import { FireAuthService } from '../../firebase/auth/FireAuth.service';
import { AuthActions, AuthApiActions } from './auth.actions';
import {
    selectAuthState,
    selectIsAuthenticated,
    selectUserID,
    selectUserInfo,
} from './auth.feature';
import { AuthModel } from './auth.model';

/**
 * Facade over the auth feature {@link Store}.
 * Dispatches auth actions and selects auth state.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
    private readonly store = inject(Store);
    private readonly fireAuth = inject(FireAuthService);
    private readonly destroyRef = inject(DestroyRef);

    constructor() {
        this.fireAuth
            .getAuthState()
            .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe(authenticatedUser => {
                if (authenticatedUser) {
                    const userInfo = this.scrapeUserInfo(authenticatedUser);
                    this.store.dispatch(AuthApiActions.authenticated({ authenticatedUser: userInfo }));
                } else {
                    this.store.dispatch(AuthApiActions.authenticationRevoked());
                }
            });
    }

    login(email: string, password: string): void {
        this.store.dispatch(AuthActions.loginWithEmailAttempted({ email, password }));
    }

    signup(email: string, password: string): void {
        this.store.dispatch(AuthActions.signupRequested({ email, password }));
    }

    resetPassword(email: string): void {
        this.store.dispatch(AuthActions.passwordResetRequested({ email }));
    }

    logout(): void {
        this.store.dispatch(AuthActions.logoutRequested());
    }

    loginAsGuest(): void {
        this.store.dispatch(AuthActions.loginAsGuestAttempted());
    }

    loginWithFacebook(): void {
        this.store.dispatch(AuthActions.loginWithFacebookAttempted());
    }

    loginWithGoogle(): void {
        this.store.dispatch(AuthActions.loginWithGoogleAttempted());
    }

    async getUserID(): Promise<string> {
        const info = await firstValueFrom(this.selectUserInfo());
        return info?.uid ?? 'unknown';
    }

    selectUserInfo(): Observable<UserInfo | undefined> {
        return this.store.select(selectUserInfo);
    }

    isAuthenticated(): Promise<boolean> {
        return firstValueFrom(this.selectAuthenticated().pipe(first()));
    }

    selectAuthenticated(): Observable<boolean> {
        return this.store.select(selectIsAuthenticated);
    }

    selectState(): Observable<AuthModel> {
        return this.store.select(selectAuthState);
    }

    selectUserID(): Observable<string> {
        return this.store.select(selectUserID).pipe(map(id => id ?? 'unknown'));
    }

    private scrapeUserInfo(authenticatedUser: User): UserInfo {
        return {
            displayName: authenticatedUser.displayName,
            email: authenticatedUser.email,
            phoneNumber: authenticatedUser.phoneNumber,
            providerId: authenticatedUser.providerId,
            uid: authenticatedUser.uid,
            photoURL: authenticatedUser.photoURL,
        };
    }
}
