import { Rule } from '../../core/models/rules.interface';
import {
  createCumulativeProgressRule,
  createMinEctsRule,
  createStandardLoadRule,
  createTagBanRule,
  createTagSpecialistRule,
  createWordChainRule,
} from './common';

const WORD_CHAIN = createWordChainRule({
  id: 'l5-chain',
  level: 5,
  category: 'Mandatory',
  scoreReward: 2000,
});


const TCS_MASTER = createTagSpecialistRule({ id: 'l5-tcs', level: 5 }, 'TCS', 12);
const ALLITERATION: Rule = {
  id: 'l5-alliteration',
  title: 'Poetic Alliteration',
  description: 'Select at least 3 courses that start with the same letter.',
  category: 'Goal',
  level: 5,
  scoreReward: 1000,
  priority: 100,
  validate: (ctx) => {
    const counts: Record<string, number> = {};
    ctx.coursesSelected.forEach((c) => {
      const char = c.name.trim().charAt(0).toUpperCase();
      counts[char] = (counts[char] || 0) + 1;
    });
    const max = Math.max(0, ...Object.values(counts));
    const letter = Object.keys(counts).find((k) => counts[k] === max);

    return {
      satisfied: max >= 3,
      message:
        max >= 3
          ? `Beautiful alliteration on '${letter}'! (${max} courses).`
          : `Poetry requires repetition. Max same-start: ${max}/3.`,
    };
  },
};

const NO_NUMBERS: Rule = {
  id: 'l5-no-numbers',
  title: 'Pure Prose',
  description: 'Course names must not contain digits (0-9). Numbers are for mathematicians.',
  category: 'Goal',
  level: 5,
  scoreReward: 600,
  priority: 100,
  validate: (ctx) => {
    const withNumbers = ctx.coursesSelected.filter((c) => /\d/.test(c.name));
    return {
      satisfied: withNumbers.length === 0 && ctx.coursesSelected.length > 0,
      message:
        withNumbers.length === 0
          ? 'A purely textual schedule.'
          : `Digits found in: ${withNumbers.map((c) => c.name).join(', ')}.`,
    };
  },
};

const NO_TOOLS = createTagBanRule(
  { id: 'l5-pure', level: 5, category: 'Goal', scoreReward: 1200 },
  'TOOLS'
);

const STANDARD_LOAD = createStandardLoadRule({ id: 'l5-standard', level: 5 }, 22);
const PROGRESS_CHECK_2 = createCumulativeProgressRule({ id: 'l5-progress', level: 5 }, 105);

export const LEVEL_5_RULES: ReadonlyArray<Rule> = [
  createMinEctsRule({ id: 'l5-min', level: 5, category: 'Mandatory' }, 16),
  WORD_CHAIN,
  TCS_MASTER,
  STANDARD_LOAD,
  PROGRESS_CHECK_2,
  ALLITERATION, 
  NO_NUMBERS, 
  NO_TOOLS, 
];
