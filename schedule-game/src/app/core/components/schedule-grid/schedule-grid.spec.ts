import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleGrid } from './schedule-grid';
import { CourseSelectionService } from '../../services/courses-selection';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ScheduleSlot, Course } from '../../models/course.interface';

const MOCK_COURSE: Course = {
  id: 'c1',
  subjectId: 's1',
  name: 'Intro to Testing',
  ects: 5,
  type: 'Lecture',
  tags: ['CORE'],
  isMandatory: true,
  hasExam: true,
  schedule: { day: 'Mon', startTime: 10, durationHours: 2 },
};

const MOCK_SLOT_1: ScheduleSlot = {
  id: 'Mon_10',
  day: 'Mon',
  startTime: 10,
  course: MOCK_COURSE,
};

const MOCK_SLOT_2: ScheduleSlot = {
  id: 'Mon_11',
  day: 'Mon',
  startTime: 11,
  course: MOCK_COURSE,
};

describe('ScheduleGrid', () => {
  let component: ScheduleGrid;
  let fixture: ComponentFixture<ScheduleGrid>;
  let mockCourseSelectionService: jasmine.SpyObj<CourseSelectionService>;

  beforeEach(async () => {
    mockCourseSelectionService = jasmine.createSpyObj('CourseSelectionService', ['removeCourse']);

    await TestBed.configureTestingModule({
      imports: [ScheduleGrid],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CourseSelectionService, useValue: mockCourseSelectionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleGrid);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('schedule', []);
    fixture.componentRef.setInput('conflictingCourseIds', new Set());
    fixture.componentRef.setInput('shakingIds', new Set());
    fixture.componentRef.setInput('currentLevel', 1);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Grid Rendering', () => {
    it('renders empty grid structure correctly', () => {
      const headers = fixture.debugElement.queryAll(By.css('th'));

      expect(headers.length).toBe(6);
      expect(headers[1].nativeElement.textContent).toContain('Mon');
    });

    it('renders slots when schedule input is provided', () => {
      fixture.componentRef.setInput('schedule', [MOCK_SLOT_1, MOCK_SLOT_2]);
      fixture.detectChanges();

      const occupiedCells = fixture.debugElement.queryAll(By.css('.slot-cell.occupied'));
      expect(occupiedCells.length).toBe(2);
    });

    it('identifies the first slot of a course block', () => {
      fixture.componentRef.setInput('schedule', [MOCK_SLOT_1, MOCK_SLOT_2]);
      fixture.detectChanges();

      expect(component.isFirstSlot('Mon', 10)).toBeTrue();
      expect(component.isFirstSlot('Mon', 11)).toBeFalse();

      const firstSlot = fixture.debugElement.query(By.css('.slot-cell.occupied.first-slot'));
      expect(firstSlot).toBeTruthy();
      expect(firstSlot.nativeElement.textContent).toContain('Intro to Testing');
    });
  });

  describe('Interactions', () => {
    it('removes course on double click', () => {
      fixture.componentRef.setInput('schedule', [MOCK_SLOT_1]);
      fixture.detectChanges();

      const cell = fixture.debugElement.query(By.css('.slot-cell.occupied'));
      cell.triggerEventHandler('dblclick');

      expect(mockCourseSelectionService.removeCourse).toHaveBeenCalledWith(MOCK_COURSE.id);
    });

    it('does nothing when double clicking empty slot', () => {
      const cells = fixture.debugElement.queryAll(By.css('.slot-cell'));
      const emptyCell = cells[0];

      emptyCell.triggerEventHandler('dblclick');

      expect(mockCourseSelectionService.removeCourse).not.toHaveBeenCalled();
    });
  });

  describe('Visual States', () => {
    it('applies shaking class when course id is in shakingIds', () => {
      fixture.componentRef.setInput('schedule', [MOCK_SLOT_1]);
      fixture.componentRef.setInput('shakingIds', new Set([MOCK_COURSE.id]));
      fixture.detectChanges();

      const cell = fixture.debugElement.query(By.css('.slot-cell.shake'));
      expect(cell).toBeTruthy();
    });

    it('does not shake if course id matches but no slot exists', () => {
      fixture.componentRef.setInput('schedule', []);
      fixture.componentRef.setInput('shakingIds', new Set([MOCK_COURSE.id]));
      fixture.detectChanges();

      const cell = fixture.debugElement.query(By.css('.slot-cell.shake'));
      expect(cell).toBeNull();
    });
  });
});
