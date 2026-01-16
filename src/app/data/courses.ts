import seedrandom from 'seedrandom';
import { SUBJECTS } from './subjects';
import { Course, Day, SubjectDef } from '../core/models/course.interface';

export interface RNG {
  next(): number;
}

export class SeededRNG implements RNG {
  private rng: seedrandom.PRNG;

  constructor(seed: string) {
    this.rng = seedrandom(seed);
  }

  next(): number {
    return this.rng();
  }
}

type ReservedSlot = {
  day: Day;
  start: number;
  end: number;
  level?: number;
};

type OccupiedSlot = {
  day: Day;
  start: number;
  end: number;
};

export const RESERVED_COURSES: Record<string, number> = {
  '4077': 3, // DM
  '4140': 3, // ML
  '4239': 3, // PFAI
  '4070': 3,
  '4091': 3,
  '4084': 3,
  '3798': 3,

  '41199': 4,
  '4094': 4,
  '3791': 4,

  '4119': 5,
  '4127': 5,
  '4081': 5,
  '4133': 5,
  '4238': 5,
  '4092': 5,

  '3825': 6,
  '4118': 6,
  '4087': 6,

  // '3813': 7, // Scala
  // '4142': 7, // Automata
  // '4144': 7, // E A
  // '3834': 7, // Prolog
};

type GoldenSlot = { day: Day; startTime: number };

const GOLDEN_PATH: Record<string, GoldenSlot | GoldenSlot[]> = {
  '4077': { day: 'Mon', startTime: 8 },
  '4140': { day: 'Mon', startTime: 14 },

  '4239': { day: 'Tue', startTime: 10 },
  '4084': { day: 'Tue', startTime: 10 },

  '4070': { day: 'Wed', startTime: 13 },
  '3798': { day: 'Wed', startTime: 13 },

  '41199': [
    { day: 'Mon', startTime: 15 },
    { day: 'Wed', startTime: 15 },
  ],
  '4094': { day: 'Tue', startTime: 9 },
  '3791': { day: 'Thu', startTime: 15 },

  '4119': { day: 'Mon', startTime: 10 },
  '4127': { day: 'Tue', startTime: 10 },
  '4081': { day: 'Wed', startTime: 10 },
  '4133': { day: 'Thu', startTime: 10 },
  '4238': { day: 'Tue', startTime: 16 },
  '4092': { day: 'Fri', startTime: 14 },

  '3825': { day: 'Mon', startTime: 10 },
  '4118': { day: 'Mon', startTime: 16 },
  '4087': { day: 'Wed', startTime: 9 },

  '4096': { day: 'Wed', startTime: 8 },
  '4074': { day: 'Fri', startTime: 8 },
  '3785': { day: 'Fri', startTime: 12 },
};

const L3_MIN_STARTS: Record<Day, number> = {
  Mon: 8,
  Tue: 10,
  Wed: 13,
  Thu: 15,
  Fri: 17,
};

const L7_STAIRCASE_WINDOWS: Partial<Record<Day, { min: number; max: number }>> = {
  Tue: { min: 14, max: 20 },
  Wed: { min: 12, max: 17 },
  Thu: { min: 10, max: 15 },
  Fri: { min: 8, max: 12 },
};
function isValidTimeFornumber(day: Day, hour: number, duration: number, level?: number): boolean {
  if (level === 3 && hour < L3_MIN_STARTS[day]) return false;

  if (level === 4) {
    if (hour % 2 === 0) return false;
  }

  if (level === 7) {
    const window = L7_STAIRCASE_WINDOWS[day];
    if (!window) return false;
    if (hour < window.min || hour > window.max) return false;
  }
  return true;
}

class SchedulerContext {
  readonly DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  readonly START_HOUR = 8;
  readonly END_HOUR = 20;
  readonly rng: RNG;

  constructor(rng: RNG) {
    this.rng = rng;
  }

  private reserved: ReservedSlot[] = [];

  reserve(slot: ReservedSlot) {
    this.reserved.push(slot);
  }

  collides(day: Day, start: number, end: number, level?: number): boolean {
    return this.reserved.some((r) => {
      if (r.day !== day) return false;
      const overlap = !(start >= r.end || end <= r.start);
      if (!overlap) return false;

      if (level !== undefined && r.level !== undefined && level !== r.level) {
        return false;
      }
      return true;
    });
  }
}

function overlaps(day: Day, start: number, end: number, slots: OccupiedSlot[]): boolean {
  return slots.some((s) => s.day === day && !(start >= s.end || end <= s.start));
}

function isBlocked(
  start: number,
  duration: number,
  blocked?: { start: number; end: number }[]
): boolean {
  if (!blocked) return false;
  const end = start + duration;
  return blocked.some((b) => start < b.end && end > b.start);
}

