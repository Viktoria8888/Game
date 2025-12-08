import { TestBed } from '@angular/core/testing';
import { Rule, ValidationContext, ValidationResultMap } from '../../models/rules.interface';
import { ValidationService } from '../validation.service';
import { provideZonelessChangeDetection } from '@angular/core';

const MOCK_CONTEXT: ValidationContext = {} as ValidationContext;

const RULE_PASS: Rule = {
  id: 'pass',
  title: 'Passing Rule',
  description: 'Always Passes',
  category: 'Goal',
  level: null,
  priority: 1,
  validate: () => ({ satisfied: true }),
};

const RULE_FAIL: Rule = {
  id: 'fail',
  title: 'Failing Rule',
  description: 'Always Fails',
  category: 'Cumulative',
  level: 1,
  priority: 10,
  validate: () => ({ satisfied: false, message: 'Failure reason' }),
};

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), ValidationService],
    });
    service = TestBed.inject(ValidationService);
  });

  it('validateAll: separates rules into satisfied and violated lists', () => {
    const rules: Rule[] = [RULE_PASS, RULE_FAIL];

    const result = service.validateAll(rules, MOCK_CONTEXT);

    expect(result.satisfied.length).toBe(1);
    expect(result.satisfied[0]).toBe(RULE_PASS);

    expect(result.violated.length).toBe(1);
    expect(result.violated[0]).toBe(RULE_FAIL);
  });

  it('validateRule: returns result for a single rule', () => {
    const result = service.validateRule(RULE_FAIL, MOCK_CONTEXT);

    expect(result.satisfied).toBeFalse();
    expect(result.message).toBe('Failure reason');
  });

  it('calculateScore: handles division by zero (empty results) by returning 0', () => {
    const map: ValidationResultMap = {
      satisfied: [],
      violated: [],
    };

    expect(service.calculateScore(map)).toBe(0);
  });
});
