import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import { createMaxEctsRule, createMinEctsRule, free_friday, no_gaps } from './common';

export const L1_RECCOMENDED: Rule = {
  id: 'first_year_recommended',
  title: 'Recommended Subjects',
  description: 'Select all subjects recommended for the first year.',
  category: 'Goal',
  level: 1,
  scoreReward: 200,
  stressModifier: -5,

  validate: (context: ValidationContext) => {
    const selectedIds = new Set(context.coursesSelected.map((c) => c.id));

    const missingCourses = COURSES.filter(
      (course) => course.isFirstYearRecommended && !selectedIds.has(course.id)
    );

    const isSatisfied = missingCourses.length === 0;

    return {
      satisfied: isSatisfied,
      severity: isSatisfied ? 'warning' : 'error',
      message: isSatisfied
        ? 'Great! All recommended subjects are selected.'
        : `Missing: ${missingCourses.map((c) => c.name).join(', ')}`,
    };
  },
};
const FREE_FRIDAY = free_friday(1, 'Goal', 200, -10);
const NO_GAPS = no_gaps(300, 20);
const L2_MIN_ECTS = createMinEctsRule('l2-min', 18, 1, 'Mandatory');
const L2_MAX_ECTS = createMaxEctsRule('l2-max', 35, 1, 'Mandatory');
export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  L1_RECCOMENDED,
  L2_MAX_ECTS,
  L2_MIN_ECTS,
  FREE_FRIDAY,
  NO_GAPS,
];
