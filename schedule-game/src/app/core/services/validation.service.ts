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
    return rules.reduce<ValidationResultMap>(
      (acc, rule) => {
        const result = rule.validate(context);
        const execution = { rule, result };

        return result.satisfied
          ? {
              satisfied: [...acc.satisfied, execution],
              violated: acc.violated,
            }
          : {
              satisfied: acc.satisfied,
              violated: [...acc.violated, execution],
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
