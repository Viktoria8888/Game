import { Rule } from '../../core/models/rules.interface';
import {
  countCoursesByType,
  createMinEctsRule,
  free_friday,
  mandatorySubjectForLevel,
} from './common';

const L3_MIN_ECTS = createMinEctsRule('l3-min', 22, 3, 'Mandatory');

const L3_PROJECT_GOAL: Rule = {
  id: 'l3-proj-req',
  title: 'Project Practice',
  description: 'You must enroll in at least one "Project" type course.',
  category: 'Goal',
  level: 3,
  validate: (ctx) => ({
    satisfied: countCoursesByType(ctx, 'Project') >= 1,
    severity: 'error',
    message: 'No "Project" type course selected.',
  }),
};

const L3_LATE_RISER: Rule = {
  id: 'l3-goal-sleep',
  title: 'Late Riser',
  description: 'Avoid classes before 10:00 AM.',
  category: 'Goal',
  level: 3,
  scoreReward: 150,
  stressModifier: -10,
  validate: (ctx) => {
    const earlyClasses = ctx.schedule.filter((s) => s.startTime < 10);
    return {
      satisfied: earlyClasses.length === 0 && ctx.schedule.length > 0,
      message:
        earlyClasses.length === 0 ? 'Schedule fits your sleep cycle.' : 'You have morning classes.',
    };
  },
};
const L3_FREE_FRIDAY = free_friday(3, 'Goal', 200, -10);
const L3_MANDATORY = mandatorySubjectForLevel('mandatory3', 3, 'Mandatory', []);
export const LEVEL_3_RULES = [
  L3_MIN_ECTS,
  L3_PROJECT_GOAL,
  L3_LATE_RISER,
  L3_FREE_FRIDAY,
  L3_MANDATORY,
];
