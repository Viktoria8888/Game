import { Injectable, inject, signal, computed } from '@angular/core';
import { HistoryService } from './history.service';
import { CourseSelectionService } from './courses-selection';
import { GameStateDTO, GameStateMetadata } from '../models/game_state.dto';
import { ScheduleService } from './schedule.service';
import { RulesService } from './rules.service';
import { ValidationContext, ValidationResultMap } from '../models/rules.interface';
import { COURSES, RESERVED_COURSES } from '../../data/courses';

export type SemesterOutcome = {
  scoreChange: number;
  predictedTotalScore: number;
  validation: ValidationResultMap;
  goalRules: number;
  willpowerCost: number;
  willpowerBudget: number;
  isBudgetExceeded: boolean;
  costBreakdown: string[];
};

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly schedule = inject(ScheduleService);
  private readonly rulesService = inject(RulesService);
  readonly history = inject(HistoryService);

  readonly currentLevel = signal(1);
  readonly isInitialized = signal(false);
  readonly totalScore = signal(0);

  readonly SEMESTER_BUDGET = 20;

  readonly availableCourses = computed(() => {
    const selected = this.courseSelection.selectedCourses();
    const takenIds = this.history.previouslyTakenCourseIds();
    const level = this.currentLevel();

    return COURSES.filter((course) => {
      const isSelected = selected.some((sc) => sc.id === course.id);
      const isTaken = takenIds.has(course.subjectId);
      if (isSelected || isTaken) return false;
      const reservedLevel = RESERVED_COURSES[course.subjectId];
      if (reservedLevel && reservedLevel > level) {
        return false;
      }

      return true;
    });
  });

  readonly currentSemesterOutcome = computed<SemesterOutcome>(() => {
    const baseMeta = this.schedule.simpleMetadata();
    const complexMeta = this.schedule.complexMetadata();
    const combinedMeta: GameStateMetadata = {
      ...baseMeta,
      ...complexMeta,
    };

    const validationContext: ValidationContext = {
      schedule: this.schedule.scheduleSlots(),
      history: this.history.history(),
      metadata: combinedMeta,
      coursesSelected: this.courseSelection.selectedCourses(),
      level: this.currentLevel(),
    };

    const validation = this.rulesService.validate(validationContext);
    const hasCourses = this.courseSelection.selectedCourses().length > 0;
    let scoreChange = hasCourses ? baseMeta.currentSemesterEcts * 10 : 0;

    let goalRules = 0;

    if (hasCourses) {
      validation.satisfied.forEach((item) => {
        const rule = item.rule;
        if (rule.scoreReward) scoreChange += rule.scoreReward;
        if (rule.category === 'Goal') {
          goalRules++;
        }
      });
    }
    const cost = complexMeta.willpowerCost;

    return {
      scoreChange,
      predictedTotalScore: this.totalScore() + scoreChange,
      validation,
      goalRules,
      willpowerCost: cost,
      willpowerBudget: this.SEMESTER_BUDGET,
      isBudgetExceeded: cost > this.SEMESTER_BUDGET,
      costBreakdown: complexMeta.costBreakdown,
    };
  });

  completeLevel() {
    const outcome = this.currentSemesterOutcome();

    if (!this.rulesService.areRequiredRulesSatisfied(outcome.validation)) {
      console.error('Cannot complete level: Mandatory rules violated');
      return;
    }

    if (outcome.isBudgetExceeded) {
      console.error(`Exhausted! Cost ${outcome.willpowerCost} > Budget ${outcome.willpowerBudget}`);
      return;
    }

    this.history.addRecord({
      level: this.currentLevel(),
      coursesTaken: [...new Set(this.courseSelection.selectedCourses().map((c) => c.subjectId))],
      ectsEarned: this.schedule.simpleMetadata().currentSemesterEcts,
      scoreEarned: outcome.scoreChange,
      willpowerCost: outcome.willpowerCost,
    });

    this.totalScore.set(outcome.predictedTotalScore);

    if (this.currentLevel() === 6) {
      console.log(`VICTORY! Final Score: ${this.totalScore()}`);
      return;
    }

    this.currentLevel.update((l) => l + 1);
    this.courseSelection.clearAll();
  }

  readonly gameStateSnapshot = computed<GameStateDTO>(() => {
    return {
      level: this.currentLevel(),
      history: this.history.history(),
      score: this.totalScore(),
      coursesSelected: this.courseSelection.selectedCourses(),
    };
  });

  markAsInitialized() {
    this.isInitialized.set(true);
  }

  restoreState(state: GameStateDTO) {
    this.currentLevel.set(state.level);
    this.history.setHistory(state.history || []);
    this.courseSelection.setSelectedCourses(state.coursesSelected);
    this.totalScore.set(state.score);
  }
}
