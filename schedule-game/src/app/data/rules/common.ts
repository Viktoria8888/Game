import { Course } from '../../core/models/course.interface';
import { Rule, ValidationContext } from '../../core/models/rules.interface';
import { COURSES } from '../courses';
import { SUBJECTS } from '../subjects';

export interface RuleConfig {
  id: string;
  level: number | null;
  category?: 'Mandatory' | 'Goal';
  scoreReward?: number;
  stressModifier?: number;
  messages?: [string, string];
  title?: string;
  description?: string;
  priority?: number;
}

export const hasCourseWithTag = (ctx: ValidationContext, tag: string) =>
  ctx.coursesSelected.some((c) => c.tags?.includes(tag as any));

export const countCoursesByType = (ctx: ValidationContext, type: string) =>
  ctx.coursesSelected.filter((c) => c.type === type).length;

export const getPassedCourseSubjectIds = (ctx: ValidationContext): Set<string> => {
  const ids = new Set<string>();
  ctx.history.forEach((sem) => sem.coursesTaken.forEach((id) => ids.add(id)));
  return ids;
};

export const getTotalEctsBySubject = (ctx: ValidationContext): Map<string, number> => {
  const ectsMap = new Map<string, number>();

  ctx.coursesSelected.forEach((course) => {
    const current = ectsMap.get(course.subjectId) || 0;
    ectsMap.set(course.subjectId, current + course.ects);
  });

  return ectsMap;
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

// ... [Keep other rules like createCumulativeProgressRule, mandatorySubjectForLevel, etc. unchanged] ...
export const createCumulativeProgressRule = (config: RuleConfig, minTotalEcts: number): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = category === 'Goal' ? 600 : 0,
    stressModifier = category === 'Goal' ? -15 : 0,
    messages,
    priority = 200,
  } = config;

  return {
    id,
    title: config.title ?? 'Academic Progress',
    description:
      config.description ??
      `You must have earned a total of ${minTotalEcts} ECTS by the end of this semester.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MIN_TOTAL_ECTS', value: minTotalEcts },
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
  config: RuleConfig,
  requiredSubjectIds: string[]
): Rule => {
  const { id, level, category = 'Mandatory', scoreReward = 0, priority = 200, messages } = config;

  const requiredNames = COURSES.filter(
    (course) => requiredSubjectIds.includes(course.subjectId) && course.type == 'Lecture'
  )
    .map((c) => c.name)
    .join(', ');

  return {
    id,
    title: config.title ?? 'Mandatory Subjects',
    description: config.description ?? `Required subjects: ${requiredNames}.`,
    category,
    priority,
    level,
    scoreReward,
    solverHint: { type: 'REQUIRED_SUBJECTS', value: requiredSubjectIds },
    validate: (context) => {
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

export const createMinEctsRule = (config: RuleConfig, minEcts: number): Rule => {
  const { id, level, category = 'Mandatory', priority = 1, messages } = config;
  return {
    id,
    title: config.title ?? 'Minimum ECTS',
    description: config.description ?? `Minimum ${minEcts} ECTS required.`,
    category,
    level,
    priority,
    solverHint: { type: 'MIN_ECTS', value: minEcts },
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

export const createStandardLoadRule = (config: RuleConfig, target: number = 22): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 350 + (level || 0) * 50,
    stressModifier = -15,
    priority = 40,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'On Track',
    description: config.description ?? `Reach a solid semester load of ${target} ECTS.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MIN_ECTS', value: target },
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

export const createNoGapsRule = (config: RuleConfig, gap: number): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 0,
    stressModifier = 0,
    priority = 80,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Compact Schedule',
    description: config.description ?? `Avoid gaps larger than ${gap}h between classes.`,
    category,
    priority,
    level,
    scoreReward,
    stressModifier,
    solverHint: { type: 'NO_GAPS', value: gap },
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

export const createMaxContactHoursRule = (config: RuleConfig, maxHours: number): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 500,
    stressModifier = -20,
    priority = 50,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Ghost Mode',
    description: config.description ?? `Spend less than ${maxHours} hours on campus per week.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MAX_CONTACT_HOURS', value: maxHours },
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

export const createTagDiversityRule = (config: RuleConfig, minUniqueTags: number): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 400,
    stressModifier = -5,
    priority = 60,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Renaissance Student',
    description:
      config.description ?? `Select courses from at least ${minUniqueTags} different tags.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'TAG_DIVERSITY', value: minUniqueTags },
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
  config: RuleConfig,
  primaryTag: string,
  requiredTag: string
): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = category === 'Goal' ? 400 : 0,
    stressModifier = category === 'Goal' ? -10 : 0,
    priority = 120,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? `${primaryTag} + ${requiredTag} Synergy`,
    description:
      config.description ??
      `If you choose ${primaryTag}, you must also take a ${requiredTag} course.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'TAG_SYNERGY', value: { primary: primaryTag, required: requiredTag } },
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

export const createTagBanRule = (config: RuleConfig, bannedTag: string): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward,
    stressModifier,
    priority = 70,
    messages,
  } = config;
  return {
    id,
    title: config.title ?? `Anti-${bannedTag}`,
    description: config.description ?? `Do not take any "${bannedTag}" courses.`,
    category,
    scoreReward,
    stressModifier,
    level,
    priority,
    solverHint: { type: 'BAN_TAG', value: bannedTag },
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

export const createTagSpecialistRule = (config: RuleConfig, tag: string, minEcts: number): Rule => {
  const { id, level, category = 'Mandatory', priority = 110, messages } = config;

  return {
    id,
    title: config.title ?? `${tag} Specialist`,
    description: config.description ?? `Gain at least ${minEcts} ECTS in ${tag}.`,
    category,
    level,
    priority,
    solverHint: { type: 'TAG_SPECIALIST', value: { tag, minEcts } },
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

export const createMinNameLengthRule = (config: RuleConfig, minLength: number): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 300,
    stressModifier = -10,
    priority = 55,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Academic Rigor',
    description:
      config.description ??
      `No short names allowed. All course names must be at least ${minLength} characters long.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'NAME_LENGTH', value: minLength },
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

