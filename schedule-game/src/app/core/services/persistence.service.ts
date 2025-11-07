import { inject, Injectable, effect } from '@angular/core';
import { ScheduleService } from './schedule.service';
import { FirestoreService } from './firestore.service';
import { GameStateDTO } from '../models/game_state.dto';
import { AuthService } from './auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import { Unsubscribe } from 'firebase/auth';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  private readonly scheduleService = inject(ScheduleService);
  private readonly firestoreService = inject(FirestoreService<GameStateDTO>);
  private readonly authService = inject(AuthService);
  private unsubscribe?: Unsubscribe;
  constructor() {
    effect(async () => {
      const userId = this.authService.userId;
      if (!userId) {
        await this.authService.signInAnonymously();
        return;
      }

      // load the saved state from the firestore
      await this.loadState(userId);

      // multi-device sync
      this.subscribeToRemoteChanges(userId);

      toObservable(this.scheduleService.gameState)
        .pipe(debounceTime(2000))
        .subscribe(async (state) => {
          if (this.authService.userId) {
            this.firestoreService.set(userId, state);
          }
        });
    });
  }
  private async loadState(userId: string): Promise<void> {
    const savedState = await this.firestoreService.get(userId);
    if (savedState) {
      this.scheduleService.setState(savedState);
    }
  }

  private subscribeToRemoteChanges(userId: string): void {
    this.unsubscribe?.(); // clean up the previous

    this.unsubscribe = this.firestoreService.subscribeToUser(userId, (state: GameStateDTO) => {
      if (state) {
        this.scheduleService.setState(state);
      }
    });
  }
}
