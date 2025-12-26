import { Component, computed, effect, inject, signal } from '@angular/core';
import { CourseSelectionService } from '../../services/courses-selection';
import { ScheduleService } from '../../services/schedule.service';
import { Course } from '../../models/course.interface';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { Contraints } from '../contraints/contraints';
import { ValidationContext, ValidationResultMap } from '../../models/rules.interface';
import { Courses } from '../courses-list/courses-list';
import { GameService } from '../../services/game.service';
import { PersistenceService } from '../../services/persistence.service';
import { COURSES } from '../../../data/courses';
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

  protected showLevelSummary = signal(false);

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

  private courses: ReadonlyArray<Course> = COURSES;
  protected readonly availableCourses = computed(() => {
    const selected = this.selectedCourses();
    const takenIds = this.gameService.history.previouslyTakenCourseIds();

    return this.courses.filter((course) => {
      const isSelected = selected.some((sc) => sc.id === course.id);
      const isTaken = takenIds.has(course.subjectId);

      return !isSelected && !isTaken;
    });
  });

  protected readonly validationResults = computed(() => {
    return this.gameService.currentSemesterOutcome().validation;
  });

  readonly conflictingCourseIds = computed(() => {
    const collisions = this.collisions();
    const ids = new Set<string>();
    collisions.forEach(({ course1, course2 }) => {
      ids.add(course1.id);
      ids.add(course2.id);
    });
    return ids;
  });

  handleNextLevel() {
    this.showLevelSummary.set(true);
  }

  proceedToNextLevel() {
    this.gameService.completeLevel();
    this.persistency.saveImmediately();
    this.showLevelSummary.set(false);
  }
}
