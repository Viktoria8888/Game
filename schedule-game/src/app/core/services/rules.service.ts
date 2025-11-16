import { Injectable, inject } from '@angular/core';
import { RULES_LEVEL_1 } from '../../data/rules/level1.rules';
import { Rule, ValidationContext, ValidationResult, ValidationResultMap } from '../models/rules.interface';
import { ValidationService } from './validation.service';

@Injectable({ providedIn: 'root' })
export class RulesService {
  private readonly validationService = inject(ValidationService);

  private readonly allRules: ReadonlyArray<Rule> = [
    ...RULES_LEVEL_1,
  ];

  getActiveRules(context: ValidationContext): ReadonlyArray<Rule> {
    return this.allRules.filter((rule) => {
      rule.level == null || rule.level == context.level || rule.isActive?.(context);
    });
  }

  getById(id: string): Rule | undefined {
    return this.allRules.find((r) => r.id === id);
  }

  validate(context: ValidationContext): ValidationResultMap {
    const activeRules = this.getActiveRules(context);
    const results = this.validationService.validateAll(activeRules, context);
    return results;
  }

  validateRuleById(ruleId: string, context: ValidationContext): ValidationResult | null {
    const rule = this.getById(ruleId);
    if (!rule) return null;

    return this.validationService.validateRule(rule, context);
  }
}