function findSafeSlot(
  ctx: SchedulerContext,
  duration: number,
  blocked: { start: number; end: number }[] | undefined,
  occupied: OccupiedSlot[],
  level?: number
): { day: Day; startTime: number } | null {
  for (const day of ctx.DAYS) {
    for (let h = ctx.START_HOUR; h <= ctx.END_HOUR - duration; h++) {
      if (!isValidTimeFornumber(day, h, duration, level)) continue;
      if (isBlocked(h, duration, blocked)) continue;
      if (ctx.collides(day, h, h + duration, level)) continue;
      if (overlaps(day, h, h + duration, occupied)) continue;
      return { day, startTime: h };
    }
  }
  return null;
}

function findStackedSlot(
  ctx: SchedulerContext,
  day: Day,
  minStart: number,
  duration: number,
  blocked: { start: number; end: number }[] | undefined,
  occupied: OccupiedSlot[],
  level?: number
): { day: Day; startTime: number } | null {
  for (let h = minStart; h <= ctx.END_HOUR - duration; h++) {
    if (!isValidTimeFornumber(day, h, duration, level)) continue;
    if (isBlocked(h, duration, blocked)) continue;
    if (ctx.collides(day, h, h + duration, level)) continue;
    if (overlaps(day, h, h + duration, occupied)) continue;
    return { day, startTime: h };
  }
  return null;
}

function findRandomSlot(
  ctx: SchedulerContext,
  duration: number,
  blocked: { start: number; end: number }[] | undefined,
  occupied: OccupiedSlot[],
  level?: number
): { day: Day; startTime: number } {
  const day = ctx.DAYS[Math.floor(ctx.rng.next() * ctx.DAYS.length)];
  const maxStart = ctx.END_HOUR - duration;

  let attempts = 0;
  while (attempts < 50) {
    const startTime = Math.floor(ctx.rng.next() * (maxStart - ctx.START_HOUR + 1)) + ctx.START_HOUR;

    if (
      isValidTimeFornumber(day, startTime, duration, level) &&
      !isBlocked(startTime, duration, blocked) &&
      !overlaps(day, startTime, startTime + duration, occupied)
    ) {
      return { day, startTime };
    }
    attempts++;
  }

  return { day, startTime: ctx.START_HOUR };
}

export function generateCourses(rngProvider?: RNG): Course[] {
  const rng = rngProvider || new SeededRNG('my-stable-seed');
  const ctx = new SchedulerContext(rng);
  const courses: Course[] = [];

  SUBJECTS.forEach((subject: SubjectDef) => {
    const useGoldenPath =
      subject.scheduling?.useGoldenPath || subject.isFirstYearRecommended || subject.isMandatory;

    const blockedTimes = subject.scheduling?.blockedTimes;
    const level = RESERVED_COURSES[subject.id];

    const fixed = GOLDEN_PATH[subject.id];
    const fixedSlots = fixed ? (Array.isArray(fixed) ? fixed : [fixed]) : [];

    let fixedIndex = 0;
    let lastEnd = 0;

    const occupied: OccupiedSlot[] = [];

    subject.components.forEach((comp) => {
      const count = comp.count ?? 1;

      for (let i = 1; i <= count; i++) {
        let slot: { day: Day; startTime: number } | null = null;

        if (i === 1 && fixedSlots.length > 0) {
          if (fixedIndex < fixedSlots.length) {
            slot = fixedSlots[fixedIndex++];
            lastEnd = slot.startTime + comp.duration;

            ctx.reserve({
              day: slot.day,
              start: slot.startTime,
              end: lastEnd,
              level,
            });
          } else {
            slot = findStackedSlot(
              ctx,
              fixedSlots[0].day,
              lastEnd,
              comp.duration,
              blockedTimes,
              occupied,
              level
            );
          }
        } else if (i === 1 && useGoldenPath) {
          slot =
            findSafeSlot(ctx, comp.duration, blockedTimes, occupied, level) ??
            findRandomSlot(ctx, comp.duration, blockedTimes, occupied, level);
        } else {
          slot = findRandomSlot(ctx, comp.duration, blockedTimes, occupied, level);
        }

        if (!slot) {
          slot = findRandomSlot(ctx, comp.duration, blockedTimes, occupied, level);
        }

        ctx.reserve({
          day: slot.day,
          start: slot.startTime,
          end: slot.startTime + comp.duration,
          level,
        });

        occupied.push({
          day: slot.day,
          start: slot.startTime,
          end: slot.startTime + comp.duration,
        });

        courses.push({
          id: `${subject.id}-${comp.type}-${i}`,
          subjectId: subject.id,
          name: subject.name,
          ects: comp.ects,
          type: comp.type,
          tags: subject.tags,
          isMandatory: subject.isMandatory,
          hasExam: subject.hasExam,
          prerequisites: subject.prerequisites,
          schedule: {
            day: slot.day,
            startTime: slot.startTime,
            durationHours: comp.duration,
          },
          isFirstYearRecommended: subject.isFirstYearRecommended,
          isProseminar: comp.type === 'Seminar' || subject.name.includes('Proseminar'),
        });
      }
    });
  });

  return courses;
}
export const COURSES = generateCourses();
