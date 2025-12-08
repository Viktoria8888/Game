import { TestBed } from '@angular/core/testing';

import { ScheduleService } from '../schedule.service';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { Course, ScheduleSlot } from '../../models/course.interface';
import { CourseSelectionService } from '../courses-selection';

const MOCK_COURSE_A: Course = {
  id: '1',
  name: 'Mathematical Analysis I (Lecture)',
  ects: 5,
  type: 'Lecture',
  tags: ['I', 'O'],
  isMandatory: true,
  hasExam: true,
  isFirstYearRecommended: true,
  language: 'PL',
  isProseminar: false,
  schedule: [{ day: 'Mon', startTime: 8, durationHours: 2 }],
};

const MOCK_COURSE_B: Course = {
  id: '2',
  name: 'Introduction to Programming (Lecture)',
  ects: 4,
  type: 'Classes',
  tags: ['I', 'IO'],
  isMandatory: true,
  hasExam: true,
  isFirstYearRecommended: true,
  language: 'EN',
  isProseminar: true,
  schedule: [{ day: 'Tue', startTime: 10, durationHours: 2 }],
};

type MockCourseSelectionService = {
  selectedCourses: WritableSignal<Course[]>;
  clearAll: jasmine.Spy;
  setSelectedCourses: jasmine.Spy;
};

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockSelectionService: MockCourseSelectionService;

  beforeEach(() => {
    mockSelectionService = {
      selectedCourses: signal([]),
      clearAll: jasmine.createSpy('clearAll'),
      setSelectedCourses: jasmine.createSpy('setSelectedCourses'),
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

  describe('scheduleSlots (computed)', () => {
    it('reflects selected courses in schedule slots', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A]);
      const slots = service.scheduleSlots();

      expect(slots.length).toBe(2);
      expect(slots[0].course?.id).toBe(MOCK_COURSE_A.id);
      expect(slots[0].startTime).toBe(MOCK_COURSE_A.schedule[0].startTime);
    });

    it('transforms selected courses into hourly slots', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);

      const slots = service.scheduleSlots();
      expect(slots.length).toBe(4);

      expect(slots[0].startTime).toBe(8);
      expect(slots[0].day).toBe('Mon');
      expect(slots[0].course?.id).toBe(MOCK_COURSE_A.id);

      expect(slots[1].startTime).toBe(9);
      expect(slots[1].day).toBe('Mon');
    });
  });

  describe('simpleMetadata signal', () => {
    it('correctly sums ECTS and counts from selected courses', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);

      const meta = service.simpleMetadata();
      expect(meta.currentSemesterEcts).toBe(9);
      expect(meta.uniqueCoursesCount).toBe(2);
      expect(meta.hasExamCount).toBe(2);
      expect(meta.proseminarCount).toBe(1);
    });

    it('aggregates ECTS by Type', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);
      const meta = service.simpleMetadata();

      expect(meta.ectsByType['Lecture']).toBe(5);
      expect(meta.ectsByType['Classes']).toBe(4);
    });

    it('aggregates ECTS by Tag', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);
      const meta = service.simpleMetadata();

      expect(meta.ectsByTag['I']).toBe(9);
      expect(meta.ectsByTag['IO']).toBe(4);
      expect(meta.ectsByTag['arts']).toBeUndefined();
    });

    it('tracks mandatory courses', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);
      const meta = service.simpleMetadata();

      expect(meta.mandatoryCoursesCompleted).toContain('1');
      expect(meta.mandatoryCoursesCompleted).toContain('2');
    });

    it('adjusts, when selected courses change', () => {
      mockSelectionService.selectedCourses.set([MOCK_COURSE_A, MOCK_COURSE_B]);
      const metaBefore = service.simpleMetadata();

      mockSelectionService.selectedCourses.set([MOCK_COURSE_A]);
      const metaAfter = service.simpleMetadata();

      expect(metaBefore.currentSemesterEcts).toBe(9);
      expect(metaAfter.currentSemesterEcts).toBe(5);
    });
  });
});
