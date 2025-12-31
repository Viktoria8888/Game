import { TestBed } from '@angular/core/testing';
import { GameService } from '../game.service';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { HistoryService } from '../history.service';
import { CourseSelectionService } from '../courses-selection';
import { ScheduleService } from '../schedule.service';
import { RulesService } from '../rules.service';
import { SimpleGameMetadata, ComplexGameMetadata } from '../../models/game_state.dto';
import { ValidationResultMap } from '../../models/rules.interface';

describe('GameService', () => {
  let service: GameService;
  let mockSchedule: jasmine.SpyObj<ScheduleService>;
  let mockHistory: jasmine.SpyObj<HistoryService>;
  let mockSelection: jasmine.SpyObj<CourseSelectionService>;
  let mockRules: jasmine.SpyObj<RulesService>;

  let simpleMetaSignal: WritableSignal<SimpleGameMetadata>;
  let complexMetaSignal: WritableSignal<ComplexGameMetadata>;
  let selectedCoursesSignal: WritableSignal<any[]>;
  let historySignal: WritableSignal<any[]>;

  const defaultSimpleMeta: SimpleGameMetadata = {
    currentSemesterEcts: 30,
    ectsByTag: {},
    ectsByType: {},
    hasExamCount: 0,
    uniqueCoursesCount: 0,
    proseminarCount: 0,
    mandatoryCoursesCompleted: [],
  };

  const defaultComplexMeta: ComplexGameMetadata = {
    willpowerCost: 10,
    costBreakdown: [],
    totalContactHours: 0,
    totalGapTime: 0,
    maxGapInAnyDay: 0,
    averageStartTime: 0,
    freeDaysCount: 0,
  };

  const defaultRuleResult: ValidationResultMap = {
    satisfied: [],
    violated: [],
  };

  beforeEach(() => {
    simpleMetaSignal = signal(defaultSimpleMeta);
    complexMetaSignal = signal(defaultComplexMeta);
    selectedCoursesSignal = signal([]);
    historySignal = signal([]);

    mockHistory = jasmine.createSpyObj<HistoryService>(
      'HistoryService',
      ['addRecord', 'setHistory'],
      { history: historySignal }
    );

    mockSchedule = jasmine.createSpyObj<ScheduleService>('ScheduleService', [], {
      simpleMetadata: simpleMetaSignal,
      complexMetadata: complexMetaSignal,
      scheduleSlots: signal([]),
    });

    mockSelection = jasmine.createSpyObj<CourseSelectionService>(
      'CourseSelectionService',
      ['clearAll', 'setSelectedCourses'],
      { selectedCourses: selectedCoursesSignal }
    );

    mockRules = jasmine.createSpyObj<RulesService>('RulesService', [
      'validate',
      'areRequiredRulesSatisfied',
    ]);

    mockRules.validate.and.returnValue(defaultRuleResult);
    mockRules.areRequiredRulesSatisfied.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HistoryService, useValue: mockHistory },
        { provide: ScheduleService, useValue: mockSchedule },
        { provide: CourseSelectionService, useValue: mockSelection },
        { provide: RulesService, useValue: mockRules },
      ],
    });

    service = TestBed.inject(GameService);
  });

  describe('currentSemesterOutcome', () => {
    it('returns zero score when no courses selected', () => {
      selectedCoursesSignal.set([]);
      simpleMetaSignal.set({ ...defaultSimpleMeta, currentSemesterEcts: 30 });

      const outcome = service.currentSemesterOutcome();

      expect(outcome.scoreChange).toBe(0);
    });

    it('calculates score based on ECTS and rule rewards', () => {
      selectedCoursesSignal.set([{ id: 'c1', ects: 5 }]);
      simpleMetaSignal.set({ ...defaultSimpleMeta, currentSemesterEcts: 5 });
      const satisfiedRule = {
        rule: { id: 'test-rule', scoreReward: 100, category: 'Goal' as const },
      };
      mockRules.validate.and.returnValue({ satisfied: [satisfiedRule as any], violated: [] });

      const outcome = service.currentSemesterOutcome();

      // (5 ECTS * 10) + 100 Reward = 150
      expect(outcome.scoreChange).toBe(150);
      expect(outcome.predictedTotalScore).toBe(150);
    });

    it('calculates willpower cost and flag if budget is exceeded', () => {
      complexMetaSignal.set({
        ...defaultComplexMeta,
        willpowerCost: 25,
        costBreakdown: ['Expensive'],
      });

      const outcome = service.currentSemesterOutcome();

      expect(outcome.willpowerCost).toBe(25);
      expect(outcome.willpowerBudget).toBe(service.SEMESTER_BUDGET);
      expect(outcome.isBudgetExceeded).toBeTrue();
    });

    it('reports correct goal rules count', () => {
      selectedCoursesSignal.set([{ id: 'c1' }]);
      mockRules.validate.and.returnValue({
        satisfied: [
          { rule: { category: 'Goal' } },
          { rule: { category: 'Goal' } },
          { rule: { category: 'Mandatory' } },
        ] as any,
        violated: [],
      });

      const outcome = service.currentSemesterOutcome();

      expect(outcome.goalRules).toBe(2);
    });

    it('recomputes outcome when metadata changes', () => {
      selectedCoursesSignal.set([{ id: 'c1', ects: 5 }]);

      simpleMetaSignal.set({ ...defaultSimpleMeta, currentSemesterEcts: 10 });
      const scoreChange1 = service.currentSemesterOutcome().scoreChange;
      simpleMetaSignal.set({ ...defaultSimpleMeta, currentSemesterEcts: 20 });
      const scoreChange2 = service.currentSemesterOutcome().scoreChange;

      expect(scoreChange1).toBe(100);
      expect(scoreChange2).toBe(200);
    });
  });

  describe('completeLevel', () => {
    it('SUCCESS: increments level, updates score, and adds history record', () => {
      service.currentLevel.set(1);
      selectedCoursesSignal.set([{ id: 'c1', subjectId: 'math' }]);
      simpleMetaSignal.set({ ...defaultSimpleMeta, currentSemesterEcts: 10 });
      complexMetaSignal.set({ ...defaultComplexMeta, willpowerCost: 15 });

      service.completeLevel();

      expect(mockHistory.addRecord).toHaveBeenCalledWith(
        jasmine.objectContaining({
          level: 1,
          ectsEarned: 10,
          scoreEarned: 100,
          willpowerCost: 15,
        })
      );
      expect(service.totalScore()).toBe(100);
      expect(service.currentLevel()).toBe(2);
      expect(mockSelection.clearAll).toHaveBeenCalled();
    });

    it('FAILURE: does not advance if mandatory rules are violated', () => {
      mockRules.areRequiredRulesSatisfied.and.returnValue(false);
      service.currentLevel.set(1);

      service.completeLevel();

      expect(service.currentLevel()).toBe(1);
      expect(mockHistory.addRecord).not.toHaveBeenCalled();
    });

    it('FAILURE (Budget): does not advance if Willpower Budget is exceeded', () => {
      complexMetaSignal.set({ ...defaultComplexMeta, willpowerCost: 21 });
      mockRules.areRequiredRulesSatisfied.and.returnValue(true);
      service.currentLevel.set(1);

      service.completeLevel();

      expect(service.currentLevel()).toBe(1);
      expect(mockHistory.addRecord).not.toHaveBeenCalled();
    });

    it('VICTORY: does not increment level after level 6', () => {
      service.currentLevel.set(6);
      selectedCoursesSignal.set([{ id: 'c1' }]);

      service.completeLevel();

      expect(service.currentLevel()).toBe(6);
    });
  });

  describe('State Management', () => {
    it('restoreState:propagates data to all dependencies', () => {
      const mockState: any = {
        level: 4,
        score: 5000,
        history: [{ level: 1 }],
        coursesSelected: [{ id: 'c1' }],
      };

      service.restoreState(mockState);

      expect(service.currentLevel()).toBe(4);
      expect(service.totalScore()).toBe(5000);
      expect(mockHistory.setHistory).toHaveBeenCalledWith(mockState.history);
      expect(mockSelection.setSelectedCourses).toHaveBeenCalledWith(mockState.coursesSelected);
    });

    it('gameStateSnapshot:returns correct DTO structure', () => {
      service.currentLevel.set(3);
      service.totalScore.set(300);
      selectedCoursesSignal.set([{ id: 'c1', ects: 5 }]);

      const snapshot = service.gameStateSnapshot();

      expect(snapshot.level).toBe(3);
      expect(snapshot.score).toBe(300);
      expect(snapshot.coursesSelected).toEqual([{ id: 'c1', ects: 5 }] as any);
    });
  });
});
