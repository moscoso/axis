export interface ProfileState {
    profileData: ProfileData | null;
    fetchInProgress: boolean;
    error: unknown;
}

export const INIT_PROFILE_STATE: ProfileState = {
    profileData: null,
    fetchInProgress: false,
    error: null,
};

export interface ProfileData {
    currentGameID: string;
    uid: string;
    email: string;
    displayName: string;
    shortID: string;
    photoURL: string;
    lastResponseTime: Date;
    lastNameChange: unknown;
}
