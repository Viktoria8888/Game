import { ScheduleSlot } from './course.interface';

export interface SimpleGameMetadata {
  stressLevel: number;
  score: number;
  currentSemesterEcts: number;
  ectsByTag: Record<string, number>;
  ectsByType: Record<string, number>;
  hasExamCount: number;
  uniqueCoursesCount: number;
  proseminarCount: number;
  mandatoryCoursesCompleted: string[];
}

/** Metadata that requires full recalculation (O(n)) */
export interface ComplexGameMetadata {
  // Time-dependent (need to scan all slots)
  totalContactHours: number;
  averageStartTime: number;
  averageEndTime: number;
  morningToAfternoonRatio: number;

  maxGapInAnyDay: number;
  totalGapTime: number;

  freeDaysCount: number;
  consecutiveFreeDays: number;

  currentStreak: number;
  bestStreak: number;
  achievementsUnlocked: string[];
}

export interface SemesterHistory {
  level: number;
  coursesTaken: string[];
  ectsEarned: number;
  scoreEarned: number;
}
export type GameStateMetadata = SimpleGameMetadata & ComplexGameMetadata;

export interface GameStateDTO {
  level: number;
  schedule: ScheduleSlot[];
  history: SemesterHistory[];
}
