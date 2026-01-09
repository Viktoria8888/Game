import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LevelSummary } from './level-summary';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SemesterOutcome } from '../../services/game.service';
import { ComplexGameMetadata } from '../../models/game_state.dto';

const MOCK_OUTCOME: SemesterOutcome = {
  scoreChange: 850,
  predictedTotalScore: 2000,
  validation: { satisfied: [], violated: [] },
  goalRules: 3,
  willpowerCost: 10,
  willpowerBudget: 20,
  isBudgetExceeded: false,
  costBreakdown: [],
  complexMeta: {} as ComplexGameMetadata,
};

describe('LevelSummary', () => {
  let component: LevelSummary;
  let fixture: ComponentFixture<LevelSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LevelSummary],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(LevelSummary);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('outcome', MOCK_OUTCOME);
    fixture.componentRef.setInput('level', 2);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Grade Calculation', () => {
    const checkGrade = (score: number, expectedGrade: string) => {
      fixture.componentRef.setInput('outcome', { ...MOCK_OUTCOME, scoreChange: score });
      fixture.detectChanges();

      expect(component.grade()).toBe(expectedGrade);
    };

    it('calculates "A+" for score >= 1000', () => {
      checkGrade(1000, 'A+');
      checkGrade(1500, 'A+');
    });

    it('calculates "A" for score 800-999', () => {
      checkGrade(800, 'A');
      checkGrade(999, 'A');
    });

    it('calculates "B" for score 600-799', () => {
      checkGrade(600, 'B');
      checkGrade(799, 'B');
    });

    it('calculates "C" for score 400-599', () => {
      checkGrade(400, 'C');
      checkGrade(599, 'C');
    });

    it('calculates "D" for score < 400', () => {
      checkGrade(399, 'D');
      checkGrade(0, 'D');
    });
  });

  describe('Template Rendering', () => {
    it('displays the correct level title', () => {
      fixture.componentRef.setInput('level', 5);
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.header h2')).nativeElement.textContent;
      expect(title).toContain('Semester 5 Complete');
    });

    it('displays the calculated grade in the badge', () => {
      const badge = fixture.debugElement.query(By.css('.grade-badge'));
      expect(badge.nativeElement.textContent).toContain('A');
      expect(badge.classes['A']).toBeTrue();
    });
  });

  describe('Interactions', () => {
    it('emits onProceed when the next button is clicked', () => {
      let emitted = false;
      component.onProceed.subscribe(() => (emitted = true));

      const btn = fixture.debugElement.query(By.css('.next-btn'));
      btn.triggerEventHandler('click');

      expect(emitted).toBeTrue();
    });

    it('emits onClose when the Escape key is pressed', () => {
      let emitted = false;
      component.onClose.subscribe(() => (emitted = true));

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      expect(emitted).toBeTrue();
    });
  });
});
