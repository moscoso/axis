import { inject, Injectable } from '@angular/core';
import {
    Auth,
    authState,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInAnonymously,
    signInWithEmailAndPassword,
    signOut,
    User,
    UserCredential,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

/** Service responsible for user authentication with Firebase. */
@Injectable({ providedIn: 'root' })
export class FireAuthService {
    private readonly firebaseAuth = inject(Auth);

    /** Observable of the currently signed-in user (or null). */
    getAuthState(): Observable<User | null> {
        return authState(this.firebaseAuth);
    }

    createUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        return createUserWithEmailAndPassword(this.firebaseAuth, email, password);
    }

    signInWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
        return signInWithEmailAndPassword(this.firebaseAuth, email, password);
    }

    signInAsGuest(): Promise<UserCredential> {
        return signInAnonymously(this.firebaseAuth);
    }

    sendPasswordResetEmail(email: string): Promise<void> {
        return sendPasswordResetEmail(this.firebaseAuth, email);
    }

    signOut(): Promise<void> {
        return signOut(this.firebaseAuth);
    }
}
