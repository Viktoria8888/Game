import { ScheduleSlot } from './course.interface';
import { GameStateDTO, GameStateMetadata } from './game_state.dto';

export type ValidationFunction = (context: ValidationContext) => ValidationResult;

/**Immutable snapshot of the current game state */
export type ValidationContext = Omit<GameStateDTO, 'schedule'> & {
  readonly schedule: ReadonlyArray<ScheduleSlot>;
  readonly level: number | null;
  metadata: GameStateMetadata;
};

export interface ValidationDetails {
  currentVal?: number;
  requiredVal?: number;
}

export interface ValidationResult {
  satisfied: boolean;
  severity?: 'error' | 'warning';
  message: string;
  details?: ValidationDetails;
}

export interface Rule {
  id: string;
  description: string;
  category: 'Cumulative' | 'Goal' | 'Additional';
  level: number | null; // null means that the rule is applied to any level
  priority: number;
  controlledBy?: string[];
  overrides?: string[];
  validate: ValidationFunction;
  isActive?: (context: ValidationContext) => boolean;
}

export interface ValidationResultMap {
  satisfied: Array<Rule>;
  violated: Array<Rule>;
}
