import { formatDate, parseDayKey } from './dayKey';
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

export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

export function monthLabel(year: number, month: number): string {
  return `Tháng ${month + 1}, ${year}`;
}

export function longDateLabel(key: string): string {
  const d = parseDayKey(key);
  return `${WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
