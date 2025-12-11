import { TestBed } from '@angular/core/testing';
import { GameService } from '../game.service';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { HistoryService } from '../history.service';
import { CourseSelectionService } from '../courses-selection';
import { ScheduleService } from '../schedule.service';

describe('GameService', () => {
  let service: GameService;
  let mockSchedule: any;
  let mockHistory: any;
  let mockSelection: any;

  beforeEach(() => {
    mockHistory = {
      totalHistoricalEcts: signal(0),
      totalHistoricalScore: signal(0),
      history: signal([]),
      addRecord: jasmine.createSpy('addRecord'),
      setHistory: jasmine.createSpy('setHistory'),
    };

    mockSchedule = {
      simpleMetadata: signal({ currentSemesterEcts: 0, score: 0 }),
      scheduleSlots: signal([]),
    };

    mockSelection = {
      selectedCourses: signal([]),
      clearAll: jasmine.createSpy('clearAll'),
      setSelectedCourses: jasmine.createSpy('setSelectedCourses'),
    };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HistoryService, useValue: mockHistory },
        { provide: ScheduleService, useValue: mockSchedule },
        { provide: CourseSelectionService, useValue: mockSelection },
      ],
    });

    service = TestBed.inject(GameService);
  });

  it('calculates totalEcts by combining history + schedule', () => {
    mockHistory.totalHistoricalEcts.set(50);
    mockSchedule.simpleMetadata.set({ currentSemesterEcts: 30, score: 0 });

    expect(service.totalEcts()).toBe(80);
  });

  it('calculates totalScore by combining history + schedule', () => {
    mockHistory.totalHistoricalScore.set(100);
    mockSchedule.simpleMetadata.set({ currentSemesterEcts: 0, score: 20 });

    expect(service.totalScore()).toBe(120);
  });

  it('completeLevel: add record, increment level, and clear selection', () => {
    service.currentLevel.set(1);

    mockSchedule.simpleMetadata.set({ currentSemesterEcts: 30, score: 90, stressLevel: 10 });
    mockSelection.selectedCourses.set([{ id: 'math-101' }, { id: 'math-102' }]);

    service.completeLevel();

    expect(mockHistory.addRecord).toHaveBeenCalledWith({
      level: 1,
      coursesTaken: ['math-101', 'math-102'],
      ectsEarned: 30,
      scoreEarned: 90,
      stressLevel: 10,
    });
    expect(service.currentLevel()).toBe(2);
    expect(mockSelection.clearAll).toHaveBeenCalled();
  });

  it('restoreState: propagate data to all dependencies', () => {
    const mockState = {
      level: 5,
      history: [{ some: 'data' }],
      coursesSelected: [{ some: 'slot' }],
    } as any;

    service.restoreState(mockState);

    expect(service.currentLevel()).toBe(5);
    expect(mockHistory.setHistory).toHaveBeenCalledWith(mockState.history);
    expect(mockSelection.setSelectedCourses).toHaveBeenCalledWith(mockState.coursesSelected);
  });
});
