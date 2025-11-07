import { Injectable, Signal, computed, WritableSignal, signal } from '@angular/core';
import { createInitialSchedule } from '../../data/initial_schedule';
import { ScheduleSlot, Course } from '../models/course.interface';
import { GameStateDTO, GameStateMetadata } from '../models/game_state.dto';

/**The service that is the only source of truth about the current schedule slots taken by the player.
 * It holds a signal with the current schedule slots and provides methods to modify it.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly scheduleSignal: WritableSignal<ScheduleSlot[]> = signal(
    createInitialSchedule(8, 20)
  );
  public readonly schedule: Signal<ScheduleSlot[]> = this.scheduleSignal.asReadonly();

  public readonly currentSemestr: WritableSignal<number> = signal(1);

  public readonly gameState: Signal<GameStateDTO> = computed(() => ({
    currentSemester: this.currentSemestr.asReadonly()(),
    slots: this.schedule(),
    metadata: null,
  }));

  public setState(state: GameStateDTO): void {
    this.scheduleSignal.set(state.slots);
    this.currentSemestr.set(state.currentSemester);
  }

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

  public readonly totalECTS: Signal<number> = computed(() => {
    return this.schedule().reduce((sum, slot) => {
      return slot.course ? sum + slot.course.ects : sum;
    }, 0);
  });
}
