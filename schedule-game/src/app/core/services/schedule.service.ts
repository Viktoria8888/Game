import { Injectable, Signal, computed, inject } from '@angular/core';
import { ScheduleSlot, Course, Day } from '../models/course.interface';
import { ComplexGameMetadata, GameStateDTO, SimpleGameMetadata } from '../models/game_state.dto';
import { CourseSelectionService } from './courses-selection';

export const WILLPOWER_PRICES = {
  EARLY_RISER: 2, // 8:00 start
  NIGHT_SHIFT: 3, // Ends after 18:00
  FRIDAY_DRAG: 4, // Friday late classes
  COMMUTER_TAX: 1, // Coming to campus for only 1 class
  STARVATION: 5, // 6+ consecutive hours (No Lunch)
  AWKWARD_GAP: 1, // 1h gap
  HUGE_GAP: 2, // >3h gap
  THE_CLOPEN: 3, // Late night -> Early morning
  EXAM_STRESS: 1, // Cost per exam
};

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

    for (const course of courses) {
      meta.currentSemesterEcts += course.ects;
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

    return meta;
  });

  calculateComplexMetadata(schedule: ScheduleSlot[]): ComplexGameMetadata {
    const hoursByDay: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };
    schedule.forEach((slot) => hoursByDay[slot.day].push(slot.startTime));
    Object.values(hoursByDay).forEach((hours) => hours.sort((a, b) => a - b));

    let willpowerCost = 0;
    const breakdown: string[] = [];

    // Exam Cost
    const uniqueExams = new Set(schedule.filter((s) => s.course?.hasExam).map((s) => s.course!.id))
      .size;
    if (uniqueExams > 0) {
      willpowerCost += uniqueExams * WILLPOWER_PRICES.EXAM_STRESS;
      breakdown.push(`Exams (${uniqueExams}): -${uniqueExams * WILLPOWER_PRICES.EXAM_STRESS}`);
    }

    let totalGapTime = 0;
    let maxGapInAnyDay = 0;
    let startHourSum = 0;
    let activeDaysCount = 0;
    let morningSlots = 0;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    days.forEach((day, index) => {
      const hours = hoursByDay[day];
      if (!hours || hours.length === 0) return;

      activeDaysCount++;
      startHourSum += hours[0];
      const start = hours[0];
      const end = hours[hours.length - 1] + 1;

      hours.forEach((h) => {
        if (h < 12) morningSlots++;
      });

      // Willpower: Commuter Tax
      if (hours.length <= 2) willpowerCost += WILLPOWER_PRICES.COMMUTER_TAX;

      // Willpower: Early/Late
      if (start === 8) willpowerCost += WILLPOWER_PRICES.EARLY_RISER;
      if (end > 18) willpowerCost += WILLPOWER_PRICES.NIGHT_SHIFT;
      if (day === 'Fri' && end > 16) willpowerCost += WILLPOWER_PRICES.FRIDAY_DRAG;

      // Willpower: Clopen
      if (index > 0) {
        const prevDay = days[index - 1];
        const prevHours = hoursByDay[prevDay];
        if (prevHours.length > 0) {
          const prevEnd = prevHours[prevHours.length - 1] + 1;
          if (prevEnd >= 18 && start <= 8) {
            willpowerCost += WILLPOWER_PRICES.THE_CLOPEN;
            breakdown.push(`Clopen (${prevDay}-${day}): -${WILLPOWER_PRICES.THE_CLOPEN}`);
          }
        }
      }

      let consecutive = 0;
      let dailyMaxGap = 0;

      for (let i = 0; i < hours.length - 1; i++) {
        const gap = hours[i + 1] - hours[i] - 1;

        if (gap === 0) {
          consecutive++;
        } else {
          totalGapTime += gap;
          dailyMaxGap = Math.max(dailyMaxGap, gap);

          if (gap === 1) willpowerCost += WILLPOWER_PRICES.AWKWARD_GAP;
          if (gap >= 3) willpowerCost += WILLPOWER_PRICES.HUGE_GAP;

          const blockDuration = consecutive + 1;
          if (blockDuration >= 6) willpowerCost += WILLPOWER_PRICES.STARVATION;

          consecutive = 0;
        }
      }
      const lastBlockDuration = consecutive + 1;
      if (lastBlockDuration >= 6) willpowerCost += WILLPOWER_PRICES.STARVATION;

      maxGapInAnyDay = Math.max(maxGapInAnyDay, dailyMaxGap);
    });

    const totalContactHours = schedule.length;
    const averageStartTime = activeDaysCount > 0 ? startHourSum / activeDaysCount : 0;
    const freeDaysCount = 5 - activeDaysCount;

    return {
      totalContactHours,
      totalGapTime,
      maxGapInAnyDay,
      averageStartTime,
      freeDaysCount,
      willpowerCost,
      costBreakdown: breakdown,
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
      totalGapTime: 0,
      maxGapInAnyDay: 0,
      averageStartTime: 0,
      freeDaysCount: 5,
      willpowerCost: 0,
      costBreakdown: [],
    };
  }
}
