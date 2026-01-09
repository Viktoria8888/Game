import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Course, Tag, TAG_MAP } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses-selection';
import { HistoryService } from '../../services/history.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { SUBJECTS } from '../../../data/subjects';
import { SoundService } from '../../services/sounds.service';
import { SubjectNamePipe } from '../../pipes/subject-pipe';

@Component({
  selector: 'app-courses',
  imports: [MatTooltipModule, FormsModule, SubjectNamePipe],
  templateUrl: './courses-list.html',
  styleUrl: './courses-list.scss',
})
export class Courses {
  private readonly courseSelection = inject(CourseSelectionService);
  private readonly historyService = inject(HistoryService);
  private readonly soundService = inject(SoundService);
  readonly availableCourses = input.required<Course[]>();
  readonly currentLevel = input.required<number>();

  readonly searchTerm = signal('');
  readonly nameStartChar = signal('');
  readonly onlyMetPrerequisites = signal(false);

  readonly selectedTags = signal<Set<Tag>>(new Set());
  readonly selectedTypes = signal<Set<string>>(new Set());

  readonly ectsFilter = signal<number | null>(null);

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
    const ectsInput = this.ectsFilter();

    const startChar = this.nameStartChar().toLowerCase();
    const checkPrereqs = this.onlyMetPrerequisites();
    const takenIds = this.historyService.previouslyTakenCourseIds();

    return courses.filter((course) => {
      const matchesSearch = course.name.toLowerCase().includes(search);
      const matchesTags = tags.size === 0 || (course.tags?.some((t) => tags.has(t)) ?? false);
      const matchesType = types.size === 0 || types.has(course.type);
      const matchesStartChar = !startChar || course.name.toLowerCase().startsWith(startChar);

      let totalSubjectEcts = 0;
      SUBJECTS.find((c) => c.id === course.subjectId)?.components.forEach(
        (comp) => (totalSubjectEcts += comp.ects)
      );

      const matchesEcts =
        ectsInput === null ||
        ectsInput === undefined ||
        String(ectsInput) === '' ||
        totalSubjectEcts === Number(ectsInput);

      let matchesPrereqs = true;
      if (checkPrereqs) {
        if (course.prerequisites && course.prerequisites.length > 0) {
          matchesPrereqs = course.prerequisites.every((id) => takenIds.has(id));
        }
      }

      return (
        matchesSearch &&
        matchesTags &&
        matchesType &&
        matchesEcts &&
        matchesStartChar &&
        matchesPrereqs
      );
    });
  });

  protected readonly getTagTitle = (tag: Tag) => {
    return TAG_MAP[tag];
  };

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
      this.soundService.play('add');
      this.courseSelection.addCourse(course);
    } catch (error: any) {
      alert(error.message);
    }
  }

  clearTags() {
    this.selectedTags.set(new Set());
  }

  playTypingSound() {
    this.soundService.play('typing');
  }
}