export const createVowelCountRule = (config: RuleConfig, divisor: number): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 800,
    stressModifier = -15,
    priority = 60,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Vowel Harmony',
    description:
      config.description ??
      `The total number of vowels (A, E, I, O, U) in your course names must be divisible by ${divisor}.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'VOWEL_COUNT', value: divisor },
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

export const createOddStartTimesRule = (config: RuleConfig): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 1000,
    stressModifier = -10,
    priority = 50,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Odd Hours Only',
    description:
      config.description ??
      'Every single class must start on an odd hour (e.g. 9:00, 11:00, 13:00...).',
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'ODD_HOURS', value: true },
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

export const createBanTimeSlots = (config: RuleConfig, start: number, end: number): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    stressModifier = -15,
    priority = 90,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Mandatory Lunch',
    description: config.description ?? `Keep ${start}:00-${end}:00 free on class days.`,
    category,
    level,
    priority,
    stressModifier,
    solverHint: { type: 'BAN_TIME_SLOTS', value: [start, end] },
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

export const createPrerequisiteRule = (config: RuleConfig): Rule => {
  const { id, level, category = 'Mandatory', priority = 150, messages } = config;
  return {
    id,
    title: config.title ?? 'Prerequisites',
    description: config.description ?? 'Pass prerequisite courses before taking advanced ones.',
    category,
    level,
    priority,
    validate: (ctx) => {
      const passedIds = getPassedCourseSubjectIds(ctx);
      const currentSubjectIds = new Set(ctx.coursesSelected.map((c) => c.subjectId));
      const violations: string[] = [];

      const checkedSubjects = new Set<string>();

      ctx.coursesSelected.forEach((course) => {
        if (checkedSubjects.has(course.subjectId)) return;
        checkedSubjects.add(course.subjectId);

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

export const createNoEarlyMorningRule = (config: RuleConfig, hour: number = 10): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 400,
    stressModifier = -20,
    priority = 50,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Vampire Mode',
    description: config.description ?? `No classes before ${hour}:00.`,
    category,
    priority,
    level,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MIN_START_HOUR', value: 10 },
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

export const createMaxDailyHoursRule = (config: RuleConfig, limit: number = 6): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 250,
    stressModifier = -5,
    priority = 45,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Daily Limit',
    description:
      config.description ?? `No single day should have more than ${limit} contact hours.`,
    category,
    priority,
    level,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MAX_DAILY_HOURS', value: limit },
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

export const createTagRequirementRule = (config: RuleConfig, tag: string): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = category === 'Goal' ? 300 : 0,
    stressModifier = category === 'Goal' ? -5 : 0,
    priority = 100,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? `${tag} Requirement`,
    description:
      config.description ?? `You must include at least one course with the "${tag}" tag.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'TAG_REQUIREMENT', value: tag },
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
  config: RuleConfig,
  tag1: string,
  tag2: string
): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = category === 'Goal' ? 500 : 0,
    stressModifier = category === 'Goal' ? -10 : 0,
    priority = 130,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Department Rivalry',
    description: config.description ?? `Do not mix ${tag1} and ${tag2} courses (Civil War!).`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MUTUALLY_EXCLUSIVE_TAGS', value: [tag1, tag2] },
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

