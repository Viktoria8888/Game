import { Injectable, inject } from '@angular/core';
import { Rule, ValidationContext, ValidationResultMap } from '../models/rules.interface';
import { ValidationService } from './validation.service';
import { ALL_GAME_RULES } from '../../data/rules';

export type RulesCount = {
  mandatory: number;
  goal: number;
  total: number;
};

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly validationService = inject(ValidationService);

  private readonly allRules: ReadonlyArray<Rule> = ALL_GAME_RULES;

  private getActiveRules(context: ValidationContext): ReadonlyArray<Rule> {
    return this.allRules.filter(
      (rule) =>
        rule.level === null || rule.level === context.level || rule.isActive?.(context) === true
    );
  }

  getRulesByCategory(
    context: ValidationContext,
    category: 'Mandatory' | 'Goal'
  ): ReadonlyArray<Rule> {
    const activeRules = this.getActiveRules(context);
    return activeRules.filter((rule) => rule.category === category);
  }

  getRuleCounts(context: ValidationContext): RulesCount {
    const activeRules = this.getActiveRules(context);
    const counts = activeRules.reduce(
      (acc, rule) => {
        if (rule.category === 'Mandatory') {
          acc.mandatory++;
        } else if (rule.category === 'Goal') {
          acc.goal++;
        }
        acc.total++;
        return acc;
      },
      { mandatory: 0, goal: 0, total: 0 } as RulesCount
    );

    return counts;
  }

  areRequiredRulesSatisfied(results: ValidationResultMap): boolean {
    return results.violated.every((item) => item.rule.category == 'Goal');
  }

  validate(context: ValidationContext): ValidationResultMap {
    const activeRules = this.getActiveRules(context);
    const results = this.validationService.validateAll(activeRules, context);
    return results;
  }

  validateByCategory(
    context: ValidationContext,
    category: 'Mandatory' | 'Goal'
  ): ValidationResultMap {
    const categoryRules = this.getRulesByCategory(context, category);
    const results = this.validationService.validateAll(categoryRules, context);
    return results;
  }
}
