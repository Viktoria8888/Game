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

export interface Rule {
  id: string;
  title: string;
  description: string;
  category: 'Mandatory' | 'Goal';
  scoreReward?: number;
  stressModifier?: number;
  level: number | null; // null means that the rule is applied to any level
  priority?: number;
  controlledBy?: string[];
  overrides?: string[];
  validate: ValidationFunction;
  isActive?: (context: ValidationContext) => boolean;
}

export interface RuleExecution {
  rule: Rule;
  result: ValidationResult;
}
export interface ValidationResultMap {
  satisfied: Array<RuleExecution>;
  violated: Array<RuleExecution>;
}
