import { Injectable } from '@angular/core';
import {
  Rule,
  ValidationContext,
  ValidationResult,
  ValidationResultMap,
} from '../models/rules.interface';

@Injectable({ providedIn: 'root' })
export class ValidationService {
  validateAll(rules: ReadonlyArray<Rule>, context: ValidationContext): ValidationResultMap {
    const activeRules = rules.filter((rule) => !rule.isActive || rule.isActive(context));

    return activeRules.reduce<ValidationResultMap>(
      (acc, rule) => {
        const result = rule.validate(context);

        return result.satisfied
          ? {
              satisfied: [...acc.satisfied, rule],
              violated: acc.violated,
            }
          : {
              satisfied: acc.satisfied,
              violated: [...acc.violated, rule],
            };
      },
      { satisfied: [], violated: [] }
    );
  }

  validateRule(rule: Rule, context: ValidationContext): ValidationResult {
    return rule.validate(context);
  }

  calculateScore(results: ValidationResultMap): number {
    const total = results.satisfied.length + results.violated.length;
    if (total === 0) return 0;
    return (results.satisfied.length / total) * 100;
  }
}
