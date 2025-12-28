import {
  createCumulativeProgressRule,
  createFreeDayRule,
  createMinEctsRule,
  createMutuallyExclusiveTagsRule,
  createStandardLoadRule,
  createTagDiversityRule,
  createTagSpecialistRule,
  createVowelCountRule,
  mandatorySubjectForLevel,
} from './common';

const DEPT_RIVALRY = createMutuallyExclusiveTagsRule('l3-rivalry', 'AI', 'OS', 3);
const NO_FRIDAY = createFreeDayRule('l3-weekend', 'Fri', 3, 'Mandatory', 600, -25);
const TAG_EXPLORER = createTagDiversityRule('l3-explorer', 4, 3, 'Goal');
const TOOLS = createTagSpecialistRule('l3-tools', 'TOOLS', 8, 3);
const VOWEL_HARMONY = createVowelCountRule('l3-vowel', 3, 3);
const PROGRESS_CHECK_1 = createCumulativeProgressRule('l3-progress', 66, 3);
const STANDARD_LOAD = createStandardLoadRule('l3-standard', 3, 22);
const MANDATORY = mandatorySubjectForLevel('l3-mandatory', 3, ['4077', '4090']);

export const LEVEL_3_RULES = [
  createMinEctsRule('l3-min', 17, 3, 'Mandatory'),
  DEPT_RIVALRY,
  NO_FRIDAY,
  TAG_EXPLORER,
  VOWEL_HARMONY,
  TOOLS,
  STANDARD_LOAD,
  PROGRESS_CHECK_1,
  MANDATORY,
];
