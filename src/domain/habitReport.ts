import { parseDayKey } from './dayKey';
import type { Habit } from './types';

/** Thói quen có lịch ngày `date`: đúng thứ và không trước ngày tạo (chưa xét ngày nghỉ / tương lai). */
export function isScheduled(habit: Pick<Habit, 'weekdays' | 'startDate'>, date: string): boolean {
  return date >= habit.startDate && habit.weekdays.includes(parseDayKey(date).getDay());
}
