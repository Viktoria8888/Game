import { TestBed } from '@angular/core/testing';
import { CourseSelectionService } from '../courses-selection';
import { provideZonelessChangeDetection } from '@angular/core';
import { Course } from '../../models/course.interface';

const MOCK_COURSE_A: Course = {
  id: '1001-L',
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
  id: '1002-L',
  name: 'Introduction to Programming (Lecture)',
  ects: 4,
  type: 'Lecture',
  tags: ['I', 'IO'],
  isMandatory: true,
  hasExam: true,
  isFirstYearRecommended: true,
  language: 'EN',
  isProseminar: false,
  schedule: [{ day: 'Tue', startTime: 10, durationHours: 2 }],
};

const MOCK_COURSE_CONFLICTING: Course = {
  id: '1001-C',
  name: 'Mathematical Analysis I (Classes)',
  ects: 3,
  type: 'Classes',
  tags: ['I', 'O'],
  isMandatory: true,
  hasExam: false,
  isFirstYearRecommended: true,
  language: 'PL',
  isProseminar: false,
  schedule: [{ day: 'Mon', startTime: 9, durationHours: 2 }],
};

describe('CourseSelectionService', () => {
  let service: CourseSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(CourseSelectionService);
  });

  it('is created with empty selection', () => {
    expect(service).toBeTruthy();
    expect(service.selectedCourses()).toEqual([]);
    expect(service.collisions()).toEqual([]);
    expect(service.isValid()).toBeTrue();
  });

  describe('Adding and Removing Courses', () => {
    it('adds a course successfully', () => {
      service.addCourse(MOCK_COURSE_A);

      expect(service.selectedCourses().length).toBe(1);
      expect(service.selectedCourses()[0]).toBe(MOCK_COURSE_A);
    });

    it('removes a course by ID', () => {
      service.addCourse(MOCK_COURSE_A);
      service.addCourse(MOCK_COURSE_B);

      service.removeCourse(MOCK_COURSE_A.id);

      const current = service.selectedCourses();
      expect(current.length).toBe(1);
      expect(current[0].id).toBe(MOCK_COURSE_B.id);
    });

    it('clears all courses', () => {
      service.addCourse(MOCK_COURSE_A);

      service.clearAll();

      expect(service.selectedCourses().length).toBe(0);
    });
  });

  describe('Collision Detection', () => {
    it('allows adding non-conflicting courses', () => {
      service.addCourse(MOCK_COURSE_A);

      const check = service.canAddCourse(MOCK_COURSE_B);

      expect(check.canAdd).toBeTrue();
      expect(check.conflicts.length).toBe(0);
    });

    it('detects collision when checking a new course', () => {
      service.addCourse(MOCK_COURSE_A);

      const check = service.canAddCourse(MOCK_COURSE_CONFLICTING);

      expect(check.canAdd).toBeFalse();
      expect(check.conflicts.length).toBe(1);
      expect(check.conflicts[0].name).toBe(MOCK_COURSE_A.name);
    });

    it('throws error when trying to add a conflicting course', () => {
      service.addCourse(MOCK_COURSE_A);

      expect(() => service.addCourse(MOCK_COURSE_CONFLICTING)).toThrowError();
    });

    it('correctly identifies valid state based on loaded courses', () => {
      service.setSelectedCourses([MOCK_COURSE_A, MOCK_COURSE_CONFLICTING]);

      expect(service.isValid()).toBeFalse();
      expect(service.collisions().length).toBe(1);
    });
  });

  it('does not collide if one ends exactly when other starts', () => {
    const courseEarly: Course = {
      ...MOCK_COURSE_A,
      schedule: [{ day: 'Mon', startTime: 9, durationHours: 1 }],
    };
    const courseLate: Course = {
      ...MOCK_COURSE_B,
      schedule: [{ day: 'Mon', startTime: 10, durationHours: 1 }],
    };

    service.addCourse(courseEarly);
    expect(service.canAddCourse(courseLate).canAdd).toBeTrue();
  });
});
