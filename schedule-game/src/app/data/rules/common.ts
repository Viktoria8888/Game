import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import { SUBJECTS } from '../subjects';

export const hasCourseWithTag = (ctx: ValidationContext, tag: string) =>
  ctx.coursesSelected.some((c) => c.tags?.includes(tag as any));

export const countCoursesByType = (ctx: ValidationContext, type: string) =>
  ctx.coursesSelected.filter((c) => c.type === type).length;

export const getPassedCourseSubjectIds = (ctx: ValidationContext): Set<string> => {
  const ids = new Set<string>();
  ctx.history.forEach((sem) => sem.coursesTaken.forEach((id) => ids.add(id)));
  return ids;
};

const resolveMessage = (
  satisfied: boolean,
  customMessages: [string, string] | undefined,
  defaultSuccess: string,
  defaultFail: string
) => {
  if (customMessages) {
    return satisfied ? customMessages[0] : customMessages[1];
  }
  return satisfied ? defaultSuccess : defaultFail;
};

export const createCumulativeProgressRule = (
  id: string,
  minTotalEcts: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Academic Progress',
    description: `You must have earned a total of ${minTotalEcts} ECTS by the end of this semester.`,
    category,
    level,
    priority: 200,
    solverHint: {
      type: 'MIN_TOTAL_ECTS',
      value: minTotalEcts,
    },
    validate: (ctx) => {
      const pastEcts = ctx.history.reduce((sum, h) => sum + h.ectsEarned, 0);
      const currentEcts = ctx.metadata.currentSemesterEcts;
      const total = pastEcts + currentEcts;
      const satisfied = total >= minTotalEcts;

      return {
        satisfied,
        severity: 'error',
        message: resolveMessage(
          satisfied,
          messages,
          `On track! Total ECTS: ${total}/${minTotalEcts}.`,
          `ACADEMIC DEBT! You are behind. Total: ${total}/${minTotalEcts}. You need ${
            minTotalEcts - total
          } more points.`
        ),
      };
    },
  };
};

export const mandatorySubjectForLevel = (
  id: string,
  level: number,
  requiredSubjectIds: string[],
  scoreReward?: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
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
    category,
    priority: 200,
    level,
    scoreReward,
    solverHint: {
      type: 'REQUIRED_SUBJECTS',
      value: requiredSubjectIds,
    },
    validate: (context: ValidationContext) => {
      const selectedIds = new Set(context.coursesSelected.map((c) => c.subjectId));
      const passedIds = getPassedCourseSubjectIds(context);
      const missingIds = requiredSubjectIds.filter(
        (reqSubId) => !selectedIds.has(reqSubId) && !passedIds.has(reqSubId)
      );
      const satisfied = missingIds.length === 0;

      return {
        satisfied,
        severity: 'error',
        message: resolveMessage(
          satisfied,
          messages,
          'All mandatory subjects selected.',
          `Missing required subjects.`
        ),
      };
    },
  };
};

export const createMinEctsRule = (
  id: string,
  minEcts: number,
  level: number | null = null,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Minimum ECTS',
    description: `Minimum ${minEcts} ECTS required.`,
    category,
    level,
    priority: 1,
    solverHint: {
      type: 'MIN_ECTS',
      value: minEcts,
    },
    validate: (context) => {
      const current = context.metadata.currentSemesterEcts;
      const satisfied = current >= minEcts;
      return {
        satisfied,
        severity: 'error',
        message: resolveMessage(
          satisfied,
          messages,
          `Requirement Met (${current}/${minEcts}).`,
          `Need ${minEcts - current} more ECTS.`
        ),
      };
    },
  };
};

export const createStandardLoadRule = (
  id: string,
  level: number,
  target: number = 22,
  category: 'Mandatory' | 'Goal' = 'Goal',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'On Track',
    description: `Reach a solid semester load of ${target} ECTS.`,
    category,
    level,
    priority: 40,
    scoreReward: 350 + level * 50,
    stressModifier: -15,
    solverHint: {
      type: 'MIN_ECTS',
      value: target,
    },
    validate: (ctx) => {
      const current = ctx.metadata.currentSemesterEcts;
      const satisfied = current >= target;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'Good semester load achieved.',
          `Aim for ${target} ECTS to stay on track (${current}/${target}).`
        ),
      };
    },
  };
};

