import { Course } from './course.interface';

export interface SimpleGameMetadata {
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
  freeDaysCount: number;
  // Willpower System
  willpowerCost: number;
  costBreakdown: string[];
}

export interface SemesterHistory {
  level: number;
  coursesTaken: string[];
  ectsEarned: number;
  scoreEarned: number;
  willpowerCost: number;
}

export type GameStateMetadata = SimpleGameMetadata & ComplexGameMetadata;

export interface GameStateDTO {
  level: number;
  score: number;
  coursesSelected: Course[];
  history: SemesterHistory[];
}
