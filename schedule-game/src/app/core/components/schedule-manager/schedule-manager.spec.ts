import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ScheduleManagerComponent } from './schedule-manager';
import { GameService, SemesterOutcome } from '../../services/game.service';
import { CourseSelectionService } from '../../services/courses-selection';
import { ScheduleService } from '../../services/schedule.service';
import { AuthService } from '../../services/auth.service';
import { PersistenceService } from '../../services/persistence.service';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { RulesService } from '../../services/rules.service';
import { Course, ScheduleSlot } from '../../models/course.interface';
import {
  ComplexGameMetadata,
  SemesterHistory,
  SimpleGameMetadata,
} from '../../models/game_state.dto';
import { LevelSummary } from '../level-summary/level-summary';
import { By } from '@angular/platform-browser';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';

interface MockGameService {
  currentLevel: WritableSignal<number>;
  availableCourses: WritableSignal<Course[]>;
  history: {
    history: WritableSignal<SemesterHistory[]>;
    previouslyTakenCourseIds: WritableSignal<Set<string>>;
  };
  currentSemesterOutcome: WritableSignal<SemesterOutcome>;
  completeLevel: jasmine.Spy<() => void>;
  canPassLevel: WritableSignal<boolean>;
  showLevelSummaryModal: WritableSignal<boolean>;
}

interface MockCourseSelectionService {
  selectedCourses: WritableSignal<Course[]>;
  collisions: WritableSignal<Array<{ course1: Course; course2: Course }>>;
  previewCourse: WritableSignal<Course | null>;
}

interface MockScheduleService {
  scheduleSlots: WritableSignal<ScheduleSlot[]>;
  simpleMetadata: WritableSignal<SimpleGameMetadata>;
  complexMetadata: WritableSignal<ComplexGameMetadata>;
}

interface MockAuthService {
  username: WritableSignal<string>;
  isAnonymous: WritableSignal<boolean>;
}

describe('ScheduleManagerComponent', () => {
  let component: ScheduleManagerComponent;
  let fixture: ComponentFixture<ScheduleManagerComponent>;

  let mockGameService: MockGameService;
  let mockSelectionService: MockCourseSelectionService;
  let mockScheduleService: MockScheduleService;
  let mockAuthService: MockAuthService;
  let mockPersistenceService: jasmine.SpyObj<PersistenceService>;
  let mockRulesService: jasmine.SpyObj<RulesService>;

  let selectedCoursesSig: WritableSignal<Course[]>;
  let availableCoursesSig: WritableSignal<Course[]>;
  let collisionsSig: WritableSignal<Array<{ course1: Course; course2: Course }>>;
  let historyIdsSig: WritableSignal<Set<string>>;
  let currentLevelSig: WritableSignal<number>;
  let scheduleSlotsSig: WritableSignal<ScheduleSlot[]>;
  let usernameSig: WritableSignal<string>;

  const defaultSemesterOutcome: SemesterOutcome = {
    scoreChange: 0,
    predictedTotalScore: 0,
    validation: { satisfied: [], violated: [] },
    goalRules: 0,
    willpowerCost: 0,
    willpowerBudget: 20,
    isBudgetExceeded: false,
    costBreakdown: [],
    complexMeta: {} as ComplexGameMetadata,
  };

  beforeEach(async () => {
    selectedCoursesSig = signal<Course[]>([]);
    availableCoursesSig = signal<Course[]>([]);
    collisionsSig = signal<Array<{ course1: Course; course2: Course }>>([]);
    historyIdsSig = signal<Set<string>>(new Set());
    currentLevelSig = signal<number>(1);
    scheduleSlotsSig = signal<ScheduleSlot[]>([]);
    usernameSig = signal<string>('Test Player');

    mockGameService = {
      currentLevel: currentLevelSig,
      availableCourses: availableCoursesSig,
      history: {
        history: signal<SemesterHistory[]>([]),
        previouslyTakenCourseIds: historyIdsSig,
      },
      currentSemesterOutcome: signal<SemesterOutcome>(defaultSemesterOutcome),
      completeLevel: jasmine.createSpy('completeLevel'),
      canPassLevel: signal(false),
      showLevelSummaryModal: signal(false), 
    };

    mockSelectionService = {
      selectedCourses: selectedCoursesSig,
      collisions: collisionsSig,
      previewCourse: signal(null),
    };

    mockScheduleService = {
      scheduleSlots: scheduleSlotsSig,
      simpleMetadata: signal<SimpleGameMetadata>({} as SimpleGameMetadata),
      complexMetadata: signal<ComplexGameMetadata>({} as ComplexGameMetadata),
    };

    mockAuthService = {
      username: usernameSig,
      isAnonymous: signal(false),
    };

    mockPersistenceService = jasmine.createSpyObj<PersistenceService>('PersistenceService', [
      'saveImmediately',
    ]);

    mockRulesService = jasmine.createSpyObj<RulesService>('RulesService', [
      'getRuleCounts',
      'areRequiredRulesSatisfied',
    ]);

    mockRulesService.getRuleCounts.and.returnValue({ mandatory: 0, goal: 0, total: 0 });
    mockRulesService.areRequiredRulesSatisfied.and.returnValue(true);

    TestBed.configureTestingModule({
      imports: [ScheduleManagerComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: GameService, useValue: mockGameService },
        { provide: CourseSelectionService, useValue: mockSelectionService },
        { provide: ScheduleService, useValue: mockScheduleService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PersistenceService, useValue: mockPersistenceService },
        { provide: RulesService, useValue: mockRulesService },
      ],
    });

    fixture = TestBed.createComponent(ScheduleManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Interactions', () => {
    it('temporarily sets shakingCourseIds and clears them after 500ms', fakeAsync(() => {
      component.triggerConflictShake(['101', '102']);
      fixture.detectChanges();

      const gridDe = fixture.debugElement.query(By.directive(ScheduleGrid));
      const gridCmp = gridDe.componentInstance as ScheduleGrid;

      expect(gridCmp.shakingIds().has('101')).toBeTrue();
      expect(gridCmp.shakingIds().has('102')).toBeTrue();

      tick(500);
      fixture.detectChanges();

      expect(gridCmp.shakingIds.length).toBe(0);
    }));
  });

  describe('Integration', () => {
    it('passes correct inputs to app-header', () => {
      currentLevelSig.set(5);
      usernameSig.set('SuperUser');
      fixture.detectChanges();

      const headerDe = fixture.debugElement.query(By.directive(HeaderComponent));
      const headerCmp = headerDe.componentInstance as HeaderComponent;

      expect(headerCmp.currentLevel()).toBe(5);
      expect(headerCmp.userName()).toBe('SuperUser');
    });

    it('passes schedule slots to app-schedule-grid', () => {
      const mockSlots: ScheduleSlot[] = [{ id: 'test', day: 'Mon', startTime: 8, course: null }];

      scheduleSlotsSig.set(mockSlots);
      fixture.detectChanges();

      const gridDe = fixture.debugElement.query(By.directive(ScheduleGrid));
      const gridCmp = gridDe.componentInstance as ScheduleGrid;

      expect(gridCmp.schedule()).toBe(mockSlots);
    });
  });
});