export const createNoGapsRule = (
  id: string,
  gap: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  scoreReward: number = 0,
  stressModifier: number = 0,
  messages?: [string, string],
  titleOverride?: string,
  descOverride?: string
): Rule => {
  return {
    id,
    title: titleOverride ?? 'Compact Schedule',
    description: descOverride ?? `Avoid gaps larger than ${gap}h between classes.`,
    category,
    priority: 80,
    level,
    scoreReward,
    stressModifier,
    solverHint: {
      type: 'NO_GAPS',
      value: gap,
    },
    validate: (context) => {
      const hasHugeGap = context.metadata.maxGapInAnyDay > gap;
      const satisfied = !hasHugeGap && context.coursesSelected.length > 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'Schedule is compact.',
          `Long gaps detected (>${gap}h).`
        ),
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
  stressModifier?: number,
  messages?: [string, string]
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
    solverHint: {
      type: 'MAX_CONTACT_HOURS',
      value: maxHours,
    },
    validate: (ctx) => {
      const hours = ctx.metadata.totalContactHours;
      const satisfied = hours < maxHours && hours > 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Schedule light: ${hours}h / ${maxHours}h limit.`,
          `Too much campus time! (${hours}h).`
        ),
      };
    },
  };
};

export const createTagDiversityRule = (
  id: string,
  minUniqueTags: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  messages?: [string, string]
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
    solverHint: {
      type: 'TAG_DIVERSITY',
      value: minUniqueTags,
    },
    validate: (ctx) => {
      const uniqueTags = new Set<string>();
      ctx.coursesSelected.forEach((c) => c.tags.forEach((t) => uniqueTags.add(t)));
      const satisfied = uniqueTags.size >= minUniqueTags;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Diversity achieved! (${uniqueTags.size} tags).`,
          `Expand your horizons! You have ${uniqueTags.size}/${minUniqueTags} unique tags.`
        ),
      };
    },
  };
};

export const createTagSynergyRule = (
  id: string,
  primaryTag: string,
  requiredTag: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: `${primaryTag} + ${requiredTag} Synergy`,
    description: `If you choose ${primaryTag}, you must also take a ${requiredTag} course.`,
    category,
    level,
    priority: 120,
    solverHint: {
      type: 'TAG_SYNERGY',
      value: { primary: primaryTag, required: requiredTag },
    },
    validate: (ctx) => {
      const hasPrimary = hasCourseWithTag(ctx, primaryTag);
      const hasRequired = hasCourseWithTag(ctx, requiredTag);
      const satisfied = !hasPrimary || hasRequired;
      return {
        satisfied,
        severity: 'warning',
        message: resolveMessage(
          satisfied,
          messages,
          'Synergy requirements met.',
          `You cannot do ${primaryTag} without ${requiredTag}!`
        ),
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
  stressModifier?: number,
  messages?: [string, string]
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
    solverHint: {
      type: 'BAN_TAG',
      value: bannedTag,
    },
    validate: (ctx) => {
      const hasBanned = hasCourseWithTag(ctx, bannedTag);
      const satisfied = !hasBanned && ctx.coursesSelected.length > 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Clean schedule. No ${bannedTag}.`,
          `Failed! Remove the ${bannedTag} course.`
        ),
      };
    },
  };
};

export const createTagSpecialistRule = (
  id: string,
  tag: string,
  minEcts: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string],
  title?: string,
  description?: string
): Rule => {
  return {
    id,
    title: title ?? `${tag} Specialist`,
    description: description ?? `Gain at least ${minEcts} ECTS in ${tag}.`,
    category,
    level,
    priority: 110,
    solverHint: {
      type: 'TAG_SPECIALIST',
      value: { tag, minEcts },
    },
    validate: (ctx) => {
      const current = ctx.metadata.ectsByTag[tag] || 0;
      const satisfied = current >= minEcts;
      return {
        satisfied,
        severity: 'error',
        message: resolveMessage(
          satisfied,
          messages,
          `${tag} requirement met (${current} ECTS).`,
          `Need more ${tag} credits (${current}/${minEcts}).`
        ),
      };
    },
  };
};

export const createMinNameLengthRule = (
  id: string,
  minLength: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Academic Rigor',
    description: `No short names allowed. All course names must be at least ${minLength} characters long.`,
    category,
    level,
    priority: 55,
    scoreReward: 300,
    stressModifier: 10,
    solverHint: {
      type: 'NAME_LENGTH',
      value: minLength,
    },
    validate: (ctx) => {
      const violations = ctx.coursesSelected.filter((c) => c.name.length < minLength);
      const satisfied = violations.length === 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'All names are sufficiently complex.',
          `Too simple: ${violations.map((c) => c.name).join(', ')}.`
        ),
      };
    },
  };
};

export const createVowelCountRule = (
  id: string,
  divisor: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Vowel Harmony',
    description: `The total number of vowels (A, E, I, O, U) in your course names must be divisible by ${divisor}.`,
    category,
    level,
    priority: 60,
    scoreReward: 800,
    stressModifier: 5,
    solverHint: {
      type: 'VOWEL_COUNT',
      value: divisor,
    },
    validate: (ctx) => {
      const vowels = /[aeiou]/gi;
      let count = 0;
      ctx.coursesSelected.forEach((c) => {
        const matches = c.name.match(vowels);
        if (matches) count += matches.length;
      });
      const rem = count % divisor;
      const satisfied = rem === 0 && count > 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Perfect harmony (${count} vowels).`,
          `Total vowels: ${count}. Remainder: ${rem}. Need ${divisor - rem} more (or fewer).`
        ),
      };
    },
  };
};

