import seedrandom from 'seedrandom';
import { Course, Day } from '../core/models/course.interface';
import { SUBJECTS } from './subjects';

const rng = seedrandom('my-stable-seed');
export const COURSES = generateCourses();

function generateCourses(): Course[] {
  const gameCourses: Course[] = [];

  const goldenPathSlots: { day: Day; start: number; end: number }[] = [];

  const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const START_HOUR = 8;
  const END_HOUR = 20;

  const isBlocked = (
    start: number,
    duration: number,
    blockedTimes?: { start: number; end: number }[]
  ): boolean => {
    if (!blockedTimes || blockedTimes.length === 0) return false;

    const end = start + duration;

    return blockedTimes.some((block) => {
      return start < block.end && end > block.start;
    });
  };

  const getSafeSlot = (
    duration: number,
    blockedTimes?: { start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    for (const day of DAYS) {
      for (let hour = START_HOUR; hour <= END_HOUR - duration; hour++) {
        if (isBlocked(hour, duration, blockedTimes)) {
          continue;
        }
        const collides = goldenPathSlots.some(
          (reserved) =>
            reserved.day === day && !(hour >= reserved.end || hour + duration <= reserved.start)
        );

        if (!collides) {
          goldenPathSlots.push({ day, start: hour, end: hour + duration });
          return { day, startTime: hour };
        }
      }
    }
    return getRandomSlot(duration);
  };

  const getRandomSlot = (
    duration: number,
    blockedTimes?: { start: number; end: number }[]
  ): { day: Day; startTime: number } => {
    const day = DAYS[Math.floor(rng() * DAYS.length)];
    const maxStart = END_HOUR - duration;
    let attempts = 0;
    while (attempts < 50) {
      const startTime = Math.floor(rng() * (maxStart - START_HOUR + 1) + START_HOUR);

      if (!isBlocked(startTime, duration, blockedTimes)) {
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

    subject.components.forEach((comp) => {
      const groupsCount = comp.count || 1;

      for (let i = 1; i <= groupsCount; i++) {
        let schedule: { day: Day; startTime: number };

        if (useGoldenPath && i === 1) {
          schedule = getSafeSlot(comp.duration, blockedTimes);
        } else {
          schedule = getRandomSlot(comp.duration, blockedTimes);
        }

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
