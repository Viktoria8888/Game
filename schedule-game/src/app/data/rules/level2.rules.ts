import { Rule } from '../../core/models/rules.interface';
import { SUBJECTS } from '../subjects';
import {
  createMinEctsRule,
  createStandardLoadRule,
  getPassedCourseSubjectIds,
  hasCourseWithTag,
  mandatorySubjectForLevel,
} from './common';
export const PREREQUISITES: Rule = {
  id: 'l2-prereqs',
  title: 'Prerequisites',
  description: 'Pass prerequisite courses before taking advanced ones.',
  category: 'Mandatory',
  level: 2,
  priority: 150,
  validate: (ctx) => {
    const passedIds = getPassedCourseSubjectIds(ctx);
    const currentSubjectIds = new Set(ctx.coursesSelected.map((c) => c.subjectId));
    const violations: string[] = [];

    ctx.coursesSelected.forEach((course) => {
      if (course.prerequisites && course.prerequisites.length > 0) {
        const missingIds = course.prerequisites.filter(
          (id) => !passedIds.has(id) && !currentSubjectIds.has(id)
        );

        if (missingIds.length > 0) {
          const missingNames = missingIds
            .map((id) => SUBJECTS.find((s) => s.id === id)?.name || id)
            .join(', ');

          violations.push(`${course.name} (Missing: ${missingNames})`);
        }
      }
    });

    return {
      satisfied: violations.length === 0,
      severity: 'error',
      message:
        violations.length === 0
          ? 'Prerequisites met.'
          : `Prerequisite violations:\n• ${violations.join('\n• ')}`,
    };
  },
};
const LUNCH_BREAK: Rule = {
  id: 'l2-lunch',
  title: 'Mandatory Lunch',
  description: 'Keep 12:00-14:00 free on class days.',
  category: 'Mandatory',
  level: 2,
  priority: 90,
  stressModifier: -15,
  validate: (ctx) => {
    const violations: string[] = [];
    const days = new Set(ctx.schedule.map((s) => s.day));
    days.forEach((day) => {
      const slots = ctx.schedule.filter((s) => s.day === day);
      if (slots.some((s) => s.startTime === 12 || s.startTime === 13)) {
        violations.push(day);
      }
    });
    return {
      satisfied: violations.length === 0,
      message:
        violations.length === 0 ? 'Lunch secured.' : `Starving on: ${violations.join(', ')}.`,
    };
  },
};

const HUMAN_GOAL: Rule = {
  id: 'l2-hum',
  title: 'Cultural Enrichment',
  description: 'Enroll in at least one Humanities (HUM) course.',
  category: 'Goal',
  level: 2,
  priority: 40,
  scoreReward: 200,
  stressModifier: -5,
  validate: (ctx) => ({
    satisfied: hasCourseWithTag(ctx, 'HUM'),
    message: hasCourseWithTag(ctx, 'HUM') ? 'Cultured student.' : 'Missing Humanities course.',
  }),
};

const NO_EARLY_MORNING: Rule = {
  id: 'l2-sleep',
  title: 'Vampire Mode',
  description: 'No classes before 10:00.',
  category: 'Goal',
  priority: 50,
  level: 2,
  scoreReward: 400,
  stressModifier: -20,
  validate: (ctx) => {
    const early = ctx.schedule.filter((s) => s.startTime < 10).length;
    return {
      satisfied: early === 0,
      message: early === 0 ? 'Beauty sleep preserved.' : `${early} early morning classes!`,
    };
  },
};

const MAX_DAILY_HOURS: Rule = {
  id: 'l2-daily-limit',
  title: 'Daily Limit',
  description: 'No single day should have more than 6 contact hours.',
  category: 'Goal',
  priority: 45,
  level: 2,
  scoreReward: 250,
  stressModifier: -5,
  validate: (ctx) => {
    const hoursByDay = new Map<string, number>();
    ctx.schedule.forEach((s) => {
      hoursByDay.set(s.day, (hoursByDay.get(s.day) || 0) + 1);
    });
    const maxDay = Math.max(...Array.from(hoursByDay.values()), 0);
    return {
      satisfied: maxDay <= 6,
      message: maxDay <= 6 ? 'Reasonable daily schedule.' : `${maxDay} hours in one day is brutal!`,
    };
  },
};

const STANDARD_LOAD = createStandardLoadRule('l2-standard', 2, 22);
export const LEVEL_2_RULES = [
  createMinEctsRule('l2-min', 17, 2, 'Mandatory'),
  mandatorySubjectForLevel('l2-mandatory', 2, ['3805']),
  PREREQUISITES,
  LUNCH_BREAK,
  HUMAN_GOAL,
  NO_EARLY_MORNING,
  MAX_DAILY_HOURS,
  STANDARD_LOAD,
];
