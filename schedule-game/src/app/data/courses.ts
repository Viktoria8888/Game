import { Course, Day } from '../core/models/course.interface';
import { SUBJECTS } from './subjects';

const generateCourses = (): Course[] => {
  const gameCourses: Course[] = [];
  const days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  SUBJECTS.forEach((subject) => {
    subject.components.forEach((comp) => {
      const groupsCount = comp.count || 1;

      for (let i = 1; i <= groupsCount; i++) {
        const randomDay = days[Math.floor(Math.random() * days.length)];
        const randomStart = Math.floor(Math.random() * (20 - 8) + 8);

        const newCourse: Course = {
          id: `${subject.id}-${comp.type}-${i}`,
          subjectId: subject.id,
          name: `${subject.name}`,
          type: comp.type,
          tags: subject.tags,
          isMandatory: subject.isMandatory,
          hasExam: subject.hasExam,
          prerequisites: subject.prerequisites || [],
          ects: comp.ects,
          schedule: {
            day: randomDay,
            startTime: randomStart,
            durationHours: comp.duration,
          },
        };

        gameCourses.push(newCourse);
      }
    });
  });

  return gameCourses;
};

export const COURSES = generateCourses();
