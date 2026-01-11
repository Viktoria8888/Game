import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import {
  createMinEctsRule,
  createNoGapsRule,
  createStandardLoadRule,
  createTagBanRule,
  createMaxDailyHoursRule,
  mandatorySubjectForLevel,
  createMinNameLengthRule,
  createPrerequisiteRule,
} from './common';

export const RECOMMENDED: Rule = {
  id: 'l1-recommended',
  title: 'Recommended Path',
  description:
    'Stick to the script or you will be kicked. Select all subjects recommended for the first year.',
  category: 'Goal',
  priority: 20,
  level: 1,
  scoreReward: 300,
  validate: (ctx: ValidationContext) => {
    const userSubjectIds = new Set(ctx.coursesSelected.map((c) => c.subjectId));
    const recommendedIds = new Set(
      COURSES.filter((c) => c.isFirstYearRecommended).map((c) => c.subjectId)
    );
    const missing = [...recommendedIds].filter((id) => !userSubjectIds.has(id));
    const missingNames = missing.map((id) => {
      const found = COURSES.find((c) => c.subjectId === id);
      return found ? found.name : id;
    });

    const isSatisfied = missing.length === 0;

    return {
      satisfied: isSatisfied,
      severity: isSatisfied ? 'warning' : 'error',
      message: isSatisfied
        ? 'Great! You are following the herd.'
        : `You are drifting away. Missing: ${missingNames.join(', ')}`,
    };
  },
};

export const LEVEL_1_RULES: ReadonlyArray<Rule> = [
  mandatorySubjectForLevel(
    {
      id: 'l1-mandatory',
      level: 1,
      scoreReward: 0,
      title: 'The Filter Mode',
      description: 'These subjects are designed to make you quit. Prove them wrong (or not)',
    },
    ['4141', '4108']
  ),
  createMinEctsRule(
    { id: 'l1-min', level: 1, category: 'Mandatory', title: 'Passing the Bar' },
    20
  ),
  createNoGapsRule(
    {
      id: 'l1-no-gaps',
      level: 1,
      category: 'Goal',
      scoreReward: 200,
      title: 'Fear of the Void',
      description: 'As a freshman, you are scared of empty hallways. No gaps >3h allowed.',
      messages: ['Safe and compact.', 'The void stares back! Gap >3h detected.'],
    },
    3
  ),
  createTagBanRule(
    {
      id: 'l1-no-advanced',
      level: 1,
      category: 'Mandatory',
      title: 'Skill issue',
      description: 'You are still too weak to advance.',
    },
    'ADVANCED'
  ),
  createStandardLoadRule({ id: 'l1-standard', level: 1, scoreReward: 200 }, 25),
  createMaxDailyHoursRule(
    {
      id: 'l1-daily',
      level: 1,
      category: 'Goal',
      scoreReward: 150,
      title: 'Thermal Shock',
      description:
        'Your high school habits persist. You cannot handle more than 6h of classes a day.',
      messages: ['Healthy work-life balance.', 'Burnout imminent! >6 hours in a single day!'],
    },
    6
  ),
  createMinNameLengthRule({ id: 'l1-names', level: 1, category: 'Goal', scoreReward: 150 }, 10),
  RECOMMENDED,
  createPrerequisiteRule({ id: 'l1-prereqs', title: 'Looking for troubles?', level: 1 }),
];
