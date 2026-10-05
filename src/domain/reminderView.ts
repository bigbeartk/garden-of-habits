import { addDays, dayKey, parseDayKey } from './dayKey';
import type { Reminder } from './types';

/** Việc chưa xong, theo thứ tự thêm. */
export function activeReminders(list: Reminder[]): Reminder[] {
  return list.filter((r) => r.doneAt === null).sort((a, b) => a.createdAt - b.createdAt);
}

/** Thứ Hai của tuần chứa `todayKey`. */
export function weekStart(todayKey: string): string {
  const dow = parseDayKey(todayKey).getDay(); // 0 = Chủ nhật
  return addDays(todayKey, -((dow + 6) % 7));
}

/** Việc xong trong tuần này (theo mốc 4:00), mới xong đứng trên. */
export function doneThisWeek(list: Reminder[], todayKey: string): Reminder[] {
  const from = weekStart(todayKey);
  return list
    .filter((r): r is Reminder & { doneAt: number } => r.doneAt !== null && dayKey(new Date(r.doneAt)) >= from)
    .sort((a, b) => b.doneAt - a.doneAt);
}
