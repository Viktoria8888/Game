import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { ScheduleSlot, Day } from '../../models/course.interface';
import { CourseSelectionService } from '../../services/courses-selection';
import { CommonModule } from '@angular/common';
import { SoundService } from '../../services/sounds.service';

@Component({
  selector: 'app-schedule-grid',
  imports: [CommonModule],
  templateUrl: './schedule-grid.html',
  styleUrl: './schedule-grid.scss',
  standalone: true,
})
export class ScheduleGrid {
  protected courseSelection = inject(CourseSelectionService);
  private readonly soundsService = inject(SoundService);
  readonly schedule = input.required<ScheduleSlot[]>();
  readonly conflictingCourseIds = input.required<Set<string>>();
  readonly shakingIds = input<Set<string>>(new Set());
  readonly currentLevel = input.required<number>();

  readonly days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
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

  isFirstSlot(day: string, hour: number): boolean {
    const slot = this.getSlot(day, hour);
    if (!slot?.course) return false;
    const timeBlock = slot.course.schedule;
    return timeBlock.day === day && timeBlock.startTime === hour;
  }

  getCourseName(day: string, hour: number): string {
    return this.getSlot(day, hour)?.course?.name || '';
  }

  getCourseInfo(day: string, hour: number): string {
    const course = this.getSlot(day, hour)?.course;
    if (!course) return '';
    return `${course.type} • ${course.ects} ECTS`;
  }

  formatHour(hour: number): string {
    return `${hour}:00`;
  }

  onSlotDoubleClick(day: string, hour: number) {
    const slot = this.getSlot(day, hour);
    this.soundsService.play('add');
    if (slot?.course) {
      this.courseSelection.removeCourse(slot.course.id);
    }
  }
  clearSchedule() {
    if (this.schedule().length === 0) return;

    if (confirm('Are you sure you want to clear the entire schedule?')) {
      this.soundsService.play('delete');
      this.courseSelection.clearAll();
    }
  }
  isShaking(day: string, hour: number): boolean {
    const slot = this.getSlot(day, hour);
    return slot?.course ? this.shakingIds().has(slot.course.id) : false;
  }

  isPreview(day: string, hour: number): boolean {
    const preview = this.courseSelection.previewCourse();
    if (!preview) return false;

    if (preview.schedule.day !== day) return false;
    const start = preview.schedule.startTime;
    const end = start + preview.schedule.durationHours;
    return hour >= start && hour < end;
  }
}
