import { TestBed } from '@angular/core/testing';
import {
  Rule,
  ValidationContext,
  ValidationResultMap,
  RuleExecution,
} from '../../models/rules.interface';
import { RulesService } from '../rules.service';
import { ValidationService } from '../validation.service';
import { provideZonelessChangeDetection } from '@angular/core';

const RULE_LEVEL_1_GOAL: Rule = {
  id: 'r1',
  title: 'Level 1 Goal',
  description: '...',
  category: 'Goal',
  level: 1,
  priority: 1,
  validate: () => ({ satisfied: true }),
};

const RULE_GLOBAL_MANDATORY: Rule = {
  id: 'r2',
  title: 'Global Mandatory',
  description: '...',
  category: 'Mandatory',
  level: null,
  priority: 1,
  validate: () => ({ satisfied: true }),
};

const RULE_LEVEL_2_GOAL: Rule = {
  id: 'r3',
  title: 'Level 2 Add',
  description: '...',
  category: 'Goal',
  level: 2,
  priority: 1,
  validate: () => ({ satisfied: true }),
};

const RULE_WITH_IS_ACTIVE_TRUE: Rule = {
  id: 'r4',
  title: 'Active Rule',
  description: '...',
  category: 'Goal',
  level: 99,
  priority: 1,
  isActive: () => true,
  validate: () => ({ satisfied: true }),
};

const RULE_WITH_IS_ACTIVE_FALSE: Rule = {
  id: 'r5',
  title: 'Inactive Rule',
  description: '...',
  category: 'Goal',
  level: 5,
  priority: 1,
  isActive: () => false,
  validate: () => ({ satisfied: true }),
};

const MOCK_CONTEXT_L1: ValidationContext = {
  level: 1,
} as ValidationContext;

describe('RulesService', () => {
  let service: RulesService;
  let validationServiceSpy: jasmine.SpyObj<ValidationService>;

  const MOCK_ALL_RULES = [
    RULE_LEVEL_1_GOAL,
    RULE_GLOBAL_MANDATORY,
    RULE_LEVEL_2_GOAL,
    RULE_WITH_IS_ACTIVE_TRUE,
    RULE_WITH_IS_ACTIVE_FALSE,
  ];

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ValidationService', ['validateAll']);
    spy.validateAll.and.returnValue({ satisfied: [], violated: [] });
    validationServiceSpy = spy;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        RulesService,
        { provide: ValidationService, useValue: spy },
      ],
    });

    service = TestBed.inject(RulesService);

    (service as any).allRules = MOCK_ALL_RULES;
  });

  describe('GetRulesByCategory', () => {
    it('includes rules that match the current level', () => {
      const rules = service.getRulesByCategory(MOCK_CONTEXT_L1, 'Goal');
      expect(rules).toContain(RULE_LEVEL_1_GOAL);
    });

    it('includes rules that are Global (level null)', () => {
      const rules = service.getRulesByCategory(MOCK_CONTEXT_L1, 'Mandatory');
      expect(rules).toContain(RULE_GLOBAL_MANDATORY);
    });

    it('excludes rules from other levels', () => {
      const rules = service.getRulesByCategory(MOCK_CONTEXT_L1, 'Goal');
      expect(rules).not.toContain(RULE_LEVEL_2_GOAL);
    });

    it('includes rules with wrong level if isActive returns TRUE', () => {
      const rules = service.getRulesByCategory(MOCK_CONTEXT_L1, 'Goal');
      expect(rules).toContain(RULE_WITH_IS_ACTIVE_TRUE);
    });

    it('excludes rules with wrong level if isActive returns FALSE', () => {
      const rules = service.getRulesByCategory(MOCK_CONTEXT_L1, 'Goal');
      expect(rules).not.toContain(RULE_WITH_IS_ACTIVE_FALSE);
    });
  });

  it('getRuleCounts counts active rules by category correctly', () => {
    const counts = service.getRuleCounts(MOCK_CONTEXT_L1);

    expect(counts.goal).toBe(2);
    expect(counts.mandatory).toBe(1);
    expect(counts.total).toBe(3);
  });

  it('validate filters rules and delegates to validationService', () => {
    service.validate(MOCK_CONTEXT_L1);

    expect(validationServiceSpy.validateAll).toHaveBeenCalled();

    const args = validationServiceSpy.validateAll.calls.mostRecent().args;
    const passedRules = args[0] as Rule[];
    const passedContext = args[1];

    expect(passedRules.length).toBe(3);
    expect(passedContext).toBe(MOCK_CONTEXT_L1);
  });

  it('validateByCategory only validates rules of the specific category', () => {
    service.validateByCategory(MOCK_CONTEXT_L1, 'Mandatory');

    expect(validationServiceSpy.validateAll).toHaveBeenCalled();

    const args = validationServiceSpy.validateAll.calls.mostRecent().args;
    const passedRules = args[0] as Rule[];

    expect(passedRules.length).toBe(1);
    expect(passedRules[0]).toBe(RULE_GLOBAL_MANDATORY);
  });

  describe('AreRequiredRulesSatisfied', () => {
    const createViolation = (rule: Rule): RuleExecution => ({
      rule,
      result: { satisfied: false, message: 'fail' },
    });

    it('returns TRUE if violated list only contains Goal rules', () => {
      const result: ValidationResultMap = {
        satisfied: [],
        violated: [createViolation(RULE_LEVEL_1_GOAL)],
      };

      expect(service.areRequiredRulesSatisfied(result)).toBeTrue();
    });

    it('returns FALSE if violated list contains a Mandatory rule', () => {
      const result: ValidationResultMap = {
        satisfied: [],
        violated: [createViolation(RULE_GLOBAL_MANDATORY), createViolation(RULE_LEVEL_1_GOAL)],
      };

      expect(service.areRequiredRulesSatisfied(result)).toBeFalse();
    });
  });
});
