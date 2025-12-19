import {
  Injectable,
  Signal,
  computed,
  WritableSignal,
  signal,
  inject,
  effect,
} from '@angular/core';
import { ScheduleSlot, Course, Day } from '../models/course.interface';
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

    if (schedule.length === 0) {
      return this.createEmptyComplexMetadata();
    }

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
      meta.stressLevel += course.ects;
      if (course.hasExam) meta.hasExamCount += 1;
      if (course.isProseminar) meta.proseminarCount += 1;
      if (course.isMandatory) meta.mandatoryCoursesCompleted.push(course.id);
    }

    return meta;
  });

  calculateComplexMetadata(schedule: ScheduleSlot[]): ComplexGameMetadata {
    const hoursByDay: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };

    schedule.forEach((slot) => hoursByDay[slot.day].push(slot.startTime));

    Object.values(hoursByDay).forEach((hours) => hours.sort((a, b) => a - b));

    let totalGapTime = 0;
    let maxGapInAnyDay = 0;
    let startHourSum = 0;
    let activeDaysCount = 0;

    const freeDaysCount = Object.values(hoursByDay).reduce((freeCount, hours) => {
      if (hours.length === 0) return freeCount + 1;

      activeDaysCount++;
      startHourSum += hours[0];

      for (let i = 0; i < hours.length - 1; i++) {
        const gap = hours[i + 1] - hours[i] - 1;

        if (gap > 0) {
          totalGapTime += gap;
          maxGapInAnyDay = Math.max(maxGapInAnyDay, gap);
        }
      }
      return freeCount;
    }, 0);

    const totalContactHours = schedule.length; // 1 slot = 1 hour
    const morningSlots = schedule.filter((s) => s.startTime < 12).length;

    const averageStartTime = activeDaysCount > 0 ? startHourSum / activeDaysCount : 0;
    const morningToAfternoonRatio = totalContactHours > 0 ? morningSlots / totalContactHours : 0;

    const achievements: string[] = [];

    if (activeDaysCount > 0) {
      if (averageStartTime < 10) achievements.push('Early Bird');
      else if (averageStartTime >= 12) achievements.push('Night Owl');

      if (totalGapTime > 5) {
        achievements.push('Campus Resident');
      } else if (totalGapTime === 0 && totalContactHours >= 10) {
        achievements.push('Speedrunner');
      }

      if (totalContactHours < 12) {
        achievements.push('Part-Timer');
      }
      if (freeDaysCount >= 2) {
        achievements.push('Long Weekender');
      }
      // (40-60% Morning)
      if (morningToAfternoonRatio >= 0.4 && morningToAfternoonRatio <= 0.6) {
        achievements.push('Zen Balanced');
      }
    }

    return {
      totalContactHours,
      averageStartTime,
      morningToAfternoonRatio,
      maxGapInAnyDay,
      totalGapTime,
      freeDaysCount,
      achievementsUnlocked: achievements,
    };
  }

  private coursesToScheduleSlots(courses: Course[]): ScheduleSlot[] {
    const slots: ScheduleSlot[] = [];

    for (const course of courses) {
      const timeBlock = course.schedule;
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

  private createEmptyComplexMetadata(): ComplexGameMetadata {
    return {
      totalContactHours: 0,
      averageStartTime: 0,
      morningToAfternoonRatio: 0,

      maxGapInAnyDay: 0,
      totalGapTime: 0,

      freeDaysCount: 5,

      achievementsUnlocked: [],
    };
  }
}
