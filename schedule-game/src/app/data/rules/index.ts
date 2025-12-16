import { Rule } from '../../core/models/rules.interface';
import { GLOBAL_RULES } from './shared.rules';
import { LEVEL_1_RULES } from './level1.rules';
import { LEVEL_2_RULES } from './level2.rules';

export const ALL_GAME_RULES: ReadonlyArray<Rule> = [
  ...GLOBAL_RULES,
  ...LEVEL_1_RULES,
  ...LEVEL_2_RULES,
];
