export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface CourseSlot {
  day: Day;
  startTime: number;
  durationHours: number;
}

export type Tag =
  | 'CORE' // 'O'
  | 'CS' // 'I'
  | 'TOOLS' // 'K'
  | 'HUM' // 'HS'
  | 'IP' // 'OWI'
  | 'STATS' // 'RPIS'
  | 'OOAD' // 'PIPO'
  | 'SE' // 'IO'
  | 'CSA' // 'ASK'
  | 'OS' // 'SO'
  | 'CN' // 'SK'
  | 'DB' // 'BD'
  | 'P'
  | 'AI';

export interface Course {
  id: string;
  subjectId: string;
  name: string;
  ects: number;
  type: 'Lecture' | 'Classes' | 'Laboratory' | 'Project' | 'Seminar';
  tags: Tag[] | null;
  isMandatory: boolean;
  hasExam: boolean;
  isFirstYearRecommended?: boolean;
  language: 'PL' | 'EN';
  isProseminar?: boolean;
  schedule: CourseSlot[];
  prerequisites?: string[];
}

export interface ScheduleSlot {
  id: string;
  day: Day;
  startTime: number;
  course: Course | null;
}

export const TAG_MAP: Record<string, string> = {
  CORE: 'Mandatory Core', // O
  CS: 'Computer Science', // I
  TOOLS: 'IT Tools & Courses', // K
  P: 'Programming Project', // P
  OOAD: 'Object-Oriented Analysis and Design', // PIPO
  IP: 'Intellectual Property Law', // OWI
  CSA: 'Computer System Architecture', // ASK
  OS: 'Operating Systems', // SO
  DB: 'Databases', //BD
  CN: 'Computer Networks', // SK
  SE: 'Software Engineering', // IO
  STATS: 'Probability & Statistics', // RPIS
  HUM: 'Humanities', // H
  AI: 'Artificial Intelligence',
};
