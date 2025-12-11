import { Rule } from '../../core/models/rules.interface';
import { createMaxEctsRule, createMinEctsRule } from './common';

export const R1 = createMaxEctsRule('r2', 35, 1);
export const LEVEL_1_RULES: ReadonlyArray<Rule> = [R1];
