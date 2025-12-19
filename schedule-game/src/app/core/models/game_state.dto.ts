import { Course, ScheduleSlot } from './course.interface';

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

export interface ComplexGameMetadata {
  totalContactHours: number;
  totalGapTime: number;
  maxGapInAnyDay: number;
  
  averageStartTime: number;
  morningToAfternoonRatio: number;

  freeDaysCount: number;
  achievementsUnlocked: string[]; // ['Early Bird', 'Speedrunner'...]
}

export interface SemesterHistory {
  level: number;
  coursesTaken: string[];
  ectsEarned: number;
  scoreEarned: number;
  stressLevel: number;
}
export type GameStateMetadata = SimpleGameMetadata & ComplexGameMetadata;

export interface GameStateDTO {
  level: number;
  score: number;
  stressLevel: number;
  coursesSelected: Course[];
  history: SemesterHistory[];
}
