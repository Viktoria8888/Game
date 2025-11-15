import { Injectable } from '@angular/core';
import { Rule, ValidationContext, ValidationResultMap } from '../models/rules.interface';
import { Course, ScheduleSlot } from '../models/course.interface';


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
}
