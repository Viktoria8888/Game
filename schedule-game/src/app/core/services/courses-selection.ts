import { Injectable, Signal, computed, WritableSignal, signal, effect } from '@angular/core';
import { Course } from '../models/course.interface';

/**
 * Manages which courses the user has selected.
 * Handles collision detection and validation.
 */
@Injectable({ providedIn: 'root' })
export class CourseSelectionService {
  private readonly selectedCoursesSignal: WritableSignal<Course[]> = signal([]);

  public readonly selectedCourses: Signal<Course[]> = this.selectedCoursesSignal.asReadonly();

  public readonly collisions = computed(() => {
    return this.findAllCollisions(this.selectedCoursesSignal());
  });

  public readonly isValid = computed(() => {
    return this.collisions().size === 0;
  });

  canAddCourse(course: Course): { canAdd: boolean; conflicts: Course[] } {
    const conflicts: Course[] = [];
    const selected = this.selectedCoursesSignal();

    for (const existingCourse of selected) {
      if (this.timeBlocksCollide(course.schedule, existingCourse.schedule)) {
        conflicts.push(existingCourse);
      }
    }

    return { canAdd: conflicts.length === 0, conflicts };
  }

  /**
   * Add a course to selection
   * @throws Error if course conflicts or already selected
   */
  addCourse(course: Course): void {
    if (this.selectedCoursesSignal().some((c) => c.id === course.id)) {
      throw new Error(`Course "${course.name}" is already selected`);
    }

    const { canAdd, conflicts } = this.canAddCourse(course);
    if (!canAdd) {
      const conflictNames = conflicts.map((c) => c.name).join(', ');
      throw new Error(`Cannot add "${course.name}". Conflicts with: ${conflictNames}`);
    }

    this.selectedCoursesSignal.update((courses) => [...courses, course]);
  }

  removeCourse(courseId: string): void {
    this.selectedCoursesSignal.update((courses) => courses.filter((c) => c.id !== courseId));
  }

  clearAll(): void {
    this.selectedCoursesSignal.set([]);
  }

  setSelectedCourses(courses: Course[]): void {
    this.selectedCoursesSignal.set(courses);
  }

  private findAllCollisions(courses: Course[]): Set<string> {
    const collisions: Set<string> = new Set();
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        if (this.timeBlocksCollide(courses[i].schedule, courses[j].schedule)) {
          collisions.add(courses[i].id);
          collisions.add(courses[j].id);
        }
      }
    }
    return collisions;
  }

  private timeBlocksCollide(
    block1: { day: string; startTime: number; durationHours: number },
    block2: { day: string; startTime: number; durationHours: number }
  ): boolean {
    if (block1.day !== block2.day) return false;

    const block1End = block1.startTime + block1.durationHours;
    const block2End = block2.startTime + block2.durationHours;

    return block1.startTime < block2End && block2.startTime < block1End;
  }
}
