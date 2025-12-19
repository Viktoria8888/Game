import { Course, ScheduleSlot } from '../../core/models/course.interface';
import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';

export const hasCourseWithTag = (ctx: ValidationContext, tag: string) =>
  ctx.coursesSelected.some((c) => c.tags?.includes(tag as any));

export const countCoursesByType = (ctx: ValidationContext, type: string) =>
  ctx.coursesSelected.filter((c) => c.type === type).length;

export const getPassedCourseIds = (ctx: ValidationContext): Set<string> => {
  const ids = new Set<string>();
  ctx.history.forEach((sem) => sem.coursesTaken.forEach((id) => ids.add(id)));
  return ids;
};

export const mandatorySubjectForLevel = (
  id: string,
  level: number,
  requiredSubjectIds: string[]
): Rule => {
  const requiredNames = COURSES.filter(
    (course) => requiredSubjectIds.includes(course.subjectId) && course.type != 'Classes'
  )
    .map((c) => c.name)
    .join(', ');

  return {
    id,
    title: 'Mandatory Subjects',
    description: `Required subjects: ${requiredNames}.`,
    category: 'Mandatory',
    level,
    scoreReward: 100 + Number(Math.random() * 10),
    stressModifier: 0,

    validate: (context: ValidationContext) => {
      const selectedIds = new Set(context.coursesSelected.map((c) => c.subjectId));

      const missingIds = requiredSubjectIds.filter((reqId) => !selectedIds.has(reqId));

      const missingNames = COURSES.filter((c) => missingIds.includes(c.id)).map((c) => c.name);

      return {
        satisfied: missingIds.length === 0,
        severity: 'error',
        message:
          missingIds.length === 0
            ? 'All mandatory subjects selected.'
            : `Missing: ${missingNames.join(', ')}`,
      };
    },
  };
};

export const createMinEctsRule = (
  id: string,
  minEcts: number,
  level: number | null = null,
  category: 'Mandatory' | 'Goal'
): Rule => {
  return {
    id,
    title: 'Minimum Ects',
    description: `Minimum ${minEcts} ECTS required per semester`,
    category,
    level: level,
    priority: 1,

    validate: (context: ValidationContext) => {
      const current = context.metadata.currentSemesterEcts;
      const satisfied = current >= minEcts;

      return {
        satisfied,
        severity: 'error',
        message: satisfied
          ? `You have ${current} ECTS (need ${minEcts})`
          : `You need ${minEcts - current} more ECTS (${current}/${minEcts})`,
        details: {
          currentVal: current,
          requiredVal: minEcts,
        },
      };
    },
  };
};

export const createMaxEctsRule = (
  id: string,
  maxEcts: number,
  level: number | null = null,
  category: 'Mandatory' | 'Goal'
): Rule => {
  return {
    id,
    title: 'Maximum Ects',
    description: `Maximum ${maxEcts} ECTS required per semester`,
    category,
    level: level,
    priority: 1,

    validate: (context: ValidationContext) => {
      const current = context.metadata.currentSemesterEcts;
      const satisfied = current <= maxEcts;

      return {
        satisfied,
        severity: 'error',
        message: satisfied
          ? `You have ${current} ECTS (need ${maxEcts})`
          : `You need ${maxEcts - current} more ECTS (${current}/${maxEcts})`,
        details: {
          currentVal: current,
          requiredVal: maxEcts,
        },
      };
    },
  };
};

export const free_friday = (
  level: number,
  category: 'Mandatory' | 'Goal',
  scoreReward: number,
  stressModifier: number
) => {
  return {
    id: 'l1-free-friday',
    title: 'Long Weekend',
    description: 'Keep Friday completely free of classes.',
    scoreReward,
    stressModifier,
    category,
    level,
    validate: (context: ValidationContext) => {
      const fridaySlots = context.schedule.filter((s) => s.day === 'Fri' && s.course !== null);
      const isSatisfied = fridaySlots.length === 0;

      return {
        satisfied: isSatisfied && context.coursesSelected.length > 0,
        message: isSatisfied
          ? 'Friday is free! Enjoy your long weekend.'
          : 'You have classes on Friday. Try to move them to get a long weekend!',
      };
    },
  } as Rule;
};

export const no_gaps = (scoreReward: number, stressModifier: number, gap: number): Rule => {
  return {
    id: 'l1-no-gaps',
    title: 'Compact Schedule',
    description: 'Avoid gaps longer than 2 hours.',
    category: 'Goal',
    level: 1,
    scoreReward,
    stressModifier,

    validate: (context: ValidationContext) => {
      const hasHugeGap = context.metadata.maxGapInAnyDay > gap;

      return {
        satisfied: !hasHugeGap && context.coursesSelected.length > 0,
        message: !hasHugeGap
          ? 'Schedule is compact.'
          : 'You have long gaps (over 2h) between classes.',
      };
    },
  };
};
