import { TestBed } from '@angular/core/testing';
import { signal, WritableSignal, provideZonelessChangeDetection } from '@angular/core';

import { ScheduleService, WILLPOWER_PRICES } from '../schedule.service';
import { CourseSelectionService } from '../courses-selection';
import { Course, Day } from '../../models/course.interface';

const MOCK_COURSE_A: Course = {
  id: '1a',
  subjectId: '1',
  name: 'Mathematical Analysis I',
  ects: 5,
  type: 'Lecture',
  tags: ['CORE'],
  isMandatory: true,
  hasExam: true,
  isFirstYearRecommended: true,
  isProseminar: false,
  schedule: { day: 'Mon', startTime: 8, durationHours: 2 },
};

const MOCK_COURSE_B: Course = {
  id: '2a',
  subjectId: '2',
  name: 'Introduction to Programming',
  ects: 4,
  type: 'Classes',
  tags: ['CORE', 'TOOLS'],
  isMandatory: true,
  hasExam: true,
  isFirstYearRecommended: true,
  isProseminar: true,
  schedule: { day: 'Tue', startTime: 10, durationHours: 2 },
};

const createCourse = (
  overrides: Partial<Course> & {
    schedule: { day: Day; startTime: number; durationHours: number };
  }
): Course =>
  ({
    ...MOCK_COURSE_A,
    id: `custom-${Math.random()}`,
    hasExam: false,
    isMandatory: false,
    ...overrides,
  } as Course);

type MockCourseSelectionService = {
  selectedCourses: WritableSignal<Course[]>;
  clearAll: jasmine.Spy;
  setSelectedCourses: jasmine.Spy;
};

function slot(day: Day, hour: number) {
  return jasmine.objectContaining({ day, startTime: hour });
}

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockSelectionService: MockCourseSelectionService;

  const setCourses = (...courses: Course[]) => mockSelectionService.selectedCourses.set(courses);

  beforeEach(() => {
    mockSelectionService = {
      selectedCourses: signal([]),
      clearAll: jasmine.createSpy(),
      setSelectedCourses: jasmine.createSpy(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ScheduleService,
        { provide: CourseSelectionService, useValue: mockSelectionService },
      ],
    });

    service = TestBed.inject(ScheduleService);
  });

  describe('ScheduleSlots', () => {
    it('creates one slot per contact hour', () => {
      setCourses(MOCK_COURSE_A, MOCK_COURSE_B);

      expect(service.scheduleSlots().length).toBe(4);
    });

    it('contains expected time slots (order independent)', () => {
      setCourses(MOCK_COURSE_A);

      expect(service.scheduleSlots()).toEqual(
        jasmine.arrayContaining([slot('Mon', 8), slot('Mon', 9)])
      );
    });

    it('allows overlapping courses', () => {
      const c1 = createCourse({
        schedule: { day: 'Mon', startTime: 10, durationHours: 2 },
      });
      const c2 = createCourse({
        schedule: { day: 'Mon', startTime: 11, durationHours: 2 },
      });

      setCourses(c1, c2);

      const slots = service.scheduleSlots();
      expect(slots.filter((s) => s.startTime === 11).length).toBe(2);
    });
  });

  describe('SimpleMetadata', () => {
    it('starts with empty values', () => {
      expect(service.simpleMetadata()).toEqual({
        currentSemesterEcts: 0,
        ectsByTag: {},
        ectsByType: {},
        hasExamCount: 0,
        uniqueCoursesCount: 0,
        proseminarCount: 0,
        mandatoryCoursesCompleted: [],
      });
    });

    it('reacts to changes in selected courses', () => {
      expect(service.simpleMetadata().currentSemesterEcts).toBe(0);

      setCourses(MOCK_COURSE_A);

      expect(service.simpleMetadata().currentSemesterEcts).toBe(5);
    });

    it('aggregates ECTS, exams, and counts correctly', () => {
      setCourses(MOCK_COURSE_A, MOCK_COURSE_B);
      const meta = service.simpleMetadata();

      expect(meta.currentSemesterEcts).toBe(9);
      expect(meta.uniqueCoursesCount).toBe(2);
      expect(meta.hasExamCount).toBe(2);
      expect(meta.proseminarCount).toBe(1);
    });

    it('aggregates ECTS by type and tag', () => {
      setCourses(MOCK_COURSE_A, MOCK_COURSE_B);
      const meta = service.simpleMetadata();

      expect(meta.ectsByType).toEqual({
        Lecture: 5,
        Classes: 4,
      });

      expect(meta.ectsByTag).toEqual({
        CORE: 9,
        TOOLS: 4,
      });
    });

    it('tracks mandatory courses by id', () => {
      setCourses(MOCK_COURSE_A, MOCK_COURSE_B);
      const meta = service.simpleMetadata();

      expect(meta.mandatoryCoursesCompleted).toEqual([MOCK_COURSE_A.id, MOCK_COURSE_B.id]);
    });
  });

  describe('ComplexMetadata', () => {
    it('returns empty defaults when no courses selected', () => {
      expect(service.complexMetadata()).toEqual({
        totalContactHours: 0,
        totalGapTime: 0,
        maxGapInAnyDay: 0,
        averageStartTime: 0,
        freeDaysCount: 5,
        willpowerCost: 0,
        costBreakdown: [],
      });
    });

    it('calculates basic stats correctly', () => {
      setCourses(MOCK_COURSE_A, MOCK_COURSE_B);
      const meta = service.complexMetadata();

      expect(meta.totalContactHours).toBe(4);
      expect(meta.freeDaysCount).toBe(3);
      expect(meta.averageStartTime).toBe(9);
    });

    it('calculates exact willpower cost for a simple early course', () => {
      setCourses(MOCK_COURSE_A);

      expect(service.complexMetadata().willpowerCost).toBe(
        WILLPOWER_PRICES.EARLY_RISER + WILLPOWER_PRICES.COMMUTER_TAX + WILLPOWER_PRICES.EXAM_STRESS
      );
    });

    it('penalizes starvation blocks (6+ hours)', () => {
      setCourses(createCourse({ schedule: { day: 'Thu', startTime: 8, durationHours: 6 } }));

      expect(service.complexMetadata().willpowerCost).toBeGreaterThan(WILLPOWER_PRICES.EARLY_RISER);
    });

    it('detects clopen situations', () => {
      setCourses(
        createCourse({ schedule: { day: 'Mon', startTime: 18, durationHours: 2 } }),
        createCourse({ schedule: { day: 'Tue', startTime: 8, durationHours: 2 } })
      );

      expect(service.complexMetadata().costBreakdown.some((b) => b.includes('Clopen'))).toBeTrue();
    });
  });
});
