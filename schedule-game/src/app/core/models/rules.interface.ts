import { Course, ScheduleSlot } from './course.interface';
import { GameStateDTO, GameStateMetadata } from './game_state.dto';

export type ValidationFunction = (context: ValidationContext) => ValidationResult;

/**Immutable snapshot of the current game state */
export type ValidationContext = Omit<GameStateDTO, 'coursesSelected' | 'stressLevel' | 'score'> & {
  readonly schedule: ReadonlyArray<ScheduleSlot>;
  readonly coursesSelected: ReadonlyArray<Course>;
  metadata: GameStateMetadata;
};

export interface ValidationDetails {
  currentVal?: number;
  requiredVal?: number;
}

export interface ValidationResult {
  satisfied: boolean;
  severity?: 'error' | 'warning';
  message?: string;
  details?: ValidationDetails;
}

/**
 * Metadata for the Bot/AutoSolver.
 */
export type SolverHint =
  | { type: 'REQUIRED_SUBJECTS'; value: string[] }
  | { type: 'MIN_ECTS'; value: number }
  | { type: 'MIN_TOTAL_ECTS'; value: number }
  | { type: 'TAG_REQUIREMENT'; value: string }
  | { type: 'TAG_SPECIALIST'; value: { tag: string; minEcts: number } }
  | { type: 'TAG_DIVERSITY'; value: number }
  | { type: 'TAG_SYNERGY'; value: { primary: string; required: string } }
  | { type: 'BAN_TAG'; value: string }
  | { type: 'NO_GAPS'; value: number }
  | { type: 'MAX_CONTACT_HOURS'; value: number }
  | { type: 'NAME_LENGTH'; value: number }
  | { type: 'VOWEL_COUNT'; value: number }
  | { type: 'ODD_HOURS'; value: boolean }
  | { type: 'BAN_TIME_SLOTS'; value: number[] }
  | { type: 'MIN_START_HOUR'; value: number }
  | { type: 'MAX_DAILY_HOURS'; value: number }
  | { type: 'MUTUALLY_EXCLUSIVE_TAGS'; value: [string, string] }
  | { type: 'BAN_DAYS'; value: string[] }
  | { type: 'FORCE_PRIME_ECTS'; value: boolean }
  | { type: 'FORCE_PALINDROME_HOURS'; value: boolean }
  | { type: 'MIN_FREE_DAYS'; value: number };

export interface Rule {
  id: string;
  title: string;
  description: string;
  category: 'Mandatory' | 'Goal';
  scoreReward?: number;
  stressModifier?: number;
  level: number | null; // null means that the rule is applied to any level
  priority: number;
  controlledBy?: string[];
  overrides?: string[];
  validate: ValidationFunction;
  isActive?: (context: ValidationContext) => boolean;
  solverHint?: SolverHint;
}

export interface RuleExecution {
  rule: Rule;
  result: ValidationResult;
}
export interface ValidationResultMap {
  satisfied: Array<RuleExecution>;
  violated: Array<RuleExecution>;
}
