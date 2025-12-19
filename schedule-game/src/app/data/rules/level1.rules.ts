import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import { createMaxEctsRule, createMinEctsRule, mandatorySubjectForLevel, no_gaps } from './common';

export const RECOMMENDED: Rule = {
  id: 'first_year_recommended',
  title: 'Recommended Subjects',
  description: 'Select all subjects recommended for the first year.',
  category: 'Goal',
  level: 1,
  scoreReward: 200,
  stressModifier: -10,

  validate: (context: ValidationContext) => {
    const selectedIds = new Set(context.coursesSelected.map((c) => c.id));

    const missingCourses = COURSES.filter(
      (course) => course.isFirstYearRecommended && !selectedIds.has(course.id)
    );

    const isSatisfied = missingCourses.length === 0;

    return {
      satisfied: isSatisfied && selectedIds.size > 0,
      severity: isSatisfied ? 'warning' : 'error',
      message: isSatisfied
        ? 'Great! All recommended subjects are selected.'
        : `Missing: ${missingCourses.map((c) => c.name).join(', ')}`,
    };
  },
};

const NO_GAPS = no_gaps(300, 20, 2);
const MIN_ECTS = createMinEctsRule('l1-min', 18, 1, 'Mandatory');
const MAX_ECTS = createMaxEctsRule('l1-max', 35, 1, 'Mandatory');
const MANDATORY_COURSES = mandatorySubjectForLevel('l1-mandatory', 1, ['4141', '4108']);

export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  MANDATORY_COURSES,
  RECOMMENDED,
  MAX_ECTS,
  MIN_ECTS,
  NO_GAPS,
];
