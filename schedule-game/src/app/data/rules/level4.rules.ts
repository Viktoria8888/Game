import {
  createMinEctsRule,
  createStandardLoadRule,
  createTagSynergyRule,
  mandatorySubjectForLevel,
  createPrimeEctsRule,
  createPalindromeHoursRule,
  createPrerequisiteRule,
} from './common';

const PRIME_ECTS = createPrimeEctsRule('l4-prime', 4);
const PALINDROME_HOURS = createPalindromeHoursRule('l5-palindrome', 4);

const DB_SE_SYNERGY = createTagSynergyRule('l4-synergy', 'DB', 'SE', 4);
const MANDATORY = mandatorySubjectForLevel('l4-mandatory', 4, ['41199']);
const STANDARD_LOAD = createStandardLoadRule('l4-standard', 4, 23);
const PREREQUISITES = createPrerequisiteRule('l4-prereqs', 4);

export const LEVEL_4_RULES = [
  createMinEctsRule('l4-min', 23, 4, 'Mandatory'),
  PRIME_ECTS,
  DB_SE_SYNERGY,
  MANDATORY,
  PALINDROME_HOURS,
  STANDARD_LOAD,
  PREREQUISITES,
];
