import { ScheduleSlot, Day } from '../core/models/course.interface';
// Helper function to generate an array of empty slots
export function createInitialSchedule(start: number, end: number): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const timeSlots = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  for (const day of days) {
    for (const startTime of timeSlots) {
      slots.push({
        id: `${day}_${start}`, // e.g., 'Mon_8'
        day: day as Day,
        startTime: start,
        durationHours: 1,
        course: null,
      });
    }
  }
  return slots;
}
