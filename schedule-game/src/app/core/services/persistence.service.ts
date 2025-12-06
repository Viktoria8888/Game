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

  constructor() {
    effect((onCleanup) => {
      const userId = this.authService.userId;

      if (!userId) {
        this.authService.signInAnonymously();
        return;
      }

      this.loadState(userId);

      this.subscribeToRemoteChanges(userId);

      const saveSubscription = toObservable(this.gameService.gameStateSnapshot)
        .pipe(
          filter(() => !this.isRestoring),
          debounceTime(2000),
          distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
        )
        .subscribe(async (state) => {
          if (this.authService.userId) {
            console.log('Saving to Firestore...');
            await this.firestoreService.set(userId, state);
          }
        });

      onCleanup(() => {
        saveSubscription.unsubscribe();
        this.firestoreUnsub?.();
      });
    });
  }

  private async loadState(userId: string): Promise<void> {
    const savedState = await this.firestoreService.get(userId);
    if (savedState) {
      this.updateLocalState(savedState);
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
    }, 100);
  }
}
