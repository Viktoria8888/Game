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
}
export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
export interface ScheduleSlot {
  id: string;
  day: Day;
  startTime: number;
  durationHours: number;
  course: Course | null;
}

export interface Rule {
  id: string;
  description: string;
  semestr: number | null;
  category: 'Cumulative' | 'Additional' | 'Goal';
  validator: (schedule: ScheduleSlot[], currentSemestr: number) => boolean;
  // For handling conflicts (e.g R10 controlls R2)
  controlledByRules?: string[];
}
