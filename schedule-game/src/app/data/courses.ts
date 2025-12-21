import { Course, Day } from '../core/models/course.interface';
import { SUBJECTS } from './subjects';

export const COURSES = generateCourses();

function generateCourses(): Course[] {
  const gameCourses: Course[] = [];

  const goldenPathSlots: { day: Day; start: number; end: number }[] = [];

  const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const START_HOUR = 8;
  const END_HOUR = 20;

  const getSafeSlot = (duration: number): { day: Day; startTime: number } => {
    for (const day of DAYS) {
      for (let hour = START_HOUR; hour <= END_HOUR - duration; hour++) {
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

  const getRandomSlot = (duration: number): { day: Day; startTime: number } => {
    const day = DAYS[Math.floor(Math.random() * DAYS.length)];
    const maxStart = END_HOUR - duration;
    const startTime = Math.floor(Math.random() * (maxStart - START_HOUR + 1) + START_HOUR);
    return { day, startTime };
  };

  SUBJECTS.forEach((subject) => {
    const isCritical = subject.isMandatory || subject.isFirstYearRecommended;

    subject.components.forEach((comp) => {
      const groupsCount = comp.count || 1;

      for (let i = 1; i <= groupsCount; i++) {
        let schedule: { day: Day; startTime: number };

        if (isCritical && i === 1) {
          schedule = getSafeSlot(comp.duration);
        } else {
          schedule = getRandomSlot(comp.duration);
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
          // Optional: Add helper flags if needed
          isProseminar: comp.type === 'Seminar' || subject.name.includes('Proseminar'),
        });
      }
    });
  });

  return gameCourses;
}