export const createOddStartTimesRule = (
  id: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  scoreReward?: number,
  stressModifier?: number,
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Odd Hours Only',
    description: 'Every single class must start on an odd hour (e.g. 9:00, 11:00, 13:00...).',
    category,
    level,
    priority: 50,
    scoreReward,
    stressModifier,
    solverHint: {
      type: 'ODD_HOURS',
      value: true,
    },
    validate: (ctx) => {
      const evenStarts = ctx.schedule.filter((s) => s.startTime % 2 === 0);
      const satisfied = evenStarts.length === 0 && ctx.coursesSelected.length > 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'All courses start on odd hours.',
          `${evenStarts.length} classes start on even hours (e.g., 8:00, 10:00). Forbidden.`
        ),
      };
    },
  };
};

export const createBanTimeSlots = (
  id: string,
  level: number,
  start: number,
  end: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Mandatory Lunch',
    description: `Keep ${start}:00-${end}:00 free on class days.`,
    category,
    level,
    priority: 90,
    stressModifier: -15,
    solverHint: {
      type: 'BAN_TIME_SLOTS',
      value: [start, end],
    },
    validate: (ctx) => {
      const violations: string[] = [];
      const days = new Set(ctx.schedule.map((s) => s.day));
      days.forEach((day) => {
        const slots = ctx.schedule.filter((s) => s.day === day);
        if (slots.some((s) => s.startTime >= start && s.startTime < end)) {
          violations.push(day);
        }
      });
      const satisfied = violations.length === 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'Lunch secured.',
          `Starving on: ${violations.join(', ')}.`
        ),
      };
    },
  };
};

export const createPrerequisiteRule = (
  id: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Prerequisites',
    description: 'Pass prerequisite courses before taking advanced ones.',
    category,
    level,
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
      const satisfied = violations.length === 0;

      return {
        satisfied,
        severity: 'error',
        message: resolveMessage(
          satisfied,
          messages,
          'Prerequisites met.',
          `Prerequisite violations:\n• ${violations.join('\n• ')}`
        ),
      };
    },
  };
};

export const createNoEarlyMorningRule = (
  id: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  hour: number = 10,
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Vampire Mode',
    description: `No classes before ${hour}:00.`,
    category,
    priority: 50,
    level,
    scoreReward: 400,
    stressModifier: -20,
    solverHint: {
      type: 'MIN_START_HOUR',
      value: 10,
    },
    validate: (ctx) => {
      const early = ctx.schedule.filter((s) => s.startTime < hour).length;
      const satisfied = early === 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'Beauty sleep preserved.',
          `${early} early morning classes!`
        ),
      };
    },
  };
};

export const createMaxDailyHoursRule = (
  id: string,
  level: number,
  limit: number = 6,
  category: 'Mandatory' | 'Goal' = 'Goal',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Daily Limit',
    description: `No single day should have more than ${limit} contact hours.`,
    category,
    priority: 45,
    level,
    scoreReward: 250,
    stressModifier: -5,
    solverHint: {
      type: 'MAX_DAILY_HOURS',
      value: limit,
    },
    validate: (ctx) => {
      const hoursByDay = new Map<string, number>();
      ctx.schedule.forEach((s) => {
        hoursByDay.set(s.day, (hoursByDay.get(s.day) || 0) + 1);
      });
      const maxDay = Math.max(...Array.from(hoursByDay.values()), 0);
      const satisfied = maxDay <= limit;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          'Reasonable daily schedule.',
          `${maxDay} hours in one day is brutal!`
        ),
      };
    },
  };
};

