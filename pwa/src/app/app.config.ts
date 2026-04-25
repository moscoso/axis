import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideDatabase, getDatabase } from '@angular/fire/database';

import { provideStore, provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { firebase } from '../config/firebase';
import { authFeature } from './core/state/auth/auth.feature';
import { authEffects } from './core/state/auth/auth.effects';
import { profileFeature } from './core/state/profile/profile.feature';
import { profileEffects } from './core/state/profile/profile.effects';
import { dealerFeature } from './core/state/dealer/dealer.feature';
import { dealerEffects } from './core/state/dealer/dealer.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideDatabase(() => getDatabase()),
    provideStore(),
    provideState(authFeature),
    provideState(profileFeature),
    provideState(dealerFeature),
    provideEffects(authEffects, profileEffects, dealerEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode(), name: 'AXIS - PWA' })
  ]
};
