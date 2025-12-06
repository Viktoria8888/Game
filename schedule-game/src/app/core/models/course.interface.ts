export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface CourseSlot {
  day: Day;
  startTime: number;
  durationHours: number;
}

export interface Course {
  id: string;
  name: string;
  ects: number;
  type: 'Lecture' | 'Classes' | 'Laboratory' | 'Project' | 'Seminar';
  tags:
    | (
        | 'O'
        | 'I'
        | 'K'
        | 'HS'
        | 'E'
        | 'OWI'
        | 'RPIS'
        | 'IO'
        | 'PIPO'
        | 'ASK'
        | 'SO'
        | 'SK'
        | 'BD'
        | 'PS'
        | 'P'
      )[]
    | null;
  isMandatory: boolean;
  hasExam: boolean;
  isFirstYearRecommended?: boolean;
  language: 'PL' | 'EN';
  isProseminar: boolean;
  schedule: CourseSlot[];
  prerequisites?: string[];
}

export interface ScheduleSlot {
  id: string;
  day: Day;
  startTime: number;
  course: Course | null;
}
