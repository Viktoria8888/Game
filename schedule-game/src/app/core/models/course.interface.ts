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
  | 'STATS' // 'RPIS'
  | 'OOAD' // 'PIPO'
  | 'SE' // 'IO'
  | 'CSA' // 'ASK'
  | 'CN' // 'SK'
  | 'DB' // 'BD'
  | 'P'
  | 'ADVANCED'
  | 'OS' // 'SO'
  | 'AI'
  | 'TCS';

export type CourseForm = 'Lecture' | 'Classes' | 'Laboratory' | 'Project' | 'Seminar';

export interface Course {
  id: string;
  subjectId: string;
  name: string;
  ects: number;
  type: CourseForm;
  tags: Tag[];
  isMandatory: boolean;
  hasExam: boolean;
  isFirstYearRecommended?: boolean;
  isProseminar?: boolean;
  schedule: CourseSlot;
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
  DB: 'Databases', //BD
  CN: 'Computer Networks', // SK
  SE: 'Software Engineering', // IO
  STATS: 'Probability & Statistics', // RPIS
  HUM: 'Humanities', // H
  ADVANCED: 'Ad',
  OS: 'Operating Systems', // SO
  AI: 'Artificial Intelligence',
  TCS: 'Theoretical Computer Science & Functional Programming',
};

export interface SubjectDef {
  id: string;
  name: string;
  tags: Tag[];
  isMandatory: boolean;
  hasExam: boolean;
  isFirstYearRecommended?: boolean;
  prerequisites?: string[];
  components: {
    type: CourseForm;
    ects: number;
    duration: number;
    count?: number;
  }[];
}
