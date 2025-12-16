import { Rule } from '../../core/models/rules.interface';
import { countCoursesByType, createMinEctsRule, mandatorySubjectForLevel } from './common';

const MIN_ECTS = createMinEctsRule('l5-min', 23, 5, 'Mandatory');
const SEMINAR: Rule = {
  id: 'l6-seminar',
  title: 'Proseminar',
  description: 'You must choose a Proseminar or Seminar.',
  category: 'Mandatory',
  level: 4,
  validate: (ctx) => ({
    satisfied:
      countCoursesByType(ctx, 'Seminar') > 0 || ctx.coursesSelected.some((c) => c.isProseminar),
    severity: 'error',
    message: 'No Seminar in the schedule.',
  }),
};
const BALANCED_LIFE: Rule = {
  id: 'goal-balance',
  title: 'Work-Life Balance',
  description: 'Maximum 6 hours of classes per day.',
  category: 'Goal',
  level: 4,
  scoreReward: 200,
  stressModifier: -15,
  validate: (ctx) => {
    const hoursPerDay: Record<string, number> = {};
    ctx.schedule.forEach((slot) => {
      hoursPerDay[slot.day] = (hoursPerDay[slot.day] || 0) + 1;
    });
    const overloaded = Object.values(hoursPerDay).some((h) => h > 6);
    return {
      satisfied: !overloaded,
      message: !overloaded ? 'Schedule is balanced.' : 'You have days with over 6h of classes.',
    };
  },
};
const MANDATORY = mandatorySubjectForLevel('mandatory4', 4, 'Mandatory', []);
export const LEVEL_4_RULES = [MIN_ECTS, SEMINAR, BALANCED_LIFE, MANDATORY];