export const createFreeDayRule = (config: RuleConfig, day: string): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = 600,
    stressModifier = -25,
    priority = 55,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Long Weekend',
    description: config.description ?? `Keep ${day} completely free.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'BAN_DAYS', value: [day] },
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

export const createPrimeEctsRule = (config: RuleConfig): Rule => {
  const { id, level, category = 'Goal', scoreReward = 1000, priority = 55, messages } = config;

  return {
    id,
    title: config.title ?? 'Prime ECTS',
    description: config.description ?? 'Total ECTS must be a Prime Number.',
    category,
    level,
    priority,
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

export const createPalindromeHoursRule = (config: RuleConfig): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 1000,
    stressModifier = -10,
    priority = 55,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Palindrome Schedule',
    description: config.description ?? 'Total contact hours must be a palindrome (11, 22, 33...).',
    category,
    level,
    priority,
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

export const createMinFreeDaysRule = (config: RuleConfig, minFreeDays: number): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = category === 'Goal' ? 1000 : 0,
    stressModifier = category === 'Goal' ? -30 : 0,
    priority = 100,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Internship / Free Days',
    description: config.description ?? `Keep at least ${minFreeDays} full days completely free.`,
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    solverHint: { type: 'MIN_FREE_DAYS', value: minFreeDays },
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

// Ignores duplicate subjects so Lecture->Lab doesn't break the chain
export const createWordChainRule = (config: RuleConfig): Rule => {
  const {
    id,
    level,
    category = 'Mandatory',
    scoreReward = 1500,
    stressModifier = -25,
    priority = 60,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'Word Chain',
    description:
      config.description ??
      'The last letter of a course name must match the first letter of the next course (chronologically).',
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    validate: (ctx) => {
      const sortedSlots = [...ctx.schedule].sort((a, b) => {
        const days = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4 };
        if (days[a.day] !== days[b.day]) return days[a.day] - days[b.day];
        return a.startTime - b.startTime;
      });

      const orderedCourses: Course[] = [];
      const seenSubjects = new Set<string>(); // CHANGED: Track subjects, not course IDs

      sortedSlots.forEach((slot) => {
        if (slot.course && !seenSubjects.has(slot.course.subjectId)) {
          orderedCourses.push(slot.course);
          seenSubjects.add(slot.course.subjectId);
        }
      });

      if (orderedCourses.length < 2)
        return { satisfied: true, message: 'Chain valid (too few courses).' };

      let brokenLink = '';
      for (let i = 0; i < orderedCourses.length - 1; i++) {
        const curr = orderedCourses[i].name.trim().toLowerCase();
        const next = orderedCourses[i + 1].name.trim().toLowerCase();

        if (curr[curr.length - 1] !== next[0]) {
          brokenLink = `${orderedCourses[i].name} ends with '${
            curr[curr.length - 1]
          }', but next starts with '${next[0]}'`;
          break;
        }
      }

      return {
        satisfied: !brokenLink,
        message: !brokenLink ? 'Chain linked successfully!' : `Chain Broken: ${brokenLink}`,
      };
    },
  };
};

