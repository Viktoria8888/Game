import { Component, computed, effect, inject } from '@angular/core';
import { CourseSelectionService } from '../../services/course.interface';
import { ScheduleService } from '../../services/schedule.service';
import { LEVEL1_COURSES } from '../../../data/rules/courses';
import { Course } from '../../models/course.interface';
import { StatisticsPanel } from '../statistics-panel/statistics-panel';
import { ScheduleGrid } from '../schedule-grid/schedule-grid';
import { HeaderComponent } from '../header/header';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-schedule-manager',
  imports: [ScheduleGrid, HeaderComponent],
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

  readonly scheduleSlots = this.schedule.schedule;
  readonly metadata = this.schedule.simpleMetadata;
  readonly currentLevel = this.schedule.currentLevel;

  private courses: Course[] = LEVEL1_COURSES;

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

  onAddCourse(course: Course): void {
    try {
      this.courseSelection.addCourse(course);
      console.log(`✅ Added: ${course.name}`);
    } catch (error: any) {
      alert(error.message); // TODO: Replace with notification service
    }
  }

  onRemoveCourse(courseId: string): void {
    this.courseSelection.removeCourse(courseId);
  }

  canAddCourse(course: Course): { canAdd: boolean; conflicts: Course[] } {
    return this.courseSelection.canAddCourse(course);
  }
}
