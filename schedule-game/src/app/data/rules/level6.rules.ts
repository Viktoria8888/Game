import { Rule } from '../../core/models/rules.interface';
import {
  createMaxContactHoursRule,
  createMinEctsRule,
  createOddStartTimesRule,
  createStandardLoadRule,
} from './common';

const INTERNSHIP: Rule = {
  id: 'l6-intern',
  title: 'Internship',
  description: 'Keep 3 full days completely free.',
  category: 'Mandatory',
  level: 6,
  priority: 100,
  validate: (ctx) => {
    const free = ctx.metadata.freeDaysCount;
    return {
      satisfied: free >= 2,
      message: `Free days: ${free}/3.`,
    };
  },
};

const GHOST_MODE = createMaxContactHoursRule('l6-ghost', 15, 6, 'Mandatory', 0, -30);

const ODD_HOURS = createOddStartTimesRule('l6-odd', 6, 1500, 10);
const AFTERNOON_ONLY: Rule = {
  id: 'l6-afternoon',
  title: 'Afternoon Warrior',
  description: 'ALL classes between 14:00-18:00 only.',
  category: 'Goal',
  level: 6,
  priority: 45,
  scoreReward: 2000,
  stressModifier: -15,
  validate: (ctx) => {
    const valid = ctx.schedule.every((s) => s.startTime >= 14 && s.startTime < 18);
    return {
      satisfied: valid && ctx.schedule.length > 0,
      message: valid ? 'Afternoon window perfect!' : 'Classes outside 14-18 range.',
    };
  },
};
const STANDARD_LOAD = createStandardLoadRule('l6-standard', 6, 22);
export const LEVEL_6_RULES = [
  createMinEctsRule('l6-min', 20, 6, 'Mandatory'),
  INTERNSHIP,
  GHOST_MODE,
  ODD_HOURS,
  AFTERNOON_ONLY,
  STANDARD_LOAD,
];
