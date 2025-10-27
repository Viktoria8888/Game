import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

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
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
