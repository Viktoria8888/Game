import { Rule } from '../../core/models/rules.interface';
import {
  createBanTimeSlots,
  createMaxDailyHoursRule,
  createMinEctsRule,
  createNoEarlyMorningRule,
  createPrerequisiteRule,
  createStandardLoadRule,
  createTagRequirementRule,
  mandatorySubjectForLevel,
} from './common';

const MIN_ECTS = createMinEctsRule('l2-min', 17, 2, 'Mandatory');

const STANDARD_LOAD = createStandardLoadRule('l2-standard', 2, 22);

const MANDATORY_SUB = mandatorySubjectForLevel('l2-mandatory', 2, ['3805']);

const PREREQUISITES = createPrerequisiteRule('l2-prereqs', 2);

const LUNCH_BREAK = createBanTimeSlots('l2-lunch', 2, 12, 14);

const HUMAN_GOAL = createTagRequirementRule('l2-hum', 'HUM', 2, 'Goal');

const NO_EARLY_MORNING = createNoEarlyMorningRule('l2-sleep', 2);

const MAX_DAILY_HOURS = createMaxDailyHoursRule('l2-daily-limit', 2, 6);

const PRACTICAL_SKILLS = createTagRequirementRule('l2-tools', 'TOOLS', 2, 'Mandatory');

export const LEVEL_2_RULES: Rule[] = [
  MIN_ECTS,
  MANDATORY_SUB,
  PREREQUISITES,
  LUNCH_BREAK,
  HUMAN_GOAL,
  NO_EARLY_MORNING,
  MAX_DAILY_HOURS,
  STANDARD_LOAD,
  PRACTICAL_SKILLS,
];
