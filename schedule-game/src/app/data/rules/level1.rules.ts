import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import {
  createMaxEctsRule,
  createMinEctsRule,
  free_friday,
  mandatorySubjectForLevel,
  no_gaps,
} from './common';

export const L1_RECOMMENDED: Rule = {
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

const L1_NO_GAPS = no_gaps(300, 20);
const L1_MIN_ECTS = createMinEctsRule('l1-min', 18, 1, 'Mandatory');
const L1_MAX_ECTS = createMaxEctsRule('l1-max', 35, 1, 'Mandatory');
const L1_MANDATORY_COURSES = mandatorySubjectForLevel('l1-mandatory', 1, 'Mandatory', [
  '1003',
  '1001',
]);
export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  L1_MANDATORY_COURSES,
  L1_RECOMMENDED,
  L1_MAX_ECTS,
  L1_MIN_ECTS,
  L1_NO_GAPS,
];
