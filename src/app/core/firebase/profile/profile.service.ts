import { inject, Injectable } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { AuthFacade } from '../../state/auth/auth.facade';
import { ProfileData } from '../../state/profile/profile.state';

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private readonly firestore = inject(Firestore);
    private readonly authStore = inject(AuthFacade);

    private readonly myUserID$: Observable<string> = this.authStore
        .selectState()
        .pipe(map(auth => auth.userID ?? 'unknown'));

    getUserProfile(): Observable<ProfileData> {
        return this.myUserID$.pipe(
            filter((id): id is string => typeof id === 'string' && id.length > 0),
            switchMap(id => this.getProfile(id))
        );
    }

    getMyUserID(): Observable<string> {
        return this.myUserID$;
    }

    getProfile(id: string): Observable<ProfileData> {
        const ref = doc(this.firestore, `users/${id}`);
        return docData(ref, { idField: 'uid' }) as Observable<ProfileData>;
    }
}
