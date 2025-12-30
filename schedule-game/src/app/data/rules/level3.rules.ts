import {
  createCumulativeProgressRule,
  createFreeDayRule,
  createMinEctsRule,
  createMutuallyExclusiveTagsRule,
  createStaircaseRule,
  createStandardLoadRule,
  createTagSynergyRule,
  mandatorySubjectForLevel,
  createTagSpecialistRule,
  createVowelCountRule,
} from './common';

export const LEVEL_3_RULES = [
  createMinEctsRule({ id: 'l3-min', level: 3, category: 'Mandatory' }, 20),
  createStandardLoadRule({ id: 'l3-standard', level: 3 }, 22),
  mandatorySubjectForLevel({ id: 'l3-mandatory', level: 3 }, ['4077']),
  createTagSynergyRule({ id: 'l3-synergy', level: 3, category: 'Mandatory' }, 'AI', 'STATS'),
  createMutuallyExclusiveTagsRule(
    { id: 'l3-rivalry', level: 3, category: 'Mandatory' },
    'AI',
    'OS'
  ),
  createCumulativeProgressRule({ id: 'l3-progress', level: 3, category: 'Goal' }, 66),
  createFreeDayRule(
    { id: 'l3-weekend', level: 3, category: 'Goal', scoreReward: 800 },
    'Fri'
  ),
  createVowelCountRule({ id: 'l3-vowel', level: 3 }, 3),
  createStaircaseRule({ id: 'l3-stair', level: 3, category: 'Mandatory' }),
];
