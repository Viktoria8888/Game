import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import {
  createMinEctsRule,
  createNoGapsRule,
  createStandardLoadRule,
  createTagBanRule,
  createMaxDailyHoursRule,
  mandatorySubjectForLevel,
  createMinNameLengthRule,
} from './common';

export const RECOMMENDED: Rule = {
  id: 'l1-recommended',
  title: 'Recommended Subjects',
  description: 'Select all subjects recommended for the first year.',
  category: 'Goal',
  priority: 20,
  level: 1,
  scoreReward: 300,
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

export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  mandatorySubjectForLevel({ id: 'l1-mandatory', level: 1, scoreReward: 100 }, ['4141', '4108']),
  createMinEctsRule({ id: 'l1-min', level: 1, category: 'Mandatory' }, 20),
  createNoGapsRule(
    {
      id: 'l1-no-gaps',
      level: 1,
      category: 'Goal',
      scoreReward: 200,
      messages: ['', 'No gaps >3h allowed.'],
    },
    3
  ),
  createTagBanRule({ id: 'l1-no-advanced', level: 1, category: 'Mandatory' }, 'ADVANCED'),
  createStandardLoadRule({ id: 'l1-standard', level: 1, scoreReward: 200 }, 25),
  createMaxDailyHoursRule(
    {
      id: 'l1-daily',
      level: 1,
      category: 'Goal',
      scoreReward: 150,
      messages: ['Healthy work-life balance.', 'Warning: You have a day with >6 hours of classes!'],
    },
    6
  ),
  createMinNameLengthRule({ id: 'l1-names', level: 1, category: 'Goal', scoreReward: 150 }, 10),
  RECOMMENDED,
];
