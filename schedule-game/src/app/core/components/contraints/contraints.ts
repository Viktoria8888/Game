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

  protected readonly activeTab = signal<'Cumulative' | 'Goal' | 'Additional'>('Cumulative');

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
        if (rule.category === 'Cumulative') acc.cumulative++;
        else if (rule.category === 'Goal') acc.goal++;
        else if (rule.category === 'Additional') acc.additional++;
        acc.total++;
        return acc;
      },
      { cumulative: 0, goal: 0, additional: 0, total: 0 } as RulesCount
    );

    return [
      {
        category: 'Cumulative' as const,
        label: 'CUMULATIVE',
        count: totalCounts.cumulative,
        satisfied: satisfiedCounts.cumulative,
      },
      {
        category: 'Goal' as const,
        label: 'GOAL',
        count: totalCounts.goal,
        satisfied: satisfiedCounts.goal,
      },
      {
        category: 'Additional' as const,
        label: 'ADDITIONAL',
        count: totalCounts.additional,
        satisfied: satisfiedCounts.additional,
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

  switchTab(category: 'Cumulative' | 'Additional' | 'Goal') {
    this.activeTab.set(category);
  }

  getConstraintIcon(constraint: ConstraintDisplay): string {
    if (constraint.isSatisfied) return '✓';

    if (constraint.category === 'Cumulative' || constraint.category === 'Goal') {
      return '✗';
    }

    return '○';
  }
}
