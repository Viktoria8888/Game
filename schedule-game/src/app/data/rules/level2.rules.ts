import { Rule } from '../../core/models/rules.interface';
import {
  countCoursesByType,
  createMaxEctsRule,
  createMinEctsRule,
  getPassedCourseIds,
  hasCourseWithTag,
} from './common';

const L2_MIN_ECTS = createMinEctsRule('l2-min', 20, 2, 'Mandatory');
const L2_MAX_ECTS = createMaxEctsRule('l2-max', 35, 2, 'Mandatory');

const L2_PREREQUISITES: Rule = {
  id: 'l2-prereqs',
  title: 'Prerequisites',
  description: 'You cannot take a course without passing its prerequisite first.',
  category: 'Mandatory',
  level: 2,
  priority: 100,
  validate: (context) => {
    const passedIds = getPassedCourseIds(context);
    const violations: string[] = [];

    context.coursesSelected.forEach((c) => {
      if (c.prerequisites) {
        const missing = c.prerequisites.filter((req) => !passedIds.has(req));
        if (missing.length > 0) {
          violations.push(`${c.name} (Missing: ${missing.join(', ')})`);
        }
      }
    });

    return {
      satisfied: violations.length === 0 && context.coursesSelected.length > 0,
      severity: 'error',
      message:
        violations.length === 0
          ? 'All prerequisites met.'
          : `Missing requirements: ${violations.join(', ')}`,
    };
  },
};

const L2_SYSTEM_PATH: Rule = {
  id: 'l2-goal-sys',
  title: 'Systems Path',
  description: 'Invest in "Operating Systems" (SO) now.',
  category: 'Goal',
  level: 2,
  scoreReward: 300,
  stressModifier: 5,
  validate: (ctx) => ({
    satisfied: hasCourseWithTag(ctx, 'OS'),
    message: hasCourseWithTag(ctx, 'OS')
      ? 'You have started the OS path.'
      : 'You are not choosing OS path for now',
  }),
};

const L2_AI_PLAN: Rule = {
  id: 'l2-goal-ai',
  title: 'Artificial Intelligence Path',
  description: 'Invest in "AI" now.',
  category: 'Goal',
  level: 2,
  scoreReward: 300,
  stressModifier: 5,
  validate: (ctx) => ({
    satisfied: hasCourseWithTag(ctx, 'AI'),
    severity: 'warning',
    message: hasCourseWithTag(ctx, 'AI')
      ? 'You have started the AI path.'
      : 'You are not choosing AI path for now',
  }),
};

const L2_HUMAN_GOAL: Rule = {
  id: 'l3-proj-req',
  title: 'Humanities subject',
  description: 'You must enroll in at least one humanities course.',
  category: 'Goal',
  level: 2,
  validate: (ctx) => ({
    satisfied: hasCourseWithTag(ctx, 'H'),
    severity: 'warning',
    message: 'No "Project" type course selected.',
  }),
};
export const LEVEL_2_RULES = [
  L2_MIN_ECTS,
  L2_MAX_ECTS,
  L2_PREREQUISITES,
  L2_SYSTEM_PATH,
  L2_HUMAN_GOAL,
  L2_AI_PLAN,
];
