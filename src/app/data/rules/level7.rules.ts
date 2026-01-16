import { Rule } from '../../core/models/rules.interface';
import {
  createFreeDayRule,
  createMaxContactHoursRule,
  createMinEctsRule,
  createStaircaseRule,
} from './common';

const HATE_MONDAYS = createFreeDayRule(
  {
    id: 'l7-garfield',
    level: 7,
    category: 'Goal',
    title: 'The Most Hated Day of The Week',
    description: "...so, don't schedule classes then :O",
    messages: ['***day successfully skipped.', 'You have class on ***day? Disgusting.'],
  },
  'Mon'
);

const DESCENDING_STAIRCASE = createStaircaseRule(
  {
    id: 'l7-staircase',
    level: 7,
    scoreReward: 600,
    category: 'Mandatory',
    title: 'The End Of The Childhood',
    priority: 1,
    description:
      "You are about to finish uni, so you and your schedule is gradually DESCENDING into adult's real life",
  },
  'up'
);

const DWARVES = createMaxContactHoursRule(
  {
    id: 'l7-dwarved',
    level: 7,
    category: 'Goal',
    scoreReward: 1000,
    title: 'Better go outside and find dwarves 🧙🏻‍♂️',
    description: 'Spend less than 12 hours a week in class',
  },
  12
);

const INTROVERT_MODE: Rule = {
  id: 'l7-introvert',
  title: 'The Introvert',
  description: 'Avoid human interaction. No Project", Seminar or Humanities.',
  category: 'Mandatory',
  level: 7,
  priority: 50,
  validate: (ctx) => {
    const socialCourses = ctx.coursesSelected.filter(
      (c) => c.type === 'Project' || c.type === 'Seminar'
    );
    return {
      satisfied: socialCourses.length === 0,
      message:
        socialCourses.length === 0
          ? 'Solitude achieved.'
          : `Panic! You have to talk to people in: ${socialCourses.map((c) => c.name).join(', ')}.`,
    };
  },
};
// Not so many courses to create a valid word combination.
// const ALPHABET_SOUP: Rule = {
//   id: 'l7-uwr',
//   title: 'UWU SLEEP',
//   description:
//     'Your course names must start with these letters to spell "S-L-E-E-P" (at least one of each).',
//   category: 'Goal',
//   level: 7,
//   scoreReward: 1200,
//   priority: 100,
//   validate: (ctx) => {
//     const initials = new Set(ctx.coursesSelected.map((c) => c.name.charAt(0).toUpperCase()));
//     const required = ['U', 'A', 'Z', 'Y'];
//     const missing = required.filter((char) => !initials.has(char));

//     return {
//       satisfied: missing.length === 0,
//       message:
//         missing.length === 0
//           ? 'L-A-Z-Y achieved. You can rest now.'
//           : `Missing letters for the soup: ${missing.join(', ')}.`,
//     };
//   },
// };

export const LEVEL_7_RULES: Rule[] = [
  createMinEctsRule({ id: 'l7-min', level: 7, category: 'Mandatory' }, 20),
  DESCENDING_STAIRCASE,
  HATE_MONDAYS,
  DWARVES,
  INTROVERT_MODE,
];
