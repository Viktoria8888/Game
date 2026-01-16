import { Rule } from '../../core/models/rules.interface';
import {
  createTypeSegregationRule,
  createMaxContactHoursRule,
  createPalindromeHoursRule,
  mandatorySubjectForLevel,
  createNoGapsRule,
  createOddStartTimesRule,
  createBanTimeSlots,
} from './common';

const BLACKJACK: Rule = {
  id: 'l4-blackjack',
  title: 'Blackjack',
  description: 'Your total ECTS must be exactly 21.',
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
  mandatorySubjectForLevel(
    {
      id: 'l4-mandatory',
      level: 4,
      title: 'Death & Taxes',
      description: "Failing algorithm's exam is even more certain in life",
    },
    ['41199']
  ), // AiDS
  createOddStartTimesRule({
    id: 'l4-odd',
    level: 4,
    category: 'Mandatory',
    scoreReward: 200,
    title: 'Oddly Satisfying',
    description: 'Even start time may bring bad luck!',
  }),
  createBanTimeSlots(
    {
      id: 'l4-lunch',
      level: 4,
      category: 'Mandatory',
      priority: 50,
      title: "Go and get your student's 20% discount!",
      description: 'Keep 13:00-14:00 free.',
    },
    13,
    14
  ),
  createTypeSegregationRule(
    {
      id: 'l4-segregate',
      level: 4,
      category: 'Mandatory',
      title: 'Final fight: Lectures vs Labs',
      description: 'One hour between lectures and labs.',
    },
    'Lecture',
    'Laboratory'
  ),

  createNoGapsRule(
    {
      id: 'l4-compact',
      level: 4,
      category: 'Goal',
      scoreReward: 300,
      title: 'Just Efficiency',
      description: 'Zero gaps allowed between classes on the same day.',
    },
    0
  ),
  createPalindromeHoursRule({ id: 'l4-palindrome', level: 4, category: 'Goal', scoreReward: 400 }),
  createMaxContactHoursRule(
    { id: 'l4-efficient', level: 4, category: 'Goal', scoreReward: 400 },
    18
  ),
];
