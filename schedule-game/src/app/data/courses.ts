import seedrandom from 'seedrandom';
import { Course, Day } from '../core/models/course.interface';
import { SUBJECTS } from './subjects';

const rng = seedrandom('my-stable-seed');

// Prevents these courses from being taken early, ensuring they are available
// for the specific level
export const RESERVED_COURSES: Record<string, number> = {
  // Level 3:
  '4239': 3, // Probabilistic Foundations of AI (AI Path)
  '4070': 3, // Probability Theory (AI Path)
  '4091': 3, // Language Models
  '4107': 3, // Rust (OS Path)
  '4084': 3,

  // Level 4:
  '4094': 4, // Introduction to Linear Optimization (5 ECTS combo)
  '4074': 4, // Combinatorics (5 ECTS combo)
  '3785': 4, // Cryptography (5 ECTS combo)
  '3791': 4, // Ethics for Thinkers (2 ECTS filler)

  // Level 5:
  '4119': 5, // Functional Programming
  '4127': 5, // Graph Neural Networks (Renamed)
  '4081': 5, // Seminar: Generative AI
  '4133': 5, // Intro to Lambda Calculus
  '4238': 5, // Statistics with Linear Models
  '4092': 5, // Scheduling Theory

  // Level 6:
  '3825': 6, // Diploma Work
  '4118': 6, // Planar Graphs (Advanced)
  '4087': 6, // CUDA (Advanced)
};

export const COURSES = generateCourses();

