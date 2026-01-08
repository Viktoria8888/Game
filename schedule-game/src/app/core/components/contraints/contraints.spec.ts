import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Contraints } from './contraints';
import { RulesService } from '../../services/rules.service';
import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ValidationContext, ValidationResultMap, Rule } from '../../models/rules.interface';

const MOCK_RULE_MANDATORY: Rule = {
  id: 'r1',
  title: 'Mandatory Rule',
  description: 'Must do this',
  category: 'Mandatory',
  level: 1,
  priority: 1,
  validate: () => ({ satisfied: false }),
};

const MOCK_RULE_GOAL: Rule = {
  id: 'r2',
  title: 'Goal Rule',
  description: 'Should do this',
  category: 'Goal',
  level: 1,
  priority: 2,
  scoreReward: 100,
  validate: () => ({ satisfied: true }),
};

const MOCK_CONTEXT: ValidationContext = {
  level: 1,
  metadata: { currentSemesterEcts: 0 },
} as any;

const MOCK_RESULTS: ValidationResultMap = {
  satisfied: [{ rule: MOCK_RULE_GOAL, result: { satisfied: true, message: 'Great job' } }],
  violated: [
    {
      rule: MOCK_RULE_MANDATORY,
      result: { satisfied: false, details: { currentVal: 0, requiredVal: 10 } },
    },
  ],
};

describe('Contraints', () => {
  let component: Contraints;
  let fixture: ComponentFixture<Contraints>;
  let mockRulesService: jasmine.SpyObj<RulesService>;

  beforeEach(async () => {
    mockRulesService = jasmine.createSpyObj('RulesService', [
      'getRuleCounts',
      'areRequiredRulesSatisfied',
    ]);

    mockRulesService.getRuleCounts.and.returnValue({ mandatory: 1, goal: 1, total: 2 });
    mockRulesService.areRequiredRulesSatisfied.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [Contraints],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RulesService, useValue: mockRulesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Contraints);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('validationContext', MOCK_CONTEXT);
    fixture.componentRef.setInput('validationResults', MOCK_RESULTS);
    fixture.componentRef.setInput('canPassLevel', false);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Tab Navigation', () => {
    it('defaults to "Mandatory" tab', () => {
      const activeTabBtn = fixture.debugElement.query(By.css('.tabs button.active'));
      expect(activeTabBtn.nativeElement.textContent).toContain('MANDATORY');
    });

    it('switches to "Goal" tab on click', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.tabs button'));
      const goalBtn = buttons[1];

      goalBtn.triggerEventHandler('click');
      fixture.detectChanges();

      const activeTabBtn = fixture.debugElement.query(By.css('.tabs button.active'));
      expect(activeTabBtn.nativeElement.textContent).toContain('GOAL');
    });

    it('displays correct counts in tabs', () => {
      const buttons = fixture.debugElement.queryAll(By.css('.tabs button'));

      expect(buttons[0].nativeElement.textContent).toContain('0/1');
      expect(buttons[1].nativeElement.textContent).toContain('1/1');
    });
  });

  describe('Constraint Rendering', () => {
    it('renders violated mandatory rules when on Mandatory tab', () => {
      const items = fixture.debugElement.queryAll(By.css('.constraint'));
      expect(items.length).toBe(1);

      const title = items[0].query(By.css('h4')).nativeElement.textContent;
      expect(title).toBe('Mandatory Rule');

      const values = items[0].query(By.css('.value'));

      expect(values.nativeElement.textContent.replace(/\s/g, '')).toContain('0/10');
    });

    it('renders satisfied goal rules when on Goal tab', () => {
      component.switchTab('Goal');
      fixture.detectChanges();

      const items = fixture.debugElement.queryAll(By.css('.constraint'));
      expect(items.length).toBe(1);

      const title = items[0].query(By.css('h4')).nativeElement.textContent;
      expect(title).toBe('Goal Rule');

      const reward = items[0].query(By.css('.mini-score'));

      expect(reward.nativeElement.textContent).toContain('⭐100');
    });
  });

  describe('Level Progression', () => {
    it('shows "Next Level" button only when canPassLevel signal is true', () => {
      expect(fixture.debugElement.query(By.css('.action-btn'))).toBeNull();

      fixture.componentRef.setInput('canPassLevel', true);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.action-btn'))).toBeTruthy();
    });

    it('emits onClickNextLevel when button is clicked', () => {
      fixture.componentRef.setInput('canPassLevel', true);
      fixture.detectChanges();

      let emitted = false;
      component.onClickNextLevel.subscribe(() => (emitted = true));

      const btn = fixture.debugElement.query(By.css('.action-btn'));
      btn.triggerEventHandler('click');

      expect(emitted).toBeTrue();
    });
  });
});
