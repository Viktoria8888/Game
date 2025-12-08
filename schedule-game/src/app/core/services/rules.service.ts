import { Injectable, inject } from '@angular/core';
import { RULES } from '../../data/rules/level1.rules';
import {
  Rule,
  ValidationContext,
  ValidationResult,
  ValidationResultMap,
} from '../models/rules.interface';
import { ValidationService } from './validation.service';

export type RulesCount = {
  cumulative: number;
  goal: number;
  additional: number;
  total: number;
};

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly validationService = inject(ValidationService);

  private readonly allRules: ReadonlyArray<Rule> = RULES;

  private getActiveRules(context: ValidationContext): ReadonlyArray<Rule> {
    return this.allRules.filter(
      (rule) =>
        rule.level === null || rule.level === context.level || rule.isActive?.(context) === true
    );
  }

  getRulesByCategory(
    context: ValidationContext,
    category: 'Cumulative' | 'Goal' | 'Additional'
  ): ReadonlyArray<Rule> {
    const activeRules = this.getActiveRules(context);
    return activeRules.filter((rule) => rule.category === category);
  }

  getRuleCounts(context: ValidationContext): RulesCount {
    const activeRules = this.getActiveRules(context);
    const counts = activeRules.reduce(
      (acc, rule) => {
        if (rule.category === 'Cumulative') {
          acc.cumulative++;
        } else if (rule.category === 'Goal') {
          acc.goal++;
        } else if (rule.category === 'Additional') {
          acc.additional++;
        }
        acc.total++;
        return acc;
      },
      { cumulative: 0, goal: 0, additional: 0, total: 0 } as RulesCount
    );

    return counts;
  }

  areRequiredRulesSatisfied(results: ValidationResultMap): boolean {
    return results.violated.every((r) => r.category == 'Additional');
  }

  validate(context: ValidationContext): ValidationResultMap {
    const activeRules = this.getActiveRules(context);
    const results = this.validationService.validateAll(activeRules, context);
    return results;
  }

  validateByCategory(
    context: ValidationContext,
    category: 'Cumulative' | 'Goal' | 'Additional'
  ): ValidationResultMap {
    const categoryRules = this.getRulesByCategory(context, category);
    const results = this.validationService.validateAll(categoryRules, context);
    return results;
  }
}
