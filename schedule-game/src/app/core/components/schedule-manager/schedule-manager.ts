import { Component, computed, effect, inject } from '@angular/core';
import { CourseSelectionService } from '../../services/courses';
import { ScheduleService } from '../../services/schedule.service';
import { Course } from '../../models/course.interface';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { Contraints } from '../contraints/contraints';
import { ValidationContext, ValidationResultMap } from '../../models/rules.interface';
import { GameStateDTO, GameStateMetadata } from '../../models/game_state.dto';
import { Courses } from '../courses-list/courses-list';
import { COURSES } from '../../../data/rules/courses';
import { RulesService } from '../../services/rules.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-schedule-manager',
  imports: [ScheduleGrid, HeaderComponent, Contraints, Courses],
  templateUrl: './schedule-manager.html',
  styleUrl: './schedule-manager.scss',
})
export class ScheduleManagerComponent {
  private readonly gameService = inject(GameService);
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly schedule = inject(ScheduleService);
  private readonly rulesService = inject(RulesService);
  protected readonly authService = inject(AuthService);

  protected readonly selectedCourses = this.courseSelection.selectedCourses;
  protected readonly collisions = this.courseSelection.collisions;
  protected readonly scheduleSlots = this.schedule.scheduleSlots;
  protected readonly metadata = this.schedule.simpleMetadata;
  protected readonly currentLevel = this.gameService.currentLevel;

  protected readonly validationContext = computed<ValidationContext>(() => ({
    schedule: this.scheduleSlots(),
    level: this.currentLevel(),
    metadata: {
      ...this.schedule.simpleMetadata(),
      ...this.schedule.complexMetadata(),
    },
  }));

  private courses: ReadonlyArray<Course> = COURSES;
  protected readonly availableCourses = computed(() => {
    const selected = this.selectedCourses();
    return this.courses.filter((course) => !selected.some((sc) => sc.id === course.id));
  });

  protected readonly validationResults = computed<ValidationResultMap>(() => {
    return this.rulesService.validate(this.validationContext());
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

  constructor() {
    effect(
      () => {
        const courses = this.selectedCourses();

        this.schedule.recalculateMetadata();

        const result = this.validationResults();
        console.log('Validation results:', result);
        console.log('Metadata:', this.schedule.simpleMetadata());
        console.log('Rules validated for:', courses.length, 'courses');
      },
      { allowSignalWrites: true }
    );
  }

  handleNextLevel() {
    this.gameService.completeLevel()
  }
}
