import { Component, computed, effect, inject } from '@angular/core';
import { CourseSelectionService } from '../../services/courses';
import { ScheduleService } from '../../services/schedule.service';
import { Course } from '../../models/course.interface';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';
import { Contraints } from '../contraints/contraints';
import { ValidationContext } from '../../models/rules.interface';
import { GameStateDTO, GameStateMetadata } from '../../models/game_state.dto';
import { Courses } from '../courses-list/courses-list';
import { COURSES } from '../../../data/rules/courses';

@Component({
  selector: 'app-schedule-manager',
  imports: [ScheduleGrid, HeaderComponent, Contraints, Courses],
  templateUrl: './schedule-manager.html',
  styleUrl: './schedule-manager.scss',
})
export class ScheduleManagerComponent {
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly schedule = inject(ScheduleService);
  readonly authService = inject(AuthService);

  readonly selectedCourses = this.courseSelection.selectedCourses;
  readonly collisions = this.courseSelection.collisions;
  readonly isValid = this.courseSelection.isValid;

  readonly scheduleSlots = this.schedule.scheduleSlots;
  readonly metadata = this.schedule.simpleMetadata;
  protected readonly currentLevel = this.schedule.currentLevel;

  private readonly fullMetadata: GameStateMetadata = {
    ...this.metadata(),
    ...this.schedule.complexMetadata(),
  };

  protected readonly validationContext: ValidationContext = {
    schedule: this.scheduleSlots(),
    level: this.currentLevel(),
    metadata: this.fullMetadata,
  };

  private courses: ReadonlyArray<Course> = COURSES;

  readonly availableCourses = computed(() => {
    const selected = this.selectedCourses();
    return this.courses.filter((course) => !selected.some((sc) => sc.id === course.id));
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
    effect(() => {
      this.selectedCourses();
      this.schedule.recalculateMetadata();
    });
  }

  canAddCourse(course: Course): { canAdd: boolean; conflicts: Course[] } {
    return this.courseSelection.canAddCourse(course);
  }
}
