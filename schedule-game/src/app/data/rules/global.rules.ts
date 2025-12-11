import { Rule } from '../../core/models/rules.interface';
import { createMinEctsRule } from './common';

export const MIN_ECTS_RULE = createMinEctsRule('global-min-ects', 18, null);
export const GLOBAL_RULES: ReadonlyArray<Rule> = [MIN_ECTS_RULE];
