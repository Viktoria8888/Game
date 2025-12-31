import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Course, Tag, TAG_MAP } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses-selection';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-courses',
  imports: [MatTooltipModule, FormsModule],
  templateUrl: './courses-list.html',
  styleUrl: './courses-list.scss',
})
export class Courses {
  private readonly courseSelection = inject(CourseSelectionService);
  readonly availableCourses = input.required<Course[]>();

  readonly searchTerm = signal('');
  readonly selectedTags = signal<Set<Tag>>(new Set());
  readonly selectedTypes = signal<Set<string>>(new Set());

  // NEW: Track dropdown visibility
  readonly tagsDropdownOpen = signal(false);

  readonly courseConflict = output<string[]>();

  readonly availableTags = computed(() => {
    const tags = new Set<Tag>();
    this.availableCourses().forEach((c) => c.tags?.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  });

  readonly availableTypes = computed(() => {
    const types = new Set<string>();
    this.availableCourses().forEach((c) => types.add(c.type));
    return Array.from(types).sort();
  });

  readonly filteredCourses = computed(() => {
    const courses = this.availableCourses();
    const search = this.searchTerm().toLowerCase();
    const tags = this.selectedTags();
    const types = this.selectedTypes();

    return courses.filter((course) => {
      const matchesSearch = course.name.toLowerCase().includes(search);
      const matchesTags = tags.size === 0 || (course.tags?.some((t) => tags.has(t)) ?? false);
      const matchesType = types.size === 0 || types.has(course.type);

      return matchesSearch && matchesTags && matchesType;
    });
  });

  protected readonly getTagTitle = (tag: Tag) => {
    return TAG_MAP[tag];
  };

  // NEW: Toggle function
  toggleTagsDropdown() {
    this.tagsDropdownOpen.update((v) => !v);
  }

  toggleTag(tag: Tag) {
    this.selectedTags.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(tag)) newSet.delete(tag);
      else newSet.add(tag);
      return newSet;
    });
  }

  toggleType(type: string) {
    this.selectedTypes.update((current) => {
      const newSet = new Set(current);
      if (newSet.has(type)) newSet.delete(type);
      else newSet.add(type);
      return newSet;
    });
  }

  handleCourse(course: Course) {
    const { canAdd, conflicts } = this.courseSelection.canAddCourse(course);

    if (!canAdd) {
      const conflictIds = conflicts.map((c) => c.id);
      this.courseConflict.emit(conflictIds);
      return;
    }

    try {
      this.courseSelection.addCourse(course);
    } catch (error: any) {
      alert(error.message);
    }
  }
  clearTags() {
    this.selectedTags.set(new Set());
  }
}
