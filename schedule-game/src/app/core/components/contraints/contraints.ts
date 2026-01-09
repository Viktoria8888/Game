import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RulesCount, RulesService } from '../../services/rules.service';
import { Rule, ValidationContext, ValidationResultMap } from '../../models/rules.interface';
import { MatTooltip } from '@angular/material/tooltip';
import { SoundService } from '../../services/sounds.service';

interface ConstraintDisplay extends Rule {
  isSatisfied: boolean;
  currentValue?: number;
  targetValue?: number;
  hint?: string;
  showHint?: boolean;
}

@Component({
  selector: 'app-contraints',
  imports: [MatTooltip],
  templateUrl: './contraints.html',
  styleUrl: './contraints.scss',
})
export class Contraints {
  private readonly rulesService = inject(RulesService);
  private readonly soundsService = inject(SoundService);

  readonly isTouch = window.matchMedia('(pointer: coarse)').matches; // TEST !!!

  readonly validationContext = input.required<ValidationContext>();
  readonly validationResults = input.required<ValidationResultMap>();
  readonly canPassLevel = input.required<boolean>();
  readonly onClickNextLevel = output();

  constructor() {
    effect(() => {
      const passed = this.canPassLevel();

      if (passed) {
        this.soundsService.play('success');
      }
    });
  }
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

    return allRules.sort(
      (a, b) => Number(a.isSatisfied) - Number(b.isSatisfied) || a.priority - b.priority
    );
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

  switchTab(category: 'Mandatory' | 'Goal') {
    this.soundsService.play('tab');
    this.activeTab.set(category);
  }

  goNextLevel() {
    this.onClickNextLevel.emit();
  }

  getConstraintIcon(constraint: ConstraintDisplay): string {
    if (constraint.isSatisfied) return '✓';
    if (constraint.category === 'Mandatory') return '✗';
    return '○';
  }

  toggleHint(constraint: ConstraintDisplay) {
    // test
    if (!this.isTouch || !constraint.hint) return;
    constraint.showHint = !constraint.showHint;
  }

  scrollContainer = viewChild<ElementRef>('scrollContainer'); //test
  onWheel(event: WheelEvent) {
    if (this.isTouch) return;

    if (event.deltaY !== 0) {
      event.preventDefault();
      this.scrollContainer()!.nativeElement.scrollLeft += event.deltaY;
    }
  }
}
