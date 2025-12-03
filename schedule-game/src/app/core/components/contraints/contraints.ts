import { Component, computed, inject, input, Signal, signal } from '@angular/core';
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

  readonly activeTab = signal<'Cumulative' | 'Goal' | 'Additional'>('Cumulative');

  readonly activeConstraints = computed(() => {
    const context = this.validationContext();
    const category = this.activeTab();
    const results = this.rulesService.validateByCategory(context, category);

    const allRules: ConstraintDisplay[] = [
      ...results.satisfied.map((rule) => ({
        ...rule,
        isSatisfied: true,
        currentValue: undefined,
        targetValue: undefined,
        hint: undefined,
      })),
      ...results.violated.map((rule) => ({
        ...rule,
        isSatisfied: false,
        currentValue: undefined,
        targetValue: undefined,
        hint: undefined,
      })),
    ];

    return allRules;
  });

  readonly tabInfo = computed(() => {
    const counts: RulesCount = this.rulesService.getRuleCounts(this.validationContext());
    const satisfiedCount: RulesCount = this.rulesService.getSatisfiedCount(
      this.validationContext()
    );

    return [
      {
        category: 'Cumulative' as const,
        label: 'CUMULATIVE',
        count: counts.cumulative,
        satisfied: satisfiedCount.cumulative,
      },
      {
        category: 'Goal' as const,
        label: 'GOAL',
        count: counts.goal,
        satisfied: satisfiedCount.goal,
      },
      {
        category: 'Additional' as const,
        label: 'ADDITIONAL',
        count: counts.additional,
        satisfied: satisfiedCount.additional,
      },
    ];
  });

  readonly canPassLevel = computed(() => {
    const context = this.validationContext();
    return this.rulesService.areRequiredRulesSatisfied(context);
  });

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
