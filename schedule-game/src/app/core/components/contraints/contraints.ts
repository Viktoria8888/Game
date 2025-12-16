import { Component, computed, inject, input, output, Signal, signal } from '@angular/core';
import { RulesCount, RulesService } from '../../services/rules.service';
import { Rule, ValidationContext, ValidationResultMap } from '../../models/rules.interface';

interface ConstraintDisplay extends Rule {
  isSatisfied: boolean;
  currentValue?: number;
  targetValue?: number;
  hint?: string;
}

@Component({
  selector: 'app-contraints',
  imports: [],
  templateUrl: './contraints.html',
  styleUrl: './contraints.scss',
})
export class Contraints {
  private readonly rulesService = inject(RulesService);

  readonly validationContext = input.required<ValidationContext>();
  readonly validationResults = input.required<ValidationResultMap>();

  readonly onClickNextLevel = output();

  protected readonly activeTab = signal<'Mandatory' | 'Goal'>('Mandatory');

  protected readonly activeConstraints = computed(() => {
    const category = this.activeTab();
    const results = this.validationResults();
    const allRules: ConstraintDisplay[] = [
      ...results.satisfied
        .filter((rule) => rule.category === category)
        .map((rule) => ({
          ...rule,
          isSatisfied: true,
          currentValue: undefined,
          targetValue: undefined,
          hint: undefined,
        })),
      ...results.violated
        .filter((rule) => rule.category === category)
        .map((rule) => ({
          ...rule,
          isSatisfied: false,
          currentValue: undefined,
          targetValue: undefined,
          hint: undefined,
        })),
    ];
    return allRules;
  });

  protected readonly tabInfo = computed(() => {
    const results = this.validationResults();
    const context = this.validationContext();

    const totalCounts = this.rulesService.getRuleCounts(context);
    const satisfiedCounts = results.satisfied.reduce(
      (acc, rule) => {
        if (rule.category === 'Mandatory') acc.mandatory++;
        else if (rule.category === 'Goal') acc.goal++;
        acc.total++;
        return acc;
      },
      { mandatory: 0, goal: 0, total: 0 } as RulesCount
    );

    return [
      {
        category: 'Mandatory' as const,
        label: 'MANDATORY',
        count: totalCounts.mandatory,
        satisfied: satisfiedCounts.mandatory,
      },
      {
        category: 'Goal' as const,
        label: 'GOAL',
        count: totalCounts.goal,
        satisfied: satisfiedCounts.goal,
      },
    ];
  });

  protected readonly canPassLevel = computed(() => {
    const results = this.validationResults();
    return this.rulesService.areRequiredRulesSatisfied(results);
  });

  goNextLevel() {
    this.onClickNextLevel.emit();
  }

  switchTab(category: 'Mandatory' | 'Goal') {
    this.activeTab.set(category);
  }

  getConstraintIcon(constraint: ConstraintDisplay): string {
    if (constraint.isSatisfied) return '✓';

    if (constraint.category === 'Mandatory') {
      return '✗';
    }

    return '○';
  }
}
