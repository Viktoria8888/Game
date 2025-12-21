import { Injectable, inject, signal, computed } from '@angular/core';
import { HistoryService } from './history.service';
import { CourseSelectionService } from './courses-selection';
import { GameStateDTO, GameStateMetadata, SimpleGameMetadata } from '../models/game_state.dto';
import { ScheduleService } from './schedule.service';
import { RulesService } from './rules.service';
import { ValidationContext, ValidationResultMap } from '../models/rules.interface';

export type SemesterOutcome = {
  stressChange: number;
  scoreChange: number;
  predictedTotalStress: number;
  predictedTotalScore: number;
  validation: ValidationResultMap;
  goalRules: number;
};

@Injectable({ providedIn: 'root' })
export class GameService {
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly schedule = inject(ScheduleService);
  private readonly rulesService = inject(RulesService);
  readonly history = inject(HistoryService);

  readonly currentLevel = signal(1);
  readonly isInitialized = signal(false);

  readonly playerStress = signal(0);
  readonly totalScore = signal(0);

  readonly currentSemesterOutcome = computed<SemesterOutcome>(() => {
    const baseMeta = this.schedule.simpleMetadata();

    const combinedMeta: GameStateMetadata = {
      ...this.schedule.simpleMetadata(),
      ...this.schedule.complexMetadata(),
    };

    const validationContext: ValidationContext = {
      schedule: this.schedule.scheduleSlots(),
      history: this.history.history(),
      metadata: combinedMeta,
      coursesSelected: this.courseSelection.selectedCourses(),
      level: this.currentLevel(),
    };

    const validation = this.rulesService.validate(validationContext);

    let stressChange = baseMeta.stressLevel;
    let scoreChange = baseMeta.score;
    let goalRules = 0;
    validation.satisfied.forEach((item) => {
      const rule = item.rule;
      if (rule.stressModifier) stressChange += rule.stressModifier;
      if (rule.scoreReward) scoreChange += rule.scoreReward;
      goalRules++;
    });

    let predictedTotalStress = this.playerStress() + stressChange;
    if (predictedTotalStress < 0) predictedTotalStress = 0;

    return {
      stressChange,
      scoreChange,
      predictedTotalStress,
      predictedTotalScore: this.totalScore() + scoreChange,
      validation,
      goalRules,
    };
  });

  completeLevel() {
    const outcome = this.currentSemesterOutcome();
    if (!this.rulesService.areRequiredRulesSatisfied(outcome.validation)) {
      console.error('Cannot complete level: Mandatory rules violated');
      return;
    }

    this.history.addRecord({
      level: this.currentLevel(),
      coursesTaken: this.courseSelection.selectedCourses().map((c) => c.id),
      ectsEarned: this.schedule.simpleMetadata().currentSemesterEcts,
      scoreEarned: outcome.scoreChange,
      stressLevel: outcome.predictedTotalStress,
    });

    this.playerStress.set(outcome.predictedTotalStress);
    this.totalScore.set(outcome.predictedTotalScore);
    this.currentLevel.update((l) => l + 1);

    this.courseSelection.clearAll();

    if (this.playerStress() >= 100) {
      console.log('GAME OVER: Stress Limit Reached');
    }
  }

  readonly gameStateSnapshot = computed<GameStateDTO>(() => {
    return {
      level: this.currentLevel(),
      history: this.history.history(),
      stressLevel: this.playerStress(),
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
    this.playerStress.set(state.stressLevel);
    this.totalScore.set(state.score);
  }
}