export const createTagRequirementRule = (
  id: string,
  tag: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: `${tag} Requirement`,
    description: `You must include at least one course with the "${tag}" tag.`,
    category,
    level,
    priority: 100,
    solverHint: {
      type: 'TAG_REQUIREMENT',
      value: tag,
    },
    validate: (ctx) => {
      const hasIt = hasCourseWithTag(ctx, tag);
      return {
        satisfied: hasIt,
        severity: category === 'Mandatory' ? 'error' : 'warning',
        message: resolveMessage(
          hasIt,
          messages,
          `${tag} requirement met.`,
          `You are missing a ${tag} course!`
        ),
      };
    },
  };
};

export const createMutuallyExclusiveTagsRule = (
  id: string,
  tag1: string,
  tag2: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Department Rivalry',
    description: `Do not mix ${tag1} and ${tag2} courses (Civil War!).`,
    category,
    level,
    priority: 130,
    solverHint: {
      type: 'MUTUALLY_EXCLUSIVE_TAGS',
      value: [tag1, tag2],
    },
    validate: (ctx) => {
      const has1 = hasCourseWithTag(ctx, tag1);
      const has2 = hasCourseWithTag(ctx, tag2);
      const conflict = has1 && has2;
      return {
        satisfied: !conflict,
        severity: 'error',
        message: resolveMessage(
          !conflict,
          messages,
          'Loyalty preserved.',
          `Conflict! Pick either ${tag1} or ${tag2}.`
        ),
      };
    },
  };
};

export const createFreeDayRule = (
  id: string,
  day: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  scoreReward: number = 600,
  stressModifier: number = -25,
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Long Weekend',
    description: `Keep ${day} completely free.`,
    category,
    level,
    priority: 55,
    scoreReward,
    stressModifier,
    solverHint: {
      type: 'BAN_DAYS',
      value: [day],
    },
    validate: (ctx) => {
      const busy = ctx.schedule.filter((s) => s.day === day).length;
      const satisfied = busy === 0;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Day off secured! (${day})`,
          `${day} is not free.`
        ),
      };
    },
  };
};

export const createPrimeEctsRule = (
  id: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  scoreReward: number = 1000,
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Prime ECTS',
    description: 'Total ECTS must be a Prime Number.',
    category,
    level,
    priority: 55,
    scoreReward,
    solverHint: { type: 'FORCE_PRIME_ECTS', value: true },
    validate: (ctx) => {
      const n = ctx.metadata.currentSemesterEcts;
      const isPrime = (num: number) => {
        for (let i = 2, s = Math.sqrt(num); i <= s; i++) if (num % i === 0) return false;
        return num > 1;
      };
      const satisfied = isPrime(n);
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Prime (${n})!`,
          `${n} is not prime. Change your points.`
        ),
      };
    },
  };
};

export const createPalindromeHoursRule = (
  id: string,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Goal',
  scoreReward: number = 1000,
  stressModifier: number = -10,
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Palindrome Schedule',
    description: 'Total contact hours must be a palindrome (11, 22, 33...).',
    category,
    level,
    priority: 55,
    scoreReward,
    stressModifier,
    solverHint: { type: 'FORCE_PALINDROME_HOURS', value: true },
    validate: (ctx) => {
      const hours = ctx.metadata.totalContactHours;
      const isPalindrome = hours.toString() === hours.toString().split('').reverse().join('');
      return {
        satisfied: isPalindrome,
        message: resolveMessage(
          isPalindrome,
          messages,
          `${hours} hours - palindrome!`,
          `${hours} hours is not a palindrome.`
        ),
      };
    },
  };
};

export const createMinFreeDaysRule = (
  id: string,
  minFreeDays: number,
  level: number,
  category: 'Mandatory' | 'Goal' = 'Mandatory',
  messages?: [string, string]
): Rule => {
  return {
    id,
    title: 'Internship / Free Days',
    description: `Keep at least ${minFreeDays} full days completely free.`,
    category,
    level,
    priority: 100,
    solverHint: {
      type: 'MIN_FREE_DAYS',
      value: minFreeDays,
    },
    validate: (ctx) => {
      const free = ctx.metadata.freeDaysCount;
      const satisfied = free >= minFreeDays;
      return {
        satisfied,
        message: resolveMessage(
          satisfied,
          messages,
          `Free days: ${free}/${minFreeDays}.`,
          `Need ${minFreeDays - free} more free days.`
        ),
      };
    },
  };
};
