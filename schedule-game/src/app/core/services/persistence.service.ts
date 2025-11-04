import { inject, Injectable, effect } from '@angular/core';
import { ScheduleService } from './schedule.service';
import { FirestoreService } from './firestore.service';
import { GameStateDTO } from '../models/game_state.dto';

@Injectable({
  providedIn: 'root',
})
export class PersistenceService {
  private readonly scheduleService = inject(ScheduleService);
  private readonly firestoreService = inject(FirestoreService<GameStateDTO>);

  //TODO("replace with real auth")
  private readonly userId = 'user-123';
  constructor() {
    effect(() => {
      const state = this.scheduleService.gameState();
      this.firestoreService.set(this.userId, state);
    });
  }
  //TODO("add subscription to the user")
}
