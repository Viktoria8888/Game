import { Rule } from '../../core/models/rules.interface';
import {
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
  title: 'The Ghost of the Past',
  description:
    'Your previous choices haunt you. The last letter of a course name must summon the first letter of the next one.',
});

const TCS_MASTER = createTagSpecialistRule(
  { id: 'l5-tcs', level: 5, title: 'Now you are ready for some theory' },
  'TCS',
  12
);
const ALLITERATION: Rule = {
  id: 'l5-alliteration',
  title: 'Switching to Journalism Major',
  description: 'Select at least 3 distinct subjects that start with the same letter.',
  category: 'Goal',
  level: 5,
  scoreReward: 350,
  priority: 100,
  validate: (ctx) => {
    const letterToSubjects = new Map<string, number>();

    ctx.coursesSelected.forEach((c) => {
      const char = c.name.trim().charAt(0).toUpperCase();
      const currentCount = letterToSubjects.get(char) || 0;
      letterToSubjects.set(char, currentCount + 1);
    });

    const max = Math.max(0, ...letterToSubjects.values());

    const letter = [...letterToSubjects.entries()].find(([k, v]) => v === max)?.[0] || '?';

    return {
      satisfied: max >= 3,
      message:
        max >= 3
          ? `Beautiful alliteration on '${letter}'! (${max} subjects).`
          : `Journalism requires repetition. Max same-start subjects: ${max}/3.`,
    };
  },
};

const NO_NUMBERS: Rule = {
  id: 'l5-no-numbers',
  title: "I Can't Count Anymore",
  description:
    'After 5 semesters, seeing a number makes you ill. Avoid courses with digits (0-9) in their name.',
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
          ? 'Safe. No scary numbers here.'
          : `Aaaah! A number! Get it away: ${withNumbers.map((c) => c.name).join(', ')}.`,
    };
  },
};

const NO_TOOLS = createTagBanRule(
  {
    id: 'l5-pure',
    level: 5,
    category: 'Goal',
    title: 'Pure theory. Zero practice',
    scoreReward: 250,
  },
  'TOOLS'
);

const STANDARD_LOAD = createStandardLoadRule(
  { id: 'l5-standard', level: 5, scoreReward: 250, title: 'Your grandma will be proud of you!' },
  22
);

export const LEVEL_5_RULES: ReadonlyArray<Rule> = [
  createMinEctsRule(
    {
      id: 'l5-min',
      level: 5,
      category: 'Mandatory',
      title: 'x<sup>y</sup> = y<sup>x</sup>?',
      description: "Guess which min number of ECTS is required! (don't cheat)",
    },
    16
  ),
  WORD_CHAIN,
  TCS_MASTER,
  STANDARD_LOAD,
  ALLITERATION,
  NO_NUMBERS,
  NO_TOOLS,
];
