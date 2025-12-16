import { Component, inject, input } from '@angular/core';
import { Course, Tag, TAG_MAP } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses-selection';
import { MatTooltipModule } from '@angular/material/tooltip';
@Component({
  selector: 'app-courses',
  imports: [MatTooltipModule],
  templateUrl: './courses-list.html',
  styleUrl: './courses-list.scss',
})
export class Courses {
  private readonly courseSelection = inject(CourseSelectionService);
  readonly availableCourses = input.required<Course[]>();
  protected readonly getTagTitle = (tag: Tag) => {
    return TAG_MAP[tag];
  };
  handleCourse(course: Course) {
    try {
      this.courseSelection.addCourse(course);
    } catch (error: any) {
      alert(error.message);
    }
  }
}
