import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { ScheduleSlot, Course, Day } from '../models/course.interface';
import { ComplexGameMetadata, SimpleGameMetadata } from '../models/game_state.dto';
import { CourseSelectionService } from './courses-selection';

export const WILLPOWER_PRICES = {
  EARLY_RISER: 3, // 8:00 start
  NIGHT_SHIFT: 3, // Ends after 18:00
  FRIDAY_DRAG: 4, // Friday late classes
  COMMUTER_TAX: 3, // Coming to campus for only 1 class
  STARVATION: 5, // 6+ consecutive hours (No Lunch)
  HUGE_GAP: 2, // >3h gap
  THE_CLOPEN: 3, // Late night -> Early morning
  EXAM_STRESS: 2, // Cost per exam
};

/**
 * Takes care of schedule metadata and willpower calculations
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly courseSelectionService = inject(CourseSelectionService);

  private readonly _currentLevel = signal(1);

  public setLevel(level: number): void {
    this._currentLevel.set(level);
  }

  public readonly currentPrices = computed(() => {
    const level = this._currentLevel();
    const prices = { ...WILLPOWER_PRICES };
    if (level >= 5) {
      prices.EXAM_STRESS -= 1;
      prices.THE_CLOPEN -= 1;
    }

    return prices;
  });

  public readonly scheduleSlots: Signal<ScheduleSlot[]> = computed(() => {
    const selectedCourses = this.courseSelectionService.selectedCourses();
    return this.coursesToScheduleSlots(selectedCourses);
  });

  public readonly complexMetadata = computed<ComplexGameMetadata>(() => {
    const schedule = this.scheduleSlots();
    const prices = this.currentPrices();

    if (schedule.length === 0) {
      return this.createEmptyComplexMetadata();
    }

    return this.calculateComplexMetadata(schedule, prices);
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

  private formatWPEntry(label: string, cost: number): string {
    return `${label.padEnd(22, ' ')} -${cost} WP`;
  }

  calculateComplexMetadata(
    schedule: ScheduleSlot[],
    prices = WILLPOWER_PRICES
  ): ComplexGameMetadata {
    const hoursByDay: Record<string, number[]> = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [] };
    schedule.forEach((slot) => hoursByDay[slot.day].push(slot.startTime));
    Object.values(hoursByDay).forEach((hours) => hours.sort((a, b) => a - b));

    let willpowerCost = 0;
    const breakdown: string[] = [];

    // 1. Exam Cost
    const uniqueExams = new Set(
      schedule.filter((s) => s.course?.hasExam).map((s) => s.course!.subjectId)
    ).size;

    if (uniqueExams > 0) {
      const cost = uniqueExams * prices.EXAM_STRESS;
      willpowerCost += cost;
      breakdown.push(this.formatWPEntry(`Exams (${uniqueExams})`, cost));
    }

    let totalGapTime = 0;
    let maxGapInAnyDay = 0;
    let startHourSum = 0;
    let activeDaysCount = 0;

    const days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    days.forEach((day, index) => {
      const hours = hoursByDay[day];
      if (!hours || hours.length === 0) return;

      activeDaysCount++;
      const start = hours[0];
      const end = hours[hours.length - 1] + 1;
      startHourSum += start;

      // 2. Willpower: Commuter Tax
      if (hours.length <= 2) {
        willpowerCost += prices.COMMUTER_TAX;
        breakdown.push(this.formatWPEntry(`${day}: Commuter Tax`, prices.COMMUTER_TAX));
      }

      // 3. Willpower: Early Start
      if (start === 8) {
        willpowerCost += prices.EARLY_RISER;
        breakdown.push(this.formatWPEntry(`${day}: Early Riser`, prices.EARLY_RISER));
      }

      // 4. Willpower: Night Shift
      if (end > 18) {
        willpowerCost += prices.NIGHT_SHIFT;
        breakdown.push(this.formatWPEntry(`${day}: Night Shift`, prices.NIGHT_SHIFT));
      }

      // 5. Willpower: Friday Drag
      if (day === 'Fri' && end > 16) {
        willpowerCost += prices.FRIDAY_DRAG;
        breakdown.push(this.formatWPEntry(`Friday Drag`, prices.FRIDAY_DRAG));
      }

      // 6. Willpower: Clopen
      if (index > 0) {
        const prevDay = days[index - 1];
        const prevHours = hoursByDay[prevDay];
        if (prevHours.length > 0) {
          const prevEnd = prevHours[prevHours.length - 1] + 1;
          if (prevEnd >= 18 && start <= 10) {
            willpowerCost += prices.THE_CLOPEN;
            breakdown.push(this.formatWPEntry(`The Clopen`, prices.THE_CLOPEN));
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

          if (gap >= 3) {
            willpowerCost += prices.HUGE_GAP;
            breakdown.push(this.formatWPEntry(`${day}: Huge Gap`, prices.HUGE_GAP));
          }

          if (consecutive + 1 >= 6) {
            willpowerCost += prices.STARVATION;
            breakdown.push(this.formatWPEntry(`${day}: Starvation`, prices.STARVATION));
          }

          consecutive = 0;
        }
      }

      if (consecutive + 1 >= 6) {
        willpowerCost += prices.STARVATION;
        breakdown.push(this.formatWPEntry(`${day}: Starvation`, prices.STARVATION));
      }

      maxGapInAnyDay = Math.max(maxGapInAnyDay, dailyMaxGap);
    });

    return {
      totalContactHours: schedule.length,
      totalGapTime,
      maxGapInAnyDay,
      averageStartTime: activeDaysCount > 0 ? startHourSum / activeDaysCount : 0,
      freeDaysCount: 5 - activeDaysCount,
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
