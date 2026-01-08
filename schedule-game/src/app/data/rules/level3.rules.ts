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
  createStandardLoadRule(
    {
      id: 'l3-standard',
      category: 'Mandatory',
      level: 3,
      title: 'Your mom will be proud of you!',
    },
    22
  ),
  mandatorySubjectForLevel(
    {
      id: 'l3-mandatory',
      level: 3,
      title: 'Pure luck🍀',
      description: 'Only luck shall help you pass this.',
    },
    ['4077']
  ),
  createTagSynergyRule({ id: 'l3-synergy', level: 3, category: 'Mandatory' }, 'AI', 'STATS'),
  createMutuallyExclusiveTagsRule(
    { id: 'l3-rivalry', level: 3, category: 'Mandatory' },
    'AI',
    'OS'
  ),

  createCumulativeProgressRule(
    { id: 'l3-progress', level: 3, category: 'Goal', scoreReward: 200 },
    66
  ),
  createFreeDayRule(
    {
      id: 'l3-weekend',
      level: 3,
      category: 'Mandatory',
      scoreReward: 300,
      title: 'More free time',
    },
    'Fri'
  ),
  createVowelCountRule({ id: 'l3-vowel', level: 3, scoreReward: 500 }, 3),
  createStaircaseRule({
    id: 'l3-stair',
    title: 'Heavy subjects sink',
    level: 3,
    category: 'Mandatory',
    scoreReward: 300,
    description: "Each day's start time must be lower (later) than the previous day",
  }),
];
