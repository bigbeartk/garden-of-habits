import { addDays, formatDate, parseDayKey } from './dayKey';
import { weekStart } from './reminderView';
import type { Habit, HabitCheck } from './types';

/** Thói quen có lịch ngày `date`: đúng thứ và không trước ngày tạo (chưa xét ngày nghỉ / tương lai). */
export function isScheduled(habit: Pick<Habit, 'weekdays' | 'startDate'>, date: string): boolean {
  return date >= habit.startDate && habit.weekdays.includes(parseDayKey(date).getDay());
}

export type ReportKind = 'week' | 'month' | 'year';
export type HabitCellState = 'done' | 'missed' | 'pending' | 'off' | 'future';

/** Kỳ chứa ngày `anchor`: tuần T2→CN, tháng theo lịch, năm 1/1→31/12. */
export function periodRange(kind: ReportKind, anchor: string): { from: string; to: string } {
  if (kind === 'week') {
    const from = weekStart(anchor);
    return { from, to: addDays(from, 6) };
  }
  const d = parseDayKey(anchor);
  if (kind === 'month') {
    return { from: formatDate(new Date(d.getFullYear(), d.getMonth(), 1)), to: formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
  }
  return { from: `${d.getFullYear()}-01-01`, to: `${d.getFullYear()}-12-31` };
}

/** Ngày đầu của kỳ cách kỳ chứa `anchor` đúng `n` kỳ. */
export function shiftPeriod(kind: ReportKind, anchor: string, n: number): string {
  const { from } = periodRange(kind, anchor);
  if (kind === 'week') return addDays(from, 7 * n);
  const d = parseDayKey(from);
  return kind === 'month'
    ? formatDate(new Date(d.getFullYear(), d.getMonth() + n, 1))
    : formatDate(new Date(d.getFullYear() + n, 0, 1));
}

export function datesBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k);
  return out;
}

/** Trạng thái một ô (thói quen, ngày). Đã tick thì luôn `done`, kể cả khi lịch đã đổi. */
export function cellState(habit: Habit, date: string, checked: boolean, isRest: boolean, todayKey: string): HabitCellState {
  if (date > todayKey) return 'future';
  if (checked) return 'done';
  if (isRest || !isScheduled(habit, date)) return 'off';
  return date === todayKey ? 'pending' : 'missed';
}

export interface HabitRow {
  habit: Habit;
  cells: { date: string; state: HabitCellState }[];
  done: number;
  /** số ô được tính (done + missed + pending) */
  counted: number;
  rate: number | null;
  perfect: boolean;
}

export interface HabitReportResult {
  from: string;
  to: string;
  dates: string[];
  rows: HabitRow[];
  perfectDays: string[];
  perfectPeriod: boolean;
  stats: { metPct: number | null; perfectDays: number; totalDone: number; bestStreak: number };
}

const pct = (done: number, counted: number) => (counted === 0 ? null : Math.round((done / counted) * 100));
const isCounted = (s: HabitCellState) => s === 'done' || s === 'missed' || s === 'pending';

export function habitReport(
  habits: Habit[], checks: HabitCheck[], restDays: Set<string>, from: string, to: string, todayKey: string,
): HabitReportResult {
  const dates = datesBetween(from, to);
  const checked = new Set(checks.map((c) => `${c.habitId}|${c.date}`));
  const rows: HabitRow[] = habits.map((habit) => {
    const cells = dates.map((date) => ({ date, state: cellState(habit, date, checked.has(`${habit.id}|${date}`), restDays.has(date), todayKey) }));
    const done = cells.filter((c) => c.state === 'done').length;
    const counted = cells.filter((c) => isCounted(c.state)).length;
    return { habit, cells, done, counted, rate: pct(done, counted), perfect: counted > 0 && done === counted };
  });

  const perfectDays: string[] = [];
  let countedDays = 0;
  let streak = 0;
  let bestStreak = 0;
  dates.forEach((date, i) => {
    const states = rows.map((r) => r.cells[i].state).filter(isCounted);
    if (states.length === 0) return; // không có lịch: bỏ qua, không đứt chuỗi
    countedDays++;
    if (states.every((s) => s === 'done')) {
      perfectDays.push(date);
      streak++;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
  });

  const totalDone = rows.reduce((n, r) => n + r.done, 0);
  const totalCounted = rows.reduce((n, r) => n + r.counted, 0);
  return {
    from, to, dates, rows, perfectDays,
    perfectPeriod: countedDays > 0 && perfectDays.length === countedDays,
    stats: { metPct: pct(totalDone, totalCounted), perfectDays: perfectDays.length, totalDone, bestStreak },
  };
}
