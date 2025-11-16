import { Injectable, Signal, computed, WritableSignal, signal } from '@angular/core';
import { createInitialSchedule } from '../../data/initial_schedule';
import { ScheduleSlot, Course } from '../models/course.interface';
import { ComplexGameMetadata, GameStateDTO, SimpleGameMetadata } from '../models/game_state.dto';

/**The service that is the only source of truth about the current schedule slots taken by the player.
 * It holds a signal with the current schedule slots and provides methods to modify it.
 */
@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly scheduleSignal: WritableSignal<ScheduleSlot[]> = signal(
    createInitialSchedule(8, 20)
  );
  public readonly schedule: Signal<ScheduleSlot[]> = this.scheduleSignal.asReadonly();

  public readonly currentSemester: WritableSignal<number> = signal(1);

  private readonly simpleMetadataSignal = signal<SimpleGameMetadata>(
    this.createEmptySimpleMetadata()
  );

  public readonly complexMetadata = computed<ComplexGameMetadata>(() => {
    const schedule = this.schedule();
    return this.calculateComplexMetadata(schedule);
  });

  public readonly simpleMetadata = this.simpleMetadataSignal.asReadonly();

  public readonly gameState: Signal<GameStateDTO> = computed(() => ({
    currentSemester: this.currentSemester.asReadonly()(),
    schedule: this.schedule(),
  }));

  public setState(state: GameStateDTO): void {
    this.scheduleSignal.set(state.schedule);
    this.currentSemester.set(state.currentSemester);
  }

  addCourseToSchedule(slotId: string, course: Course) {
    this.scheduleSignal.update((schedule) => {
      return schedule.map((slot) => (slot.id === slotId ? { ...slot, course: course } : slot));
    });
    this.incrementSimpleMetadata(course, 'add');
  }

  removeCourseFromScheduleById(course: Course): void {
    this.scheduleSignal.update((schedule) => {
      return schedule.map((slot) => {
        if (slot.course == course) {
          return { ...slot, course: null };
        }
        return slot;
      });
    });
    this.incrementSimpleMetadata(course, 'remove');
  }

  updateTimeSlot(course: Course, newSlot: ScheduleSlot): void {
    this.scheduleSignal.update((schedule) =>
      schedule.map((slot) => (slot.course === course ? { ...slot, timeSlot: newSlot } : slot))
    );
  }

  private createEmptySimpleMetadata(): SimpleGameMetadata {
    return {
      totalEctsAccumulated: 0,
      ectsByTag: {},
      ectsByType: {},
      hasExamCount: 0,
      uniqueCoursesCount: 0,
      proseminarCount: 0,
      mandatoryCoursesCompleted: [],
    };
  }

  private incrementSimpleMetadata(course: Course, operation: 'add' | 'remove'): void {
    const delta = operation === 'add' ? 1 : -1;
    const ectsDelta = delta * course.ects;

    const calculateNewEctsByTag = (
      previousEctsByTag: Record<string, number>
    ): Record<string, number> => {
      if (!course.tags) {
        return previousEctsByTag;
      }

      const newEctsByTag: Record<string, number> = { ...previousEctsByTag };
      course.tags.forEach((tag) => {
        newEctsByTag[tag] = (newEctsByTag[tag] ?? 0) + ectsDelta;
      });

      return newEctsByTag;
    };

    this.simpleMetadataSignal.update((meta) => ({
      ...meta,

      totalEctsAccumulated: meta.totalEctsAccumulated + ectsDelta,

      ectsByTag: calculateNewEctsByTag(meta.ectsByTag),

      ectsByType: {
        ...meta.ectsByType,
        [course.type]: (meta.ectsByType[course.type] ?? 0) + ectsDelta,
      },

      hasExamCount: meta.hasExamCount + (course.hasExam ? delta : 0),
      uniqueCoursesCount: meta.uniqueCoursesCount + delta,

      proseminarCount: meta.proseminarCount + (course.isProseminar ? delta : 0),

      mandatoryCoursesCompleted:
        operation === 'add'
          ? course.isMandatory
            ? [...meta.mandatoryCoursesCompleted, course.id]
            : meta.mandatoryCoursesCompleted
          : meta.mandatoryCoursesCompleted.filter((id) => id !== course.id),
    }));
  }

  calculateComplexMetadata(schedule: ScheduleSlot[]): ComplexGameMetadata {
    throw new Error('Method not implemented.');
  }
}
