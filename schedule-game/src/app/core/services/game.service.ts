import { Injectable, inject, signal, computed } from '@angular/core';
import { ScheduleService } from './schedule.service';
import { HistoryService } from './history.service';
import { CourseSelectionService } from './courses';
import { GameStateDTO } from '../models/game_state.dto';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly schedule = inject(ScheduleService);
  private readonly history = inject(HistoryService);
  private readonly selection = inject(CourseSelectionService);

  readonly currentLevel = signal(1);

  readonly totalEcts = computed(
    () => this.history.totalHistoricalEcts() + this.schedule.simpleMetadata().currentSemesterEcts
  );

  readonly totalScore = computed(
    () => this.history.totalHistoricalScore() + this.schedule.simpleMetadata().score
  );

  readonly gameStateSnapshot = computed<GameStateDTO>(() => ({
    level: this.currentLevel(),
    history: this.history.history(),
    schedule: this.schedule.scheduleSlots(), 
  }));


  completeLevel() {
    const level = this.currentLevel();
    const currentMeta = this.schedule.simpleMetadata();
    const selectedCourses = this.selection.selectedCourses();

    this.history.addRecord({
      level: level,
      coursesTaken: selectedCourses.map((c) => c.id),
      ectsEarned: currentMeta.currentSemesterEcts, 
      scoreEarned: currentMeta.score,
    });


    this.currentLevel.update((l) => l + 1);

    this.selection.clearAll();
  }

  restoreState(state: GameStateDTO) {
    this.currentLevel.set(state.level);
    this.history.setHistory(state.history || []);
    this.schedule.setScheduleFromSlots(state.schedule);
  }
}
