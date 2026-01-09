import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Courses } from './courses-list';
import { CourseSelectionService } from '../../services/courses-selection';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Course } from '../../models/course.interface';

const MOCK_COURSE_1: Course = {
  id: 'c1',
  subjectId: 's1',
  name: 'Advanced Mathematics',
  ects: 5,
  type: 'Lecture',
  tags: ['CORE', 'STATS'],
  isMandatory: true,
  hasExam: true,
  schedule: { day: 'Mon', startTime: 10, durationHours: 2 },
};

const MOCK_COURSE_2: Course = {
  id: 'c2',
  subjectId: 's2',
  name: 'Web Development',
  ects: 4,
  type: 'Laboratory',
  tags: ['CS', 'SE'],
  isMandatory: false,
  hasExam: false,
  schedule: { day: 'Tue', startTime: 12, durationHours: 2 },
};

describe('Courses (CoursesList)', () => {
  let component: Courses;
  let fixture: ComponentFixture<Courses>;
  let mockCourseSelectionService: jasmine.SpyObj<CourseSelectionService>;

  beforeEach(async () => {
    mockCourseSelectionService = jasmine.createSpyObj('CourseSelectionService', [
      'canAddCourse',
      'addCourse',
    ]);

    mockCourseSelectionService.canAddCourse.and.returnValue({
      canAdd: true,
      conflicts: [],
    });

    await TestBed.configureTestingModule({
      imports: [Courses],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CourseSelectionService, useValue: mockCourseSelectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Courses);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('availableCourses', [MOCK_COURSE_1, MOCK_COURSE_2]);
    fixture.componentRef.setInput('currentLevel', 1);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Filtering Logic', () => {
    it('filters by search term', () => {
      component.searchTerm.set('math');
      fixture.detectChanges();

      const filtered = component.filteredCourses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(MOCK_COURSE_1.id);
    });

    it('filters by type', () => {
      component.toggleType('Lecture');
      fixture.detectChanges();

      const filtered = component.filteredCourses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].type).toBe('Lecture');
    });

    it('filters by tag', () => {
      component.toggleTag('CS');
      fixture.detectChanges();

      const filtered = component.filteredCourses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(MOCK_COURSE_2.id);
    });

    it('filters using combination of search, type, and tag', () => {
      component.searchTerm.set('Web');
      component.toggleType('Laboratory');
      component.toggleTag('SE');
      fixture.detectChanges();

      const filtered = component.filteredCourses();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(MOCK_COURSE_2.id);
    });

    it('returns empty list if no matches found', () => {
      component.searchTerm.set('Biology');
      fixture.detectChanges();

      const filtered = component.filteredCourses();
      expect(filtered.length).toBe(0);

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
    });
  });

  describe('Dropdown Interactions', () => {
    it('toggles dropdown visibility', () => {
      expect(component.tagsDropdownOpen()).toBeFalse();

      const trigger = fixture.debugElement.query(By.css('.dropdown-trigger'));
      trigger.triggerEventHandler('click');
      fixture.detectChanges();

      expect(component.tagsDropdownOpen()).toBeTrue();
      expect(fixture.debugElement.query(By.css('.dropdown-menu'))).toBeTruthy();
    });

    it('closes dropdown when backdrop is clicked', () => {
      component.tagsDropdownOpen.set(true);
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('.dropdown-backdrop'));
      backdrop.triggerEventHandler('click');
      fixture.detectChanges();

      expect(component.tagsDropdownOpen()).toBeFalse();
    });

    it('clears all selected tags', () => {
      component.toggleTag('CS');
      component.toggleTag('CORE');
      expect(component.selectedTags().size).toBe(2);

      component.tagsDropdownOpen.set(true);
      fixture.detectChanges();

      const clearBtn = fixture.debugElement.query(By.css('.clear-btn'));
      clearBtn.triggerEventHandler('click');
      fixture.detectChanges();

      expect(component.selectedTags().size).toBe(0);
    });
  });

  describe('Course Selection', () => {
    it('adds course successfully when there are no conflicts', () => {
      const card = fixture.debugElement.query(By.css('.course-card'));
      card.triggerEventHandler('click');

      expect(mockCourseSelectionService.addCourse).toHaveBeenCalledWith(MOCK_COURSE_1);
    });

    it('emits conflict event when course cannot be added', () => {
      let conflictsEmitted: string[] | undefined;
      component.courseConflict.subscribe((ids) => (conflictsEmitted = ids));

      mockCourseSelectionService.canAddCourse.and.returnValue({
        canAdd: false,
        conflicts: [MOCK_COURSE_2],
      });

      const card = fixture.debugElement.query(By.css('.course-card'));
      card.triggerEventHandler('click');

      expect(mockCourseSelectionService.addCourse).not.toHaveBeenCalled();
      expect(conflictsEmitted).toEqual([MOCK_COURSE_2.id]);
    });

    it('alerts user if addCourse throws an error', () => {
      spyOn(window, 'alert');
      mockCourseSelectionService.addCourse.and.throwError('Some error');

      const card = fixture.debugElement.query(By.css('.course-card'));
      card.triggerEventHandler('click');

      expect(window.alert).toHaveBeenCalledWith('Some error');
    });
  });

  describe('Template Rendering', () => {
    it('renders correct number of courses', () => {
      const cards = fixture.debugElement.queryAll(By.css('.course-card'));
      expect(cards.length).toBe(2);
    });

    it('renders course details correctly', () => {
      const firstCard = fixture.debugElement.query(By.css('.course-card'));
      const text = firstCard.nativeElement.textContent;

      expect(text).toContain('Advanced Mathematics');
      expect(text).toContain('5 ECTS');
      expect(text).toContain('Lecture');
      expect(text).toContain('Mandatory');
    });

    it('updates "Selected" count in dropdown trigger', () => {
      component.toggleTag('CORE');
      fixture.detectChanges();

      const triggerText = fixture.debugElement.query(By.css('.dropdown-trigger span')).nativeElement
        .textContent;
      expect(triggerText).toContain('1 Selected');
    });
  });
});
