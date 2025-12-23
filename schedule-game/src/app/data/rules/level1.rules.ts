import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import {
  createMinEctsRule,
  createStandardLoadRule,
  createTagBanRule,
  mandatorySubjectForLevel,
  noGaps,
} from './common';

export const RECOMMENDED: Rule = {
  id: 'l1-recommended',
  title: 'Recommended Subjects',
  description: 'Select all subjects recommended for the first year.',
  category: 'Goal',
  priority: 20,
  level: 1,
  scoreReward: 250,
  stressModifier: -5,
  validate: (ctx: ValidationContext) => {
    const userSubjectIds = new Set(ctx.coursesSelected.map((c) => c.subjectId));
    const recommendedIds = new Set(
      COURSES.filter((c) => c.isFirstYearRecommended).map((c) => c.subjectId)
    );
    const missing = [...recommendedIds].filter((id) => !userSubjectIds.has(id));
    const isSatisfied = missing.length === 0;

    return {
      satisfied: isSatisfied,
      severity: isSatisfied ? 'warning' : 'error',
      message: isSatisfied
        ? 'Great! All recommended subjects selected.'
        : `Missing recommended subjects (Analysis, Logic...).`,
    };
  },
};

const EXAM_LIMIT: Rule = {
  id: 'l1-exams',
  title: 'Exam Anxiety',
  description: 'Max 3 courses with Final Exams allowed.',
  category: 'Goal',
  priority: 30,
  level: 1,
  stressModifier: -15,
  scoreReward: 200,
  validate: (ctx) => {
    const count = ctx.coursesSelected.filter((c) => c.hasExam).length;
    return {
      satisfied: count <= 3 && ctx.coursesSelected.length > 0,
      message: count <= 3 ? 'Anxiety managed.' : `Too many exams (${count}/3)!`,
    };
  },
};
const NO_ADVANCED = createTagBanRule('l1-no-advanced', 'ADVANCED', 1, 'Mandatory');
const STANDARD_LOAD = createStandardLoadRule('l1-standard', 1, 22);

export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  mandatorySubjectForLevel('l1-mandatory', 1, ['4141', '4108'], 100),
  createMinEctsRule('l1-min', 16, 1, 'Mandatory'),
  noGaps('Lost Freshman', 'No gaps >2h allowed.', 'Goal', 150, -5, 2, 1),
  RECOMMENDED,
  EXAM_LIMIT,
  NO_ADVANCED,
  STANDARD_LOAD,
];
