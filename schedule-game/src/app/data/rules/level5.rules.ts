import { Rule } from '../../core/models/rules.interface';
import {
  createCumulativeProgressRule,
  createMinEctsRule,
  createStandardLoadRule,
  createTagBanRule,
  createTagSpecialistRule,
} from './common';

const ALPHABET_SOUP: Rule = {
  id: 'l5-abc',
  title: 'Alphabet Soup',
  description: 'No two courses can start with the same letter.',
  category: 'Goal',
  level: 5,
  priority: 50,
  scoreReward: 1500,
  validate: (ctx) => {
    const letters = ctx.coursesSelected.map((c) => c.name.trim().charAt(0).toUpperCase());
    const dupes = letters.filter((l, i) => letters.indexOf(l) !== i);
    return {
      satisfied: dupes.length === 0 && ctx.coursesSelected.length > 0,
      message:
        dupes.length === 0
          ? 'Alphabetically unique.'
          : `Duplicates: ${[...new Set(dupes)].join(', ')}.`,
    };
  },
};

const TCS_MASTER = createTagSpecialistRule('l5-tcs', 'TCS', 12, 5);

const NO_TOOLS = createTagBanRule('l5-pure', 'TOOLS', 5, 'Goal',1200,-20);
const ADVANCED = createTagSpecialistRule(
  'l5-advanced',
  'ADVANCED',
  12,
  5,
  'Get a bit more advanced'
);
const STANDARD_LOAD = createStandardLoadRule('l5-standard', 5, 22);

const PROGRESS_CHECK_2 = createCumulativeProgressRule('l5-progress', 110, 5);
export const LEVEL_5_RULES = [
  createMinEctsRule('l5-min', 22, 5, 'Mandatory'),
  TCS_MASTER,
  NO_TOOLS,
  ALPHABET_SOUP,
  ADVANCED,
  STANDARD_LOAD,
  PROGRESS_CHECK_2,
];
