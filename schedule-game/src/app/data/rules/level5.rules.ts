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
  scoreReward: 500,
});

const TCS_MASTER = createTagSpecialistRule({ id: 'l5-tcs', level: 5 }, 'TCS', 12);
const ALLITERATION: Rule = {
  id: 'l5-alliteration',
  title: 'Poetic Alliteration',
  description: 'Select at least 3 distinct subjects that start with the same letter.',
  category: 'Goal',
  level: 5,
  scoreReward: 350,
  priority: 100,
  validate: (ctx) => {
    const letterToSubjects = new Map<string, Set<string>>();

    ctx.coursesSelected.forEach((c) => {
      const char = c.name.trim().charAt(0).toUpperCase();
      if (!letterToSubjects.get(char)) {
        letterToSubjects.set(char, new Set<string>());
      }
      letterToSubjects.get(char)!.add(c.subjectId);
    });

    const counts = Object.values(letterToSubjects).map((set) => set.size);
    const max = Math.max(0, ...counts);
    const letter = Object.keys(letterToSubjects).find((k) => letterToSubjects.get(k)!.size === max);

    return {
      satisfied: max >= 3,
      message:
        max >= 3
          ? `Beautiful alliteration on '${letter}'! (${max} subjects).`
          : `Poetry requires repetition. Max same-start subjects: ${max}/3.`,
    };
  },
};

const NO_NUMBERS: Rule = {
  id: 'l5-no-numbers',
  title: 'Pure Prose',
  description: 'Course names must not contain digits (0-9). Numbers are for mathematicians.',
  category: 'Goal',
  level: 5,
  scoreReward: 100,
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
  { id: 'l5-pure', level: 5, category: 'Goal', scoreReward: 250 },
  'TOOLS'
);

const STANDARD_LOAD = createStandardLoadRule({ id: 'l5-standard', level: 5, scoreReward: 250 }, 22);
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
