import { Component, computed, inject, input, signal } from '@angular/core';
import { ScheduleSlot } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses-selection';

@Component({
  selector: 'app-schedule-grid',
  imports: [],
  templateUrl: './schedule-grid.html',
  styleUrl: './schedule-grid.scss',
  standalone: true,
})
export class ScheduleGrid {
  private courseSelection = inject(CourseSelectionService);
  readonly schedule = input.required<ScheduleSlot[]>();

  readonly conflictingCourseIds = input.required<Set<string>>();

  readonly viewMode = signal<'grid' | 'compact'>('grid');

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  readonly hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  private slotMap = computed(() => {
    const map = new Map<string, ScheduleSlot>();
    this.schedule().forEach((slot) => {
      map.set(`${slot.day}_${slot.startTime}`, slot);
    });
    return map;
  });

  hasSlot(day: string, hour: number): boolean {
    return this.slotMap().has(`${day}_${hour}`);
  }

  getSlot(day: string, hour: number): ScheduleSlot | undefined {
    return this.slotMap().get(`${day}_${hour}`);
  }

  hasConflict(day: string, hour: number): boolean {
    const slot = this.getSlot(day, hour);
    return slot?.course ? this.conflictingCourseIds().has(slot.course.id) : false;
  }

  isFirstSlot(day: string, hour: number): boolean {
    const slot = this.getSlot(day, hour);
    if (!slot?.course) return false;

    const courseSchedule = slot.course.schedule;
    for (const timeBlock of courseSchedule) {
      if (timeBlock.day === day && timeBlock.startTime === hour) {
        return true;
      }
    }
    return false;
  }

  getCourseName(day: string, hour: number): string {
    return this.getSlot(day, hour)?.course?.name || '';
  }

  getCourseInfo(day: string, hour: number): string {
    const course = this.getSlot(day, hour)?.course;
    if (!course) return '';
    return `${course.type} • ${course.ects} ECTS`;
  }

  getDaySlots(day: string): ScheduleSlot[] {
    return this.schedule()
      .filter((slot) => slot.day === day && slot.course !== null)
      .sort((a, b) => a.startTime - b.startTime);
  }

  formatHour(hour: number): string {
    return `${hour}:00`;
  }

  onSlotDoubleClick(day: string, hour: number) {
    const slot = this.getSlot(day, hour);

    if (slot?.course) {
      this.courseSelection.removeCourse(slot.course.id);
    }
  }
}
