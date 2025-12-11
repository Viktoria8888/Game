import {
  Injectable,
  Signal,
  computed,
  WritableSignal,
  signal,
  inject,
  effect,
} from '@angular/core';
import { ScheduleSlot, Course } from '../models/course.interface';
import { ComplexGameMetadata, GameStateDTO, SimpleGameMetadata } from '../models/game_state.dto';
import { CourseSelectionService } from './courses-selection';

/**Single source of truth for the SCHEDULE
 * Takes care of metadata
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly courseSelectionService = inject(CourseSelectionService);

  public readonly scheduleSlots: Signal<ScheduleSlot[]> = computed(() => {
    const selectedCourses = this.courseSelectionService.selectedCourses();
    return this.coursesToScheduleSlots(selectedCourses);
  });

  public readonly complexMetadata = computed<ComplexGameMetadata>(() => {
    const schedule = this.scheduleSlots();
    return this.calculateComplexMetadata(schedule);
  });

  public readonly simpleMetadata = computed<SimpleGameMetadata>(() => {
    const courses = this.courseSelectionService.selectedCourses();
    const meta = this.createEmptySimpleMetadata();

    // recalculateMetaData
    for (const course of courses) {
      meta.currentSemesterEcts += course.ects;
      meta.uniqueCoursesCount += 1;

      if (course.tags) {
        course.tags.forEach((tag) => {
          meta.ectsByTag[tag] = (meta.ectsByTag[tag] ?? 0) + course.ects;
        });
      }

      meta.ectsByType[course.type] = (meta.ectsByType[course.type] ?? 0) + course.ects;
      meta.stressLevel += 10 * courses.length;
      if (course.hasExam) meta.hasExamCount += 1;
      if (course.isProseminar) meta.proseminarCount += 1;
      if (course.isMandatory) meta.mandatoryCoursesCompleted.push(course.id);
    }

    return meta;
  });

  calculateComplexMetadata(schedule: ScheduleSlot[]): ComplexGameMetadata {
    // TODO: Implement based on your game rules
    // Calculate things like:
    // - Total contact hours per week
    // - Average start/end times
    // - Gaps between classes
    // - Free days
    // - Achievements

    return {
      totalContactHours: 0,
      averageStartTime: 0,
      averageEndTime: 0,
      morningToAfternoonRatio: 0,
      maxGapInAnyDay: 0,
      totalGapTime: 0,
      freeDaysCount: 0,
      consecutiveFreeDays: 0,
      currentStreak: 0,
      bestStreak: 0,
      achievementsUnlocked: [],
    };
  }
  private coursesToScheduleSlots(courses: Course[]): ScheduleSlot[] {
    const slots: ScheduleSlot[] = [];

    for (const course of courses) {
      for (const timeBlock of course.schedule) {
        // Create 1-hour slots for this time block
        for (let hourOffset = 0; hourOffset < timeBlock.durationHours; hourOffset++) {
          const hour = timeBlock.startTime + hourOffset;

          slots.push({
            id: `${timeBlock.day}_${hour}`,
            day: timeBlock.day,
            startTime: hour,
            course: course,
          });
        }
      }
    }

    return slots;
  }

  private createEmptySimpleMetadata(): SimpleGameMetadata {
    return {
      score: 0,
      stressLevel: 0,
      currentSemesterEcts: 0,
      ectsByTag: {},
      ectsByType: {},
      hasExamCount: 0,
      uniqueCoursesCount: 0,
      proseminarCount: 0,
      mandatoryCoursesCompleted: [],
    };
  }
}
