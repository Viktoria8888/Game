import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth, connectAuthEmulator } from '@angular/fire/auth'; // <--- 2. Import emulator connector
import { getFirestore, provideFirestore, connectFirestoreEmulator } from '@angular/fire/firestore'; // <--- 3. Import emulator connector
import { COLLECTION_NAME } from './core/services/firestore.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
        projectId: 'schedule-game-d17d5',
        appId: '1:810073978867:web:570e855740e90eed5a0486',
        storageBucket: 'schedule-game-d17d5.firebasestorage.app',
        apiKey: 'AIzaSyAmwP1PdwnsPV_bvGFUKn1djZcXnZHaN-Q',
        authDomain: 'schedule-game-d17d5.firebaseapp.com',
        messagingSenderId: '810073978867',
        measurementId: 'G-QZGSLLZFZB',
      })
    ),

    provideAuth(() => {
      const auth = getAuth();
      if (isDevMode()) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }
      return auth;
    }),

    provideFirestore(() => {
      const firestore = getFirestore();
      if (isDevMode()) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      return firestore;
    }),

    { provide: COLLECTION_NAME, useValue: 'users' },
  ],
};
