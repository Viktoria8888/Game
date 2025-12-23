import { Rule } from '../../core/models/rules.interface';
import {
  createMinEctsRule,
  createStandardLoadRule,
  createTagSynergyRule,
  mandatorySubjectForLevel,
} from './common';

const PRIME_ECTS: Rule = {
  id: 'l4-prime',
  title: 'Prime ECTS',
  description: 'Total ECTS must be a Prime Number.',
  category: 'Goal',
  level: 4,
  priority: 55,
  scoreReward: 1000,
  validate: (ctx) => {
    const n = ctx.metadata.currentSemesterEcts;
    const isPrime = (num: number) => {
      for (let i = 2, s = Math.sqrt(num); i <= s; i++) if (num % i === 0) return false;
      return num > 1;
    };
    return {
      satisfied: isPrime(n),
      message: isPrime(n) ? `Prime (${n})!` : `${n} is not prime. Change your points.`,
    };
  },
};

const PALINDROME_HOURS: Rule = {
  id: 'l5-palindrome',
  title: 'Palindrome Schedule',
  description: 'Total contact hours must be a palindrome (11, 22, 33...).',
  category: 'Goal',
  level: 4,
  priority: 55,
  scoreReward: 1000,
  stressModifier: -10,
  validate: (ctx) => {
    const hours = ctx.metadata.totalContactHours;
    const isPalindrome = hours.toString() === hours.toString().split('').reverse().join('');
    return {
      satisfied: isPalindrome,
      message: isPalindrome
        ? `${hours} hours - palindrome!`
        : `${hours} hours is not a palindrome.`,
    };
  },
};

const DB_SE_SYNERGY = createTagSynergyRule('l4-synergy', 'DB', 'SE', 4);
const MANDATORY = mandatorySubjectForLevel('l4-mandatory', 4, ['41199']);
const STANDARD_LOAD = createStandardLoadRule('l4-standard', 4, 23);
export const LEVEL_4_RULES = [
  createMinEctsRule('l4-min', 23, 4, 'Mandatory'),
  PRIME_ECTS,
  DB_SE_SYNERGY,
  MANDATORY,
  PALINDROME_HOURS,
  STANDARD_LOAD,
];
