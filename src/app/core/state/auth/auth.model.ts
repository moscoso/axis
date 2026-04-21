import { UserInfo } from 'firebase/auth';

export interface AuthModel {
    /** The ID that uniquely identifies the authenticated user */
    userID: string | undefined;
    /** Standard User profile information from Firebase authentication */
    userInfo: UserInfo | undefined;
    /** Whether a user is currently authenticated */
    isAuthenticated: boolean;
    /** Whether an auth operation is currently in progress */
    isInProgress: boolean;
    /** The error that caused the most recent auth operation to fail */
    error: unknown;
}

export const INIT_AUTH_MODEL: AuthModel = {
    userID: undefined,
    userInfo: undefined,
    isAuthenticated: false,
    isInProgress: false,
    error: null,
};
