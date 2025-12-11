import { Rule } from '../../core/models/rules.interface';
import { GLOBAL_RULES } from './global.rules';
import { LEVEL_1_RULES } from './level1.rules';

export const ALL_GAME_RULES: ReadonlyArray<Rule> = [...GLOBAL_RULES, ...LEVEL_1_RULES];
