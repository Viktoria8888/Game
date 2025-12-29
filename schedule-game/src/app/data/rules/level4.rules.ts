import { Rule } from '../../core/models/rules.interface';
import {
  createTypeSegregationRule,
  createMaxContactHoursRule,
  createPalindromeHoursRule,
  mandatorySubjectForLevel,
} from './common';

const BLACKJACK: Rule = {
  id: 'l4-blackjack',
  title: 'Blackjack',
  description: 'Your total ECTS must be exactly 21. Do not bust!',
  category: 'Mandatory',
  level: 4,
  priority: 10,
  validate: (ctx) => {
    const current = ctx.metadata.currentSemesterEcts;
    return {
      satisfied: current === 21,
      message: current === 21 ? 'Blackjack! (21 ECTS) ♠️♥️' : `Current: ${current}. Target: 21.`,
    };
  },
};

export const LEVEL_4_RULES = [
  BLACKJACK,
  mandatorySubjectForLevel({ id: 'l4-mandatory', level: 4 }, ['41199']),
  createTypeSegregationRule({ id: 'l4-segregate', level: 4 }, 'Lecture', 'Laboratory'),
  createTypeSegregationRule({ id: 'l4-segregate', level: 4 }, 'Lecture', 'Classes'),
  createPalindromeHoursRule({ id: 'l4-palindrome', level: 4, category: 'Goal' }),
  createMaxContactHoursRule(
    { id: 'l4-efficient', level: 4, category: 'Goal', scoreReward: 400 },
    18
  ),
];
