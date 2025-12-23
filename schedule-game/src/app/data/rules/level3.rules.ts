import { Rule } from '../../core/models/rules.interface';
import {
  createCumulativeProgressRule,
  createMinEctsRule,
  createStandardLoadRule,
  createTagDiversityRule,
  createTagSpecialistRule,
  createVowelCountRule,
  hasCourseWithTag,
} from './common';

const DEPT_RIVALRY: Rule = {
  id: 'l3-rivalry',
  title: 'Department Rivalry',
  description: 'Do not mix AI and OS courses (Civil War!).',
  category: 'Mandatory',
  level: 3,
  priority: 130,
  validate: (ctx) => {
    const hasAI = hasCourseWithTag(ctx, 'AI');
    const hasOS = hasCourseWithTag(ctx, 'OS');
    const conflict = hasAI && hasOS;
    return {
      satisfied: !conflict,
      severity: 'error',
      message: conflict ? 'Conflict! Pick either AI or OS.' : 'Loyalty preserved.',
    };
  },
};

const NO_FRIDAY: Rule = {
  id: 'l3-weekend',
  title: 'Long Weekend',
  description: 'Keep Friday completely free.',
  category: 'Goal',
  level: 3,
  priority: 55,
  scoreReward: 600,
  stressModifier: -25,
  validate: (ctx) => {
    const friday = ctx.schedule.filter((s) => s.day === 'Fri').length;
    return {
      satisfied: friday === 0,
      message: friday === 0 ? '3-day weekend secured! 🎉' : 'Friday is not free.',
    };
  },
};

const TAG_EXPLORER = createTagDiversityRule('l3-explorer', 4, 3, 'Goal');
const TOOLS = createTagSpecialistRule('l3-tools', 'TOOLS', 8, 3);
const VOWEL_HARMONY = createVowelCountRule('l3-vowel', 3, 3);
const PROGRESS_CHECK_1 = createCumulativeProgressRule('l3-progress', 66, 3);
const STANDARD_LOAD = createStandardLoadRule('l3-standard', 3, 22);
export const LEVEL_3_RULES = [
  createMinEctsRule('l3-min', 22, 3, 'Mandatory'),
  DEPT_RIVALRY,
  NO_FRIDAY,
  TAG_EXPLORER,
  VOWEL_HARMONY,
  TOOLS,
  STANDARD_LOAD,
  PROGRESS_CHECK_1,
];