export const createForbiddenLetterRule = (config: RuleConfig, forbiddenChar: string): Rule => {
  const { id, level, category = 'Mandatory', scoreReward = 3000, priority = 90, messages } = config;

  return {
    id,
    title: config.title ?? `The Curse of '${forbiddenChar.toUpperCase()}'`,
    description:
      config.description ??
      `Course names must NOT contain the letter '${forbiddenChar.toUpperCase()}'.`,
    category,
    level,
    priority,
    scoreReward,
    validate: (ctx) => {
      const violations = ctx.coursesSelected
        .filter((c) => c.name.toLowerCase().includes(forbiddenChar.toLowerCase()))
        .map((c) => c.name);

      return {
        satisfied: violations.length === 0,
        message:
          violations.length === 0
            ? `No '${forbiddenChar.toUpperCase()}' found. Safe.`
            : `Forbidden letter found in: ${violations.slice(0, 2).join(', ')}...`,
      };
    },
  };
};

export const createTypeSegregationRule = (
  config: RuleConfig,
  typeA: string,
  typeB: string
): Rule => {
  const { id, level, category = 'Mandatory', priority = 70, messages } = config;

  return {
    id,
    title: config.title ?? `${typeA} vs ${typeB}`,
    description:
      config.description ??
      `${typeA}s cannot be immediately followed by ${typeB}s (1hr gap required).`,
    category,
    level,
    priority,
    validate: (ctx) => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      let violation = '';

      for (const day of days) {
        const slots = ctx.schedule
          .filter((s) => s.day === day)
          .sort((a, b) => a.startTime - b.startTime);

        for (let i = 0; i < slots.length - 1; i++) {
          const curr = slots[i].course;
          const next = slots[i + 1].course;

          if (curr && next && slots[i].startTime + 1 === slots[i + 1].startTime) {
            if (curr.type === typeA && next.type === typeB) {
              violation = `${day} ${slots[i + 1].startTime}:00`;
              break;
            }
          }
        }
        if (violation) break;
      }

      return {
        satisfied: !violation,
        message: !violation
          ? 'Segregation maintained.'
          : `Conflict at ${violation}: ${typeA} touches ${typeB}!`,
      };
    },
  };
};

export const createStaircaseRule = (config: RuleConfig): Rule => {
  const {
    id,
    level,
    category = 'Goal',
    scoreReward = 2000,
    stressModifier = 15,
    priority = 80,
    messages,
  } = config;

  return {
    id,
    title: config.title ?? 'The Staircase',
    description:
      config.description ??
      'Classes on Tuesday must start later than Monday, Wednesday later than Tuesday, etc.',
    category,
    level,
    priority,
    scoreReward,
    stressModifier,
    validate: (ctx) => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      let previousStart = -1;
      let brokenDay = '';

      for (const day of days) {
        const daySlots = ctx.schedule.filter((s) => s.day === day);
        if (daySlots.length === 0) continue;

        const dayStart = Math.min(...daySlots.map((s) => s.startTime));

        if (dayStart <= previousStart) {
          brokenDay = day;
          break;
        }
        previousStart = dayStart;
      }

      return {
        satisfied: !brokenDay,
        message: !brokenDay
          ? 'Perfect ascending schedule.'
          : `Staircase broken on ${brokenDay}. Must start after ${previousStart}:00.`,
      };
    },
  };
};
