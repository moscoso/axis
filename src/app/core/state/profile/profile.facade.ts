import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { firstValueFrom, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ProfileActions } from './profile.actions';
import { selectProfileData, selectProfileState } from './profile.feature';
import { ProfileData, ProfileState } from './profile.state';

@Injectable({ providedIn: 'root' })
export class ProfileFacade {
    private readonly store = inject(Store);

    getProfileState(): Observable<ProfileState> {
        return this.store.select(selectProfileState);
    }

    selectUserProfile(): Observable<ProfileData | null> {
        return this.store.select(selectProfileData);
    }

    getMyID(): Promise<string> {
        return firstValueFrom(
            this.getProfileState().pipe(
                map(profileState => profileState.profileData?.uid ?? ''),
                filter(uid => uid.length > 0)
            )
        );
    }

    fetchProfile(userID: string): void {
        this.store.dispatch(ProfileActions.profileRequested({ profileID: userID }));
    }

    clearProfile(): void {
        this.store.dispatch(ProfileActions.profileCleared());
    }
}
