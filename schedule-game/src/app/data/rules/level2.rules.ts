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
      title: 'Min ECTS',
      description: 'Did you know that 19 is a "happy" number?',
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
      title: 'Algebraic Trauma',
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
      description: 'You MUST take a break 13-14 to recover.',
      messages: ['Yum! Lunch secured.', 'Starvation detected! You need a break 13-14.'],
    },
    13,
    14
  ),
  createTagDiversityRule(
    {
      id: 'l2-diversity',
      level: 2,
      category: 'Mandatory',
      scoreReward: 100,
      title: 'Identity Crisis',
      description: 'Are you a coder? A manager? A philosopher? Yes. Pick 4 different tags.',
    },
    4
  ),

  createStandardLoadRule(
    {
      id: 'l2-standard',
      level: 2,
      scoreReward: 250,
      title: 'On track',
      description: '22 ECTS. The amount recommended by 9 out of 10 sleep-deprived students.',
    },
    22
  ),
  createTagRequirementRule(
    {
      id: 'l2-hum',
      level: 2,
      category: 'Goal',
      scoreReward: 150,
      title: 'Less Screen',
      description: 'Take a HUM course. Computers are cool, but people are... interesting.',
    },
    'HUM'
  ),
  createPrerequisiteRule({
    id: 'l2-prereqs',
    level: 2,
    title: "Rome wasn't build in a day...",
    description: '...so is your basic knowledge. Watch out for prerequsities!',
  }),
  createTagRequirementRule(
    {
      id: 'l2-tools',
      level: 2,
      category: 'Goal',
      scoreReward: 300,
      title: 'Anti-Corpo-Unemployment Protocol',
      description: 'Take a TOOLS course!',
    },
    'TOOLS'
  ),
  createMaxDailyHoursRule(
    {
      id: 'l2-daily-limit',
      level: 2,
      scoreReward: 300,
      title: 'Anti-Zombie Protocol',
      description: "More than 6 hours of class in one day? Do you hate yourself? Don't do it.",
    },
    6
  ),
];
