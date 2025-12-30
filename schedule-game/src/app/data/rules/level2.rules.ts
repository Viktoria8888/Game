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
  createMinEctsRule({ id: 'l2-min', level: 2, category: 'Mandatory' }, 18),
  createStandardLoadRule({ id: 'l2-standard', level: 2 }, 22),
  mandatorySubjectForLevel({ id: 'l2-mandatory', level: 2 }, ['3805']),
  createNoEarlyMorningRule({ id: 'l2-sleep', level: 2, category: 'Mandatory' }),

  createBanTimeSlots(
    {
      id: 'l2-lunch',
      level: 2,
      category: 'Mandatory',
      messages: ['Yum!', 'Cafeteria is closed. You MUST take a break 13-14.'],
    },
    13,
    14
  ),

  createTagRequirementRule({ id: 'l2-hum', level: 2, category: 'Goal' }, 'HUM'),
  createPrerequisiteRule({ id: 'l2-prereqs', level: 2 }),
  createTagRequirementRule({ id: 'l2-tools', level: 2, category: 'Goal' }, 'TOOLS'),

  createTagDiversityRule(
    { id: 'l2-diversity', level: 2, category: 'Mandatory', scoreReward: 100},
    4
  ),
  createMaxDailyHoursRule({ id: 'l2-daily-limit', level: 2 }, 6),
  createPrerequisiteRule({ id: 'l2-prereqs', level: 2 }),
];
