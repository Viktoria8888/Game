import { Injectable, inject, signal, computed } from '@angular/core';
import { HistoryService } from './history.service';
import { CourseSelectionService } from './courses-selection';
import { GameStateDTO } from '../models/game_state.dto';
import { ScheduleService } from './schedule.service';
import { PersistenceService } from './persistence.service';

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly schedule = inject(ScheduleService);
  readonly history = inject(HistoryService);

  readonly currentLevel = signal(0);

  readonly isInitialized = signal(false);

  readonly totalEcts = computed(
    () => this.history.totalHistoricalEcts() + this.schedule.simpleMetadata().currentSemesterEcts
  );

  readonly totalScore = computed(
    () => this.history.totalHistoricalScore() + this.schedule.simpleMetadata().score
  );

  readonly gameStateSnapshot = computed<GameStateDTO>(() => ({
    level: this.currentLevel(),
    history: this.history.history(),
    coursesSelected: this.courseSelection.selectedCourses(),
  }));

  markAsInitialized() {
    this.isInitialized.set(true);
  }

  completeLevel() {
    const level = this.currentLevel();
    const currentMeta = this.schedule.simpleMetadata();
    const selectedCourses = this.courseSelection.selectedCourses();

    this.history.addRecord({
      level: level,
      coursesTaken: selectedCourses.map((c) => c.id),
      ectsEarned: currentMeta.currentSemesterEcts,
      scoreEarned: currentMeta.score,
    });

    this.currentLevel.update((l) => l + 1);

    this.courseSelection.clearAll();
    console.log(this.history.history());
  }

  restoreState(state: GameStateDTO) {
    this.currentLevel.set(state.level);
    this.history.setHistory(state.history || []);
    this.courseSelection.setSelectedCourses(state.coursesSelected);
  }
}
