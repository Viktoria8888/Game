import { Injectable, signal, computed } from '@angular/core';
import { SemesterHistory } from '../models/game_state.dto';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly history = signal<SemesterHistory[]>([]);

  readonly previouslyTakenCourseIds = computed(() => {
    const ids = new Set<string>();
    this.history().forEach((semester) => {
      semester.coursesTaken.forEach((id) => ids.add(id));
    });
    return ids;
  });

  readonly totalHistoricalEcts = computed(() =>
    this.history().reduce((sum, record) => sum + record.ectsEarned, 0)
  );

  readonly totalHistoricalScore = computed(() =>
    this.history().reduce((sum, record) => sum + record.scoreEarned, 0)
  );

  addRecord(record: SemesterHistory) {
    this.history.update((prev) => [...prev, record]);
  }

  setHistory(history: SemesterHistory[]) {
    this.history.set(history);
  }

  clear() {
    this.history.set([]);
  }
}