function generateCourses(): Course[] {
  const gameCourses: Course[] = [];
  const goldenPathSlots: { day: Day; start: number; end: number }[] = [];

  const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const START_HOUR = 8;
  const END_HOUR = 20;

  const GOLDEN_PATH: Record<string, { day: Day; startTime: number }> = {
    // LEVEL 3: (AI vs OS)
    '4077': { day: 'Mon', startTime: 8 }, // Discrete Mathematics (Mandatory Base)
    '4239': { day: 'Tue', startTime: 12 }, // Probabilistic Foundations of AI
    '4070': { day: 'Wed', startTime: 12 }, // Probability Theory
    '4091': { day: 'Mon', startTime: 12 }, // Language Models
    '4084': { day: 'Tue', startTime: 14 }, // OS

    // LEVEL 4:
    '41199': { day: 'Mon', startTime: 8 }, // Algorithms & Data Structures (12 ECTS)
    '4094': { day: 'Tue', startTime: 8 }, // Intro to Linear Optimization (5 ECTS)
    '4074': { day: 'Wed', startTime: 8 }, // Combinatorics (5 ECTS)
    '3785': { day: 'Thu', startTime: 8 }, // Cryptography (5 ECTS)
    '3791': { day: 'Fri', startTime: 8 }, // Ethics for Thinkers (2 ECTS)

    // LEVEL 5:
    '4119': { day: 'Mon', startTime: 10 }, // Functional Programming (Lecture)
    '4127': { day: 'Tue', startTime: 10 }, // Graph Neural Networks (Seminar)
    '4081': { day: 'Tue', startTime: 12 }, // Seminar: Generative AI (Seminar)
    '4133': { day: 'Tue', startTime: 14 }, // Intro to Lambda (Lecture)

    '4238': { day: 'Wed', startTime: 10 }, // Statistics
    '4092': { day: 'Wed', startTime: 15 }, // Scheduling Theory (Lecture)

    // LEVEL   6
    // 1. Diploma Work
    '3825': { day: 'Mon', startTime: 10 },
    // 2. Planar Graphs
    '4118': { day: 'Mon', startTime: 16 },
    // 3. CUDA
    '4087': { day: 'Wed', startTime: 9 },
  };

  const isBlocked = (
    start: number,
    duration: number,
    blockedTimes?: { start: number; end: number }[]
  ): boolean => {
    if (!blockedTimes || blockedTimes.length === 0) return false;
    const end = start + duration;
    return blockedTimes.some((block) => start < block.end && end > block.start);
  };

  const checkCollision = (day: Day, start: number, end: number): boolean => {
    return goldenPathSlots.some(
      (reserved) => reserved.day === day && !(start >= reserved.end || end <= reserved.start)
    );
  };

  const checkSelfCollision = (
    day: Day,
    start: number,
    end: number,
    occupiedSlots: { day: Day; start: number; end: number }[]
  ): boolean => {
    return occupiedSlots.some(
      (slot) => slot.day === day && !(start >= slot.end || end <= slot.start)
    );
  };

  const getSafeSlot = (
    duration: number,
    blockedTimes: { start: number; end: number }[] | undefined,
    subjectOccupiedSlots: { day: Day; start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    for (const day of DAYS) {
      for (let hour = START_HOUR; hour <= END_HOUR - duration; hour++) {
        if (isBlocked(hour, duration, blockedTimes)) continue;
        if (
          !checkCollision(day, hour, hour + duration) &&
          !checkSelfCollision(day, hour, hour + duration, subjectOccupiedSlots)
        ) {
          goldenPathSlots.push({ day, start: hour, end: hour + duration });
          return { day, startTime: hour };
        }
      }
    }
    return getRandomSlot(duration, blockedTimes, subjectOccupiedSlots);
  };

  const getStackedSlot = (
    day: Day,
    minStartTime: number,
    duration: number,
    blockedTimes: { start: number; end: number }[] | undefined,
    subjectOccupiedSlots: { day: Day; start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    const gap = day === 'Mon' || day === 'Tue' ? 2 : 0;

    for (let hour = minStartTime + gap; hour <= END_HOUR - duration; hour++) {
      if (isBlocked(hour, duration, blockedTimes)) continue;
      if (
        !checkCollision(day, hour, hour + duration) &&
        !checkSelfCollision(day, hour, hour + duration, subjectOccupiedSlots)
      ) {
        goldenPathSlots.push({ day, start: hour, end: hour + duration });
        return { day, startTime: hour };
      }
    }
    return getProximateSlot(day, duration, blockedTimes, subjectOccupiedSlots);
  };

  // Strictly searches forward from the target day.
  const getProximateSlot = (
    targetDay: Day,
    duration: number,
    blockedTimes: { start: number; end: number }[] | undefined,
    subjectOccupiedSlots: { day: Day; start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    const startIdx = DAYS.indexOf(targetDay);

    for (let i = startIdx; i < DAYS.length; i++) {
      const day = DAYS[i];
      for (let hour = START_HOUR; hour <= END_HOUR - duration; hour++) {
        if (isBlocked(hour, duration, blockedTimes)) continue;
        if (
          !checkCollision(day, hour, hour + duration) &&
          !checkSelfCollision(day, hour, hour + duration, subjectOccupiedSlots)
        ) {
          return { day, startTime: hour };
        }
      }
    }

    // If stuck, search backwards from Friday to avoid early-week wrapping
    for (let i = DAYS.length - 1; i >= 0; i--) {
      const day = DAYS[i];
      for (let hour = START_HOUR; hour <= END_HOUR - duration; hour++) {
        if (isBlocked(hour, duration, blockedTimes)) continue;
        if (
          !checkCollision(day, hour, hour + duration) &&
          !checkSelfCollision(day, hour, hour + duration, subjectOccupiedSlots)
        ) {
          return { day, startTime: hour };
        }
      }
    }

    return getRandomSlot(duration, blockedTimes, subjectOccupiedSlots);
  };

  const getRandomSlot = (
    duration: number,
    blockedTimes: { start: number; end: number }[] | undefined,
    subjectOccupiedSlots: { day: Day; start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    const day = DAYS[Math.floor(rng() * DAYS.length)];
    const maxStart = END_HOUR - duration;
    let attempts = 0;
    while (attempts < 50) {
      const startTime = Math.floor(rng() * (maxStart - START_HOUR + 1) + START_HOUR);
      if (
        !isBlocked(startTime, duration, blockedTimes) &&
        !checkSelfCollision(day, startTime, startTime + duration, subjectOccupiedSlots)
      ) {
        return { day, startTime };
      }
      attempts++;
    }
    return { day, startTime: START_HOUR };
  };

  SUBJECTS.forEach((subject) => {
    const useGoldenPath =
      subject.scheduling?.useGoldenPath || subject.isFirstYearRecommended || subject.isMandatory;
    const blockedTimes = subject.scheduling?.blockedTimes;
    const fixedSlot = GOLDEN_PATH[subject.id];

    let fixedSlotUsed = false;
    let lastGoldenEndTime = 0;

    const subjectOccupiedSlots: { day: Day; start: number; end: number }[] = [];

    subject.components.forEach((comp) => {
      const groupsCount = comp.count || 1;

      for (let i = 1; i <= groupsCount; i++) {
        let schedule: { day: Day; startTime: number };

        if (fixedSlot) {
          if (i === 1 && !fixedSlotUsed) {
            schedule = fixedSlot;
            fixedSlotUsed = true;
            lastGoldenEndTime = fixedSlot.startTime + comp.duration;
            goldenPathSlots.push({
              day: fixedSlot.day,
              start: fixedSlot.startTime,
              end: lastGoldenEndTime,
            });
          } else if (i === 1) {
            schedule = getStackedSlot(
              fixedSlot.day,
              lastGoldenEndTime,
              comp.duration,
              blockedTimes,
              subjectOccupiedSlots
            );
            lastGoldenEndTime = schedule.startTime + comp.duration;
          } else {
            schedule = getProximateSlot(
              fixedSlot.day,
              comp.duration,
              blockedTimes,
              subjectOccupiedSlots
            );
          }
        } else if (useGoldenPath && i === 1) {
          schedule = getSafeSlot(comp.duration, blockedTimes, subjectOccupiedSlots);
        } else {
          schedule = getRandomSlot(comp.duration, blockedTimes, subjectOccupiedSlots);
        }
        subjectOccupiedSlots.push({
          day: schedule.day,
          start: schedule.startTime,
          end: schedule.startTime + comp.duration,
        });

        gameCourses.push({
          id: `${subject.id}-${comp.type}-${i}`,
          subjectId: subject.id,
          name: subject.name,
          type: comp.type,
          tags: subject.tags,
          isMandatory: subject.isMandatory,
          hasExam: subject.hasExam,
          prerequisites: subject.prerequisites || [],
          ects: comp.ects,
          schedule: {
            day: schedule.day,
            startTime: schedule.startTime,
            durationHours: comp.duration,
          },
          isFirstYearRecommended: subject.isFirstYearRecommended,
          isProseminar: comp.type === 'Seminar' || subject.name.includes('Proseminar'),
        });
      }
    });
  });

  return gameCourses;
}
