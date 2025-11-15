import { ScheduleSlot } from './course.interface';

export interface SimpleGameMetadata {
  totalEctsAccumulated: number;
  ectsByTag: Record<string, number>;
  ectsByType: Record<string, number>;
  hasExamCount: number;
  uniqueCoursesCount: number;

  hasIndividualProject: boolean;
  hasTeamProject: boolean;
  projectCount: number;

  proseminarCount: number;
  languageECTS: number;
  hasB2English: boolean;

  specializationTags: {
    RPiS: number;
    IO: number;
    PiPO: number;
    ASK: number;
    SO: number;
    SK: number;
    BD: number;
  };

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

  //Achivements
  currentStreak: number;
  bestStreak: number;
  achievementsUnlocked: string[];
}

export type GameStateMetadata = SimpleGameMetadata & ComplexGameMetadata;
export interface GameStateDTO {
  currentSemester: number;
  schedule: ScheduleSlot[];
}
