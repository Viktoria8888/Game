import { Component, computed, inject, signal } from '@angular/core';
import { CourseSelectionService } from '../../services/courses-selection';
import { ScheduleService } from '../../services/schedule.service';
import { Course } from '../../models/course.interface';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { Contraints } from '../contraints/contraints';
import { ValidationContext } from '../../models/rules.interface';
import { Courses } from '../courses-list/courses-list';
import { GameService } from '../../services/game.service';
import { PersistenceService } from '../../services/persistence.service';
import { LevelSummary } from '../level-summary/level-summary';

@Component({
  selector: 'app-schedule-manager',
  imports: [ScheduleGrid, HeaderComponent, Contraints, Courses, LevelSummary],
  templateUrl: './schedule-manager.html',
  styleUrl: './schedule-manager.scss',
})
export class ScheduleManagerComponent {
  protected readonly gameService = inject(GameService);
  private readonly courseSelection = inject(CourseSelectionService);
  protected readonly schedule = inject(ScheduleService);
  protected readonly authService = inject(AuthService);
  private readonly persistency = inject(PersistenceService);

  protected readonly selectedCourses = this.courseSelection.selectedCourses;
  protected readonly collisions = this.courseSelection.collisions;
  protected readonly scheduleSlots = this.schedule.scheduleSlots;
  protected readonly metadata = this.schedule.simpleMetadata;
  protected readonly currentLevel = this.gameService.currentLevel;
  protected readonly availableCourses = this.gameService.availableCourses;

  protected showLevelSummary = signal(false);

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
    this.showLevelSummary.set(true);
  }

  proceedToNextLevel() {
    this.gameService.completeLevel();
    this.persistency.saveImmediately();
    this.showLevelSummary.set(false);
  }

  triggerConflictShake(ids: string[]) {
    this.shakingCourseIds.set(new Set(ids));

    setTimeout(() => {
      this.shakingCourseIds.set(new Set());
    }, 500);
  }
}
