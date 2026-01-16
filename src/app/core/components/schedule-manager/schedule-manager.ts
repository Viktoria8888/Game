import { Component, computed, effect, inject, signal } from '@angular/core';
import { CourseSelectionService } from '../../services/courses-selection';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { Contraints } from '../contraints/contraints';
import { ValidationContext } from '../../models/rules.interface';
import { Courses } from '../courses-list/courses-list';
import { GameService } from '../../services/game.service';
import { PersistenceService } from '../../services/persistence.service';
import { TutorialComponent } from '../tutorial/tutorial';
import { LevelSummary } from '../level-summary/level-summary';
import { SoundService } from '../../services/sounds.service';

@Component({
  selector: 'app-schedule-manager',
  imports: [ScheduleGrid, HeaderComponent, Contraints, Courses, TutorialComponent, LevelSummary],
  templateUrl: './schedule-manager.html',
  styleUrl: './schedule-manager.scss',
})
export class ScheduleManagerComponent {
  protected readonly gameService = inject(GameService);
  private readonly courseSelection = inject(CourseSelectionService);
  protected readonly schedule = inject(ScheduleService);
  protected readonly authService = inject(AuthService);
  private readonly persistency = inject(PersistenceService);
  private readonly soundService = inject(SoundService);

  protected readonly selectedCourses = this.courseSelection.selectedCourses;
  protected readonly collisions = this.courseSelection.collisions;
  protected readonly scheduleSlots = this.schedule.scheduleSlots;
  protected readonly metadata = this.schedule.simpleMetadata;
  protected readonly currentLevel = this.gameService.currentLevel;
  protected readonly availableCourses = this.gameService.availableCourses;

  protected readonly shakingCourseIds = signal<Set<string>>(new Set());

  protected readonly validationContext = computed<ValidationContext>(() => ({
    schedule: this.schedule.scheduleSlots(),
    coursesSelected: this.selectedCourses(),
    history: this.gameService.history.history(),
    level: this.currentLevel(),
    metadata: {
      ...this.schedule.simpleMetadata(),
      ...this.schedule.complexMetadata(),
    },
  }));

  protected readonly validationResults = computed(() => {
    return this.gameService.currentSemesterOutcome().validation;
  });

  handleNextLevel() {
    this.gameService.showLevelSummaryModal.set(true);
    this.soundService.play('success');
  }

  proceedToNextLevel() {
    this.gameService.completeLevel();
    this.persistency.saveImmediately();
    this.gameService.showLevelSummaryModal.set(false);
  }

  triggerConflictShake(ids: string[]) {
    this.soundService.play('delete');
    this.shakingCourseIds.set(new Set(ids));

    setTimeout(() => {
      this.shakingCourseIds.set(new Set());
    }, 500);
  }

  protected readonly showTutorial = signal(false);

  constructor() {
    effect(() => {
      if (this.gameService.currentLevel() === 1) {
        this.showTutorial.set(true);
      }
    });
  }

  toggleTutorial(show: boolean) {
    this.showTutorial.set(show);
  }

  canTransfer() {
    this.soundService.play('success');
    this.gameService.canPassLevel();
  }
}
