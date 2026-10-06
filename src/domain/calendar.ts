import { formatDate } from './dayKey';
import type { DayRecord } from './types';

export interface MonthCell {
  key: string | null;
  day: number | null;
}

/** Lưới tháng, tuần bắt đầu từ thứ Hai; ô đệm có key = null. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = Array.from({ length: lead }, () => ({ key: null, day: null }));
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: formatDate(new Date(year, month, d)), day: d });
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null });
  return cells;
}

export type CellStatus = 'plant' | 'rest' | 'missed' | 'today-pending' | 'future' | 'before-start';

export function dayCellStatus(key: string, record: DayRecord | undefined, todayKey: string, firstKey: string | null): CellStatus {
  if (record) return record.isRestDay ? 'rest' : 'plant';
  if (key > todayKey) return 'future';
  if (key === todayKey) return 'today-pending';
  if (firstKey === null || key < firstKey) return 'before-start';
  return 'missed';
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
