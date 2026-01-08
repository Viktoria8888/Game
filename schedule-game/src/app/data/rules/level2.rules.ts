import { Rule } from '../../core/models/rules.interface';
import {
  createBanTimeSlots,
  createMinEctsRule,
  createNoEarlyMorningRule,
  createPrerequisiteRule,
  createStandardLoadRule,
  createTagRequirementRule,
  createTagDiversityRule,
  mandatorySubjectForLevel,
  createMaxDailyHoursRule,
} from './common';

export const LEVEL_2_RULES: Rule[] = [
  createMinEctsRule(
    {
      id: 'l2-min',
      level: 2,
      category: 'Mandatory',
      description:
        'Did you know that 19 is a "happy" number? Even happier than you on your first year 😝',
    },
    19
  ),
  createNoEarlyMorningRule({
    id: 'l2-sleep',
    level: 2,
    category: 'Mandatory',
    title: 'Vampire Mode',
    description: 'Classes before 10:00 AM are a crime against humanity.',
  }),
  mandatorySubjectForLevel(
    {
      id: 'l2-mandatory',
      level: 2,
      title: 'Algebraic trauma',
      description: 'You can run, you can hide, but matrix multiplication is by your side!',
    },
    ['3805']
  ),
  createBanTimeSlots(
    {
      id: 'l2-lunch',
      level: 2,
      category: 'Mandatory',
      title: 'Hangover Cure',
      description: 'Cafeteria is closed. You MUST take a break 13-14 to recover.',
      messages: ['Yum! Lunch secured.', 'Starvation detected! You need a break 13-14.'],
    },
    13,
    14
  ),
  createTagDiversityRule(
    { id: 'l2-diversity', level: 2, category: 'Mandatory', scoreReward: 100 },
    4
  ),

  createStandardLoadRule({ id: 'l2-standard', level: 2, scoreReward: 250 }, 22),
  createTagRequirementRule({ id: 'l2-hum', level: 2, category: 'Goal', scoreReward: 150 }, 'HUM'),
  createPrerequisiteRule({ id: 'l2-prereqs', level: 2, title: 'Still too weak!' }),
  createTagRequirementRule(
    { id: 'l2-tools', level: 2, category: 'Goal', scoreReward: 300 },
    'TOOLS'
  ),
  createMaxDailyHoursRule({ id: 'l2-daily-limit', level: 2, scoreReward: 300 }, 6),
];
