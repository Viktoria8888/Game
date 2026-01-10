import { inject, Injectable, effect } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { GameStateDTO } from '../models/game_state.dto';
import { AuthService } from './auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, filter, distinctUntilChanged } from 'rxjs';
import { Unsubscribe } from 'firebase/auth';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  private readonly gameService = inject(GameService);
  private readonly firestoreService = inject(FirestoreService<GameStateDTO>);
  private readonly authService = inject(AuthService);

  private firestoreUnsub?: Unsubscribe;

  private isRestoring = false;
  private isInitialized = false;
  private readonly gameState$ = toObservable(this.gameService.gameStateSnapshot);
  constructor() {
    effect((onCleanup) => {
      if (!this.authService.isAuthLoaded()) return;

      const userId = this.authService.userId;

      if (!userId) {
        this.authService.signInAnonymously();
        return;
      }
      this.isInitialized = false;
      this.loadState(userId);

      this.subscribeToRemoteChanges(userId);

      const saveSubscription = this.gameState$
        .pipe(
          filter(() => this.isInitialized && !this.isRestoring),
          debounceTime(500),
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
        )
        .subscribe(async (state) => {
          if (this.authService.userId) {
            const cleanState = this.sanitize(state);
            await this.firestoreService.set(userId, cleanState);
          }
        });

      onCleanup(() => {
        saveSubscription.unsubscribe();
        this.firestoreUnsub?.();
      });
    });
  }

  async saveImmediately(): Promise<void> {
    const userId = this.authService.userId;
    const currentState = this.gameService.gameStateSnapshot();

    if (userId) {
      console.log('Force saving to Firestore (Instant)...');
      await this.firestoreService.set(userId, currentState);
    }
  }

  async getScorePercentile(score: number): Promise<number> {
    await this.saveImmediately();
    return this.firestoreService.getPercentile('score', score);
  }

  private async loadState(userId: string): Promise<void> {
    try {
      const savedState = await this.firestoreService.get(userId);
      if (savedState) {
        this.updateLocalState(savedState);
      }
    } finally {
      this.gameService.markAsInitialized();
      this.isInitialized = true;
    }
  }

  private subscribeToRemoteChanges(userId: string): void {
    this.firestoreUnsub?.();
    this.firestoreUnsub = this.firestoreService.subscribeToUser(userId, (state) => {
      if (state) {
        this.updateLocalState(state);
      }
    });
  }

  private updateLocalState(state: GameStateDTO) {
    this.isRestoring = true;

    this.gameService.restoreState(state);
    setTimeout(() => {
      this.isRestoring = false;
    }, 0);
  }
  private sanitize<T>(obj: T): T {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        return value === undefined ? null : value;
      })
    );
  }
}
