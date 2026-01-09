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
  private courseSelection = inject(CourseSelectionService);
  private readonly soundsService = inject(SoundService);
  readonly schedule = input.required<ScheduleSlot[]>();
  readonly conflictingCourseIds = input.required<Set<string>>();
  readonly shakingIds = input<Set<string>>(new Set());
  readonly currentLevel = input.required<number>();
  readonly isWalking = signal(false);
  readonly walkerPos = signal<{ top: string; left: string } | null>(null);

  readonly days: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  readonly hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  constructor() {
    effect(() => {
      if (this.currentLevel() === 5) {
        this.checkAndAnimateStaircase();
      }
    });
  }

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
    if (slot?.course) {
      this.soundsService.play('delete');
      this.courseSelection.removeCourse(slot.course.id);
    }
  }

  isShaking(day: string, hour: number): boolean {
    const slot = this.getSlot(day, hour);
    return slot?.course ? this.shakingIds().has(slot.course.id) : false;
  }

  private async checkAndAnimateStaircase() {
    const slots = this.schedule();
    const stairSteps: { dayIdx: number; hour: number }[] = [];

    this.days.forEach((day, index) => {
      const daySlots = slots.filter((s) => s.day === day && s.course).map((s) => s.startTime);
      if (daySlots.length > 0) {
        stairSteps.push({ dayIdx: index, hour: Math.min(...daySlots) });
      }
    });

    if (stairSteps.length < 3) return;

    stairSteps.sort((a, b) => a.dayIdx - b.dayIdx);

    if (this.isWalking()) return;

    let isStaircase = true;
    for (let i = 0; i < stairSteps.length - 1; i++) {
      if (stairSteps[i + 1].hour <= stairSteps[i].hour) isStaircase = false;
    }

    if (isStaircase) {
      this.runAnimation(stairSteps);
    }
  }

  private async runAnimation(steps: { dayIdx: number; hour: number }[]) {
    this.isWalking.set(true);

    for (const step of steps) {
      const dayWidthPercent = (100 - 12) / 5;

      const topPos = (step.hour - 8) * 30 + 38;

      this.walkerPos.set({
        top: `${topPos}px`,
        left: `calc(70px + ((100% - 70px) / 5 * ${step.dayIdx}) + 10px)`,
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.isWalking.set(false);
    this.walkerPos.set(null);
  }
}
