import { Rule } from '../../core/models/rules.interface';
import { GLOBAL_RULES } from './shared.rules';
import { LEVEL_1_RULES } from './level1.rules';
import { LEVEL_2_RULES } from './level2.rules';
import { LEVEL_3_RULES } from './level3.rules';
import { LEVEL_4_RULES } from './level4.rules';
import { LEVEL_5_RULES } from './level5.rules';
import { LEVEL_6_RULES } from './level6.rules';

export const ALL_GAME_RULES: ReadonlyArray<Rule> = [
  ...GLOBAL_RULES,
  ...LEVEL_1_RULES,
  ...LEVEL_2_RULES,
  ...LEVEL_3_RULES,
  ...LEVEL_4_RULES,
  ...LEVEL_5_RULES,
  ...LEVEL_6_RULES,
];
