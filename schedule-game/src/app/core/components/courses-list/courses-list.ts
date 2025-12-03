import { Component, inject, input } from '@angular/core';
import { Course } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses';

@Component({
  selector: 'app-courses',
  imports: [],
  templateUrl: './courses-list.html',
  styleUrl: './courses-list.scss',
})
export class Courses {
  private readonly courseSelection = inject(CourseSelectionService);
  readonly availableCourses = input.required<Course[]>();

  getTypeClass(arg0: string) {
    throw new Error('Method not implemented.');
  }

  handleCourse(course: Course) {
    try {
      this.courseSelection.addCourse(course);
      console.log(`✅ Added: ${course.name}`);
    } catch (error: any) {
      alert(error.message);
    }
  }
}
