import { Injectable, Signal, computed, WritableSignal, signal, inject } from '@angular/core';
import { ScheduleSlot, Course } from '../models/course.interface';
import { ComplexGameMetadata, GameStateDTO, SimpleGameMetadata } from '../models/game_state.dto';
import { CourseSelectionService } from './courses';

/**Single source of truth for the SCHEDULE
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly courseSelectionService = inject(CourseSelectionService);

  public readonly currentLevel: WritableSignal<number> = signal(1);

  private readonly simpleMetadataSignal = signal<SimpleGameMetadata>(
    this.createEmptySimpleMetadata()
  );

  public readonly scheduleSlots: Signal<ScheduleSlot[]> = computed(() => {
    const selectedCourses = this.courseSelectionService.selectedCourses();
    return this.coursesToScheduleSlots(selectedCourses);
  });

  public readonly complexMetadata = computed<ComplexGameMetadata>(() => {
    const schedule = this.scheduleSlots();
    return this.calculateComplexMetadata(schedule);
  });

  public readonly simpleMetadata = this.simpleMetadataSignal.asReadonly();

  public readonly gameState: Signal<GameStateDTO> = computed(() => ({
    level: this.currentLevel(),
    schedule: this.scheduleSlots(),
  }));

  recalculateMetadata(): void {
    const courses = this.courseSelectionService.selectedCourses();
    const meta = this.createEmptySimpleMetadata();

    for (const course of courses) {
      meta.totalEctsAccumulated += course.ects;
      meta.uniqueCoursesCount += 1;

      if (course.tags) {
        course.tags.forEach((tag) => {
          meta.ectsByTag[tag] = (meta.ectsByTag[tag] ?? 0) + course.ects;
        });
      }

      meta.ectsByType[course.type] = (meta.ectsByType[course.type] ?? 0) + course.ects;

      if (course.hasExam) meta.hasExamCount += 1;
      if (course.isProseminar) meta.proseminarCount += 1;
      if (course.isMandatory) meta.mandatoryCoursesCompleted.push(course.id);
    }

    this.simpleMetadataSignal.set(meta);
  }

  setState(state: GameStateDTO): void {
    const uniqueCourses = new Map<string, Course>();

    state.schedule.forEach((slot) => {
      if (slot.course) {
        uniqueCourses.set(slot.course.id, slot.course);
      }
    });

    this.courseSelectionService.setSelectedCourses(Array.from(uniqueCourses.values()));

    this.currentLevel.set(state.level);

    this.recalculateMetadata();
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
      score: 200,
      stressLevel: 100,
      totalEctsAccumulated: 0,
      ectsByTag: {},
      ectsByType: {},
      hasExamCount: 0,
      uniqueCoursesCount: 0,
      proseminarCount: 0,
      mandatoryCoursesCompleted: [],
    };
  }

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
}
