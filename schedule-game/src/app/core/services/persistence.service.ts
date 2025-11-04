import { inject, Injectable, effect } from '@angular/core';
import { ScheduleService } from './schedule.service';
import { FirestoreService } from './firestore.service';
import { GameStateDTO } from '../models/game_state.dto';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  private readonly scheduleService = inject(ScheduleService);
  private readonly firestoreService = inject(FirestoreService<GameStateDTO>);

  private readonly authService = inject(AuthService);

  constructor() {
    effect(async () => {
      const userId = this.authService.userId;
      if (!userId) {
        await this.authService.signInAnonymously();
        return;
      }

      const state = this.scheduleService.gameState();
      this.firestoreService.set(userId, state);
    });
  }
}
