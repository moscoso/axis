import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { UserInfo } from 'firebase/auth';

export const AuthApiActions = createActionGroup({
    source: 'Firebase Auth API',
    events: {
        'Authenticated': props<{ authenticatedUser: UserInfo }>(),
        'Authentication Revoked': emptyProps(),
        'Authentication Failed': props<{ error: unknown }>(),
    },
});

export const AuthActions = createActionGroup({
    source: 'Auth Service',
    events: {
        'Login With Email Attempted': props<{ email: string; password: string }>(),
        'Login As Guest Attempted': emptyProps(),
        'Login With Facebook Attempted': emptyProps(),
        'Login With Google Attempted': emptyProps(),
        'Login Completed': emptyProps(),
        'Login Failed': props<{ error: unknown }>(),
        'Signup Requested': props<{ email: string; password: string }>(),
        'Signup Completed': emptyProps(),
        'Signup Failed': props<{ error: unknown }>(),
        'Logout Requested': emptyProps(),
        'Password Reset Requested': props<{ email: string }>(),
        'Password Reset Completed': emptyProps(),
        'Password Reset Failed': props<{ error: unknown }>(),
    },
});
