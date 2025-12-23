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

export const createCumulativeProgressRule = (
  id: string,
  minTotalEcts: number,
  level: number
): Rule => {
  return {
    id,
    title: 'Academic Progress',
    description: `You must have earned a total of ${minTotalEcts} ECTS by the end of this semester.`,
    category: 'Mandatory',
    level,
    priority: 200,
    validate: (ctx) => {
      const pastEcts = ctx.history.reduce((sum, h) => sum + h.ectsEarned, 0);
      const currentEcts = ctx.metadata.currentSemesterEcts;
      const total = pastEcts + currentEcts;

      return {
        satisfied: total >= minTotalEcts,
        severity: 'error',
        message:
          total >= minTotalEcts
            ? `On track! Total ECTS: ${total}/${minTotalEcts}.`
            : `ACADEMIC DEBT! You are behind. Total: ${total}/${minTotalEcts}. You need ${
                minTotalEcts - total
              } more points NOW.`,
      };
    },
  };
};

export const mandatorySubjectForLevel = (
  id: string,
  level: number,
  requiredSubjectIds: string[],
  scoreReward?: number
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
    priority: 200,
    level,
    validate: (context: ValidationContext) => {
      const selectedIds = new Set(context.coursesSelected.map((c) => c.subjectId));
      const missingIds = requiredSubjectIds.filter((reqId) => !selectedIds.has(reqId));
      return {
        satisfied: missingIds.length === 0,
        severity: 'error',
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
    title: 'Minimum ECTS',
    description: `Minimum ${minEcts} ECTS required.`,
    category,
    level,
    priority: 1,
    validate: (context) => {
      const current = context.metadata.currentSemesterEcts;
      return {
        satisfied: current >= minEcts,
        severity: 'error',
        message:
          current >= minEcts
            ? `Requirement Met (${current}/${minEcts}).`
            : `Need ${minEcts - current} more ECTS.`,
      };
    },
  };
};

export const createStandardLoadRule = (id: string, level: number, target: number = 22): Rule => {
  return {
    id,
    title: 'On Track',
    description: `Reach a solid semester load of ${target} ECTS.`,
    category: 'Goal',
    level,
    priority: 40,
    scoreReward: 350 + level * 50,
    stressModifier: -15,
    validate: (ctx) => {
      const current = ctx.metadata.currentSemesterEcts;
      return {
        satisfied: current >= target,
        message:
          current >= target
            ? 'Good semester load achieved.'
            : `Aim for ${target} ECTS to stay on track (${current}/${target}).`,
      };
    },
  };
};

export const noGaps = (
  title: string,
  description: string,
  category: 'Goal' | 'Mandatory',
  scoreReward: number,
  stressModifier: number,
  gap: number,
  level: number
): Rule => {
  return {
    id: level.toString() + 'noGaps',
    title,
    description,
    category,
    priority: 80,
    level,
    scoreReward,
    stressModifier,
    validate: (context) => {
      const hasHugeGap = context.metadata.maxGapInAnyDay > gap;
      return {
        satisfied: !hasHugeGap && context.coursesSelected.length > 0,
        message: !hasHugeGap ? 'Schedule is compact.' : `Long gaps detected (>${gap}h).`,
      };
    },
  };
};

export const createMaxContactHoursRule = (
  id: string,
  maxHours: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  scoreReward?: number,
  stressModifier?: number
): Rule => {
  return {
    id,
    title: 'Ghost Mode',
    description: `Spend less than ${maxHours} hours on campus per week.`,
    category,
    level,
    priority: 50,
    scoreReward,
    stressModifier,
    validate: (ctx) => {
      const hours = ctx.metadata.totalContactHours;
      return {
        satisfied: hours < maxHours && hours > 0,
        message:
          hours < maxHours
            ? `Schedule light: ${hours}h / ${maxHours}h limit.`
            : `Too much campus time! (${hours}h).`,
      };
    },
  };
};

export const createTagDiversityRule = (
  id: string,
  minUniqueTags: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal'
): Rule => {
  return {
    id,
    title: 'Renaissance Student',
    description: `Select courses from at least ${minUniqueTags} different tags.`,
    category,
    level,
    priority: 60,
    scoreReward: 400,
    stressModifier: -5,
    validate: (ctx) => {
      const uniqueTags = new Set<string>();
      ctx.coursesSelected.forEach((c) => c.tags.forEach((t) => uniqueTags.add(t)));
      return {
        satisfied: uniqueTags.size >= minUniqueTags,
        message:
          uniqueTags.size >= minUniqueTags
            ? `Diversity achieved! (${uniqueTags.size} tags).`
            : `Expand your horizons! You have ${uniqueTags.size}/${minUniqueTags} unique tags.`,
      };
    },
  };
};

export const createTagSynergyRule = (
  id: string,
  primaryTag: string,
  requiredTag: string,
  level: number
): Rule => {
  return {
    id,
    title: `${primaryTag} + ${requiredTag} Synergy`,
    description: `If you choose ${primaryTag}, you must also take a ${requiredTag} course.`,
    category: 'Mandatory',
    level,
    priority: 120,
    validate: (ctx) => {
      const hasPrimary = hasCourseWithTag(ctx, primaryTag);
      const hasRequired = hasCourseWithTag(ctx, requiredTag);
      const satisfied = !hasPrimary || hasRequired;
      return {
        satisfied,
        severity: 'warning',
        message: satisfied
          ? 'Synergy requirements met.'
          : `You cannot do ${primaryTag} without ${requiredTag}!`,
      };
    },
  };
};

export const createTagBanRule = (
  id: string,
  bannedTag: string,
  level: number,
  category: 'Mandatory' | 'Goal',
  scoreReward?: number,
  stressModifier?: number
): Rule => {
  return {
    id,
    title: `Anti-${bannedTag}`,
    description: `Do not take any "${bannedTag}" courses.`,
    category,
    scoreReward,
    stressModifier,
    level,
    priority: 70,
    validate: (ctx) => {
      const hasBanned = hasCourseWithTag(ctx, bannedTag);
      return {
        satisfied: !hasBanned && ctx.coursesSelected.length > 0,
        message: !hasBanned
          ? `Clean schedule. No ${bannedTag}.`
          : `Failed! Remove the ${bannedTag} course.`,
      };
    },
  };
};

export const createTagSpecialistRule = (
  id: string,
  tag: string,
  minEcts: number,
  level: number,
  title?: string,
  description?: string
): Rule => {
  return {
    id,
    title: title ?? `${tag} Specialist`,
    description: description ?? `Gain at least ${minEcts} ECTS in ${tag}.`,
    category: 'Mandatory',
    level,
    priority: 110,
    validate: (ctx) => {
      const current = ctx.metadata.ectsByTag[tag] || 0;
      return {
        satisfied: current >= minEcts,
        severity: 'error',
        message:
          current >= minEcts
            ? `${tag} requirement met (${current} ECTS).`
            : `Need more ${tag} credits (${current}/${minEcts}).`,
      };
    },
  };
};

export const createMinNameLengthRule = (id: string, minLength: number, level: number): Rule => {
  return {
    id,
    title: 'Academic Rigor',
    description: `No short names allowed. All course names must be at least ${minLength} characters long.`,
    category: 'Goal',
    level,
    priority: 55,
    scoreReward: 300,
    stressModifier: 10,
    validate: (ctx) => {
      const violations = ctx.coursesSelected.filter((c) => c.name.length < minLength);
      return {
        satisfied: violations.length === 0,
        message:
          violations.length === 0
            ? 'All names are sufficiently complex.'
            : `Too simple: ${violations.map((c) => c.name).join(', ')}.`,
      };
    },
  };
};

export const createVowelCountRule = (id: string, divisor: number, level: number): Rule => {
  return {
    id,
    title: 'Vowel Harmony',
    description: `The total number of vowels (A, E, I, O, U) in your course names must be divisible by ${divisor}.`,
    category: 'Goal',
    level,
    priority: 60,
    scoreReward: 800,
    stressModifier: 5,
    validate: (ctx) => {
      const vowels = /[aeiou]/gi;
      let count = 0;
      ctx.coursesSelected.forEach((c) => {
        const matches = c.name.match(vowels);
        if (matches) count += matches.length;
      });
      const rem = count % divisor;
      return {
        satisfied: rem === 0 && count > 0,
        message:
          rem === 0
            ? `Perfect harmony (${count} vowels).`
            : `Total vowels: ${count}. Remainder: ${rem}. Need ${divisor - rem} more (or fewer).`,
      };
    },
  };
};

export const createOddStartTimesRule = (
  id: string,
  level: number,
  scoreReward?: number,
  stressModifier?: number
): Rule => {
  return {
    id,
    title: 'Odd Hours Only',
    description: 'Every single class must start on an odd hour (e.g. 9:00, 11:00, 13:00...).',
    category: 'Goal',
    level,
    priority: 50,
    scoreReward,
    stressModifier,
    validate: (ctx) => {
      const evenStarts = ctx.schedule.filter((s) => s.startTime % 2 === 0);
      return {
        satisfied: evenStarts.length === 0 && ctx.coursesSelected.length > 0,
        message:
          evenStarts.length === 0
            ? 'All courses start on odd hours.'
            : `${evenStarts.length} classes start on even hours (e.g., 8:00, 10:00). Forbidden.`,
      };
    },
  };
};
