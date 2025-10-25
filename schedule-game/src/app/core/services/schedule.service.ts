import { Signal, WritableSignal, signal } from '@angular/core';
import { createInitialSchedule } from '../../data/initial_schedule';
import { ScheduleSlot, Course } from '../models/course.interface';

/**The service that is the only source of truth about the current schedule slots taken by the player.
 * It holds a signal with the current schedule slots and provides methods to modify it.
 */
export class ScheduleService {
  private readonly scheduleSignal: WritableSignal<ScheduleSlot[]> = signal(
    createInitialSchedule(8, 20)
  );

  public currentSemestr: Signal<number> = signal(1);

  addCourseToSchedule(slotId: string, course: Course) {
    this.scheduleSignal.update((schedule) => {
      return schedule.map((slot) => (slot.id === slotId ? { ...slot, course: course } : slot));
    });
  }

  removeCourseFromScheduleById(courseIdToRemove: string): void {
    this.scheduleSignal.update((schedule) => {
      return schedule.map((slot) => {
        if (slot.course && slot.course.id === courseIdToRemove) {
          return { ...slot, course: null };
        }
        return slot;
      });
    });
  }
}
