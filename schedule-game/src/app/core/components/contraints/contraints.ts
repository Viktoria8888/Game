import { Component, computed, inject, input, output, Signal, signal } from '@angular/core';
import { RulesCount, RulesService } from '../../services/rules.service';
import { Rule, ValidationContext, ValidationResultMap } from '../../models/rules.interface';
import { MatTooltip } from '@angular/material/tooltip';

interface ConstraintDisplay extends Rule {
  isSatisfied: boolean;
  currentValue?: number;
  targetValue?: number;
  hint?: string;
}

@Component({
  selector: 'app-contraints',
  imports: [MatTooltip],
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
        .filter((item) => item.rule.category === category)
        .map((item) => ({
          ...item.rule,
          isSatisfied: true,
          hint: item.result.message,
          currentValue: undefined,
          targetValue: undefined,
        })),

      ...results.violated
        .filter((item) => item.rule.category === category)
        .map((item) => ({
          ...item.rule,
          isSatisfied: false,
          hint: item.result.message,
          currentValue: item.result.details?.currentVal,
          targetValue: item.result.details?.requiredVal,
        })),
    ];

    return allRules.sort((a, b) => Number(a.isSatisfied) - Number(b.isSatisfied));
  });

  protected readonly tabInfo = computed(() => {
    const results = this.validationResults();
    const context = this.validationContext();

    const totalCounts = this.rulesService.getRuleCounts(context);
    const satisfiedCounts = results.satisfied.reduce(
      (acc, item) => {
        if (item.rule.category === 'Mandatory') acc.mandatory++;
        else if (item.rule.category === 'Goal') acc.goal++;
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
