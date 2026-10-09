import type { PlantDB } from '../db/db';
import { dayKey } from './dayKey';
import type { DayDeps } from './dayService';
import { AppError } from './errors';
import { habitReport, isScheduled, stoppedSince } from './habitReport';
import { bugOdds, legacyBugFor, rollBug, streakBonus, type BugInfo, type DayBugInfo } from './bugOdds';
import { addDays } from './dayKey';
import { newId } from './id';
import { cleanWeekdays } from './templateService';
import type { Habit, HabitColor } from './types';

export const HABIT_NAME_MAX = 40;

export interface HabitInput { name: string; icon: string; color: HabitColor; weekdays: number[] }

function clean(input: HabitInput): HabitInput {
  const name = input.name.trim().slice(0, HABIT_NAME_MAX);
  if (!name) throw new AppError('emptyHabitName');
  const weekdays = cleanWeekdays(input.weekdays);
  if (weekdays.length === 0) throw new AppError('habitNoDays');
  return { name, icon: input.icon, color: input.color, weekdays };
}

export function listHabits(db: PlantDB): Promise<Habit[]> {
  return db.habits.orderBy('order').toArray();
}

/** Thói quen cần điểm danh ngày `date`; ngày tiết kiệm năng lượng thì không có. */
export function habitsForDay(habits: Habit[], date: string, isRestDay: boolean): Habit[] {
  return isRestDay ? [] : habits.filter((h) => isScheduled(h, date));
}

/** id các thói quen đã tick ngày `date`. */
export async function checksOn(db: PlantDB, date: string): Promise<Set<string>> {
  return new Set((await db.habitChecks.where('date').equals(date).toArray()).map((c) => c.habitId));
}

export async function addHabit(deps: DayDeps, input: HabitInput): Promise<Habit> {
  const c = clean(input);
  const ts = deps.now().getTime();
  return deps.db.transaction('rw', deps.db.habits, async () => {
    const last = await deps.db.habits.orderBy('order').last();
    const habit: Habit = {
      id: newId(), ...c, order: last ? last.order + 1 : 0, startDate: dayKey(deps.now()), createdAt: ts, updatedAt: ts,
    };
    await deps.db.habits.add(habit);
    return habit;
  });
}

export async function editHabit(deps: DayDeps, id: string, input: HabitInput): Promise<void> {
  const c = clean(input);
  const n = await deps.db.habits.update(id, { ...c, updatedAt: deps.now().getTime() });
  if (n === 0) throw new AppError('habitNotFound');
}

/** Xoá thói quen cùng mọi lần tick của nó. */
export async function deleteHabit(deps: DayDeps, id: string): Promise<void> {
  await deps.db.transaction('rw', [deps.db.habits, deps.db.habitChecks], async () => {
    await deps.db.habitChecks.where('habitId').equals(id).delete();
    await deps.db.habits.delete(id);
  });
}

export const isStopped = (habit: Habit) => stoppedSince(habit) !== null;

/** Dừng thói quen từ hôm nay: không còn lịch, không tính bỏ lỡ; lịch sử tick giữ nguyên. Đang dừng thì thôi. */
export async function stopHabit(deps: DayDeps, id: string): Promise<void> {
  const today = dayKey(deps.now());
  await deps.db.transaction('rw', deps.db.habits, async () => {
    const habit = await deps.db.habits.get(id);
    if (!habit) throw new AppError('habitNotFound');
    if (isStopped(habit)) return;
    const pauses = [...(habit.pauses ?? [])];
    const last = pauses.at(-1);
    // vừa tiếp tục hôm nay rồi lại dừng: nối vào khoảng cũ
    if (last && last.to === today) pauses[pauses.length - 1] = { from: last.from, to: null };
    else pauses.push({ from: today, to: null });
    await deps.db.habits.update(id, { pauses, updatedAt: deps.now().getTime() });
  });
}

/** Làm lại thói quen đã dừng, tính từ hôm nay; khoảng đã dừng không tính bỏ lỡ. */
export async function resumeHabit(deps: DayDeps, id: string): Promise<void> {
  const today = dayKey(deps.now());
  await deps.db.transaction('rw', deps.db.habits, async () => {
    const habit = await deps.db.habits.get(id);
    if (!habit) throw new AppError('habitNotFound');
    if (!isStopped(habit)) return;
    const pauses = [...habit.pauses!];
    const last = pauses.pop()!;
    if (last.from < today) pauses.push({ from: last.from, to: today }); // dừng rồi tiếp tục trong ngày: bỏ khoảng rỗng
    await deps.db.habits.update(id, { pauses, updatedAt: deps.now().getTime() });
  });
}

/**
 * Ngày làm đủ thói quen trong [from, to]: có ≥ 1 thói quen có lịch và mọi thói quen có lịch đều đã tick
 * (cùng định nghĩa "Ngày trọn vẹn" của báo cáo; ngày nghỉ không có lịch nên không tính). Côn trùng ghé cây những ngày này.
 */
export async function perfectHabitDays(deps: DayDeps, from: string, to: string): Promise<Set<string>> {
  const { db } = deps;
  const habits = await listHabits(db);
  if (habits.length === 0) return new Set();
  const checks = await db.habitChecks.where('date').between(from, to, true, true).toArray();
  const rest = new Set((await db.days.where('date').between(from, to, true, true).toArray()).filter((d) => d.isRestDay).map((d) => d.date));
  return new Set(habitReport(habits, checks, rest, from, to, dayKey(deps.now())).perfectDays);
}

/** Mỗi ngày trong [from, to]: có thói quen có lịch không, có làm đủ không (ngày nghỉ = không có lịch). */
export async function habitDayStatus(deps: DayDeps, from: string, to: string): Promise<Map<string, { scheduled: boolean; perfect: boolean }>> {
  const { db } = deps;
  const out = new Map<string, { scheduled: boolean; perfect: boolean }>();
  const habits = await listHabits(db);
  if (habits.length === 0 || from > to) return out;
  const checks = await db.habitChecks.where('date').between(from, to, true, true).toArray();
  const rest = new Set((await db.days.where('date').between(from, to, true, true).toArray()).filter((d) => d.isRestDay).map((d) => d.date));
  const report = habitReport(habits, checks, rest, from, to, dayKey(deps.now()));
  const perfect = new Set(report.perfectDays);
  report.dates.forEach((date, i) => {
    const scheduled = report.rows.some((r) => r.cells[i].state !== 'off' && r.cells[i].state !== 'future');
    out.set(date, { scheduled, perfect: perfect.has(date) });
  });
  return out;
}

/** Con của một ngày: đã bốc thì lấy `bugId`; ngày đã qua chưa bốc (dữ liệu cũ) thì theo cách bốc sẵn cũ; hôm nay chưa bốc → null. */
export function dayBugId(record: { date: string; bugId?: string } | undefined, date: string, todayKey: string, bugs: BugInfo[]): string | null {
  if (record?.bugId) return record.bugId;
  return date < todayKey ? legacyBugFor(date, bugs) : null;
}

/**
 * Hôm nay vừa làm đủ thói quen mà chưa có con → bốc một lần (tỉ lệ theo chuỗi ngày làm đủ trước đó) rồi lưu vào
 * `DayRecord.bugId`; đã có thì giữ (bỏ tick rồi tick lại không đổi con). Trả về id con, hoặc null nếu chưa làm đủ.
 * Đọc hết trước, chỉ ghi trong transaction ngắn (gọi async lồng trong transaction rw từng gây PrematureCommitError).
 */
export async function ensureDayBug(deps: DayDeps, date: string, bugs: BugInfo[]): Promise<string | null> {
  const { db } = deps;
  const today = dayKey(deps.now());
  if (date !== today) return null;
  const habits = await listHabits(db);
  if (habits.length === 0) return null;
  const first = habits.reduce((m, h) => (h.startDate < m ? h.startDate : m), habits[0].startDate);
  const status = await habitDayStatus(deps, first < date ? first : date, date);
  if (!status.get(date)?.perfect) return null;
  const record = await db.days.get(date);
  if (!record) return null;
  if (record.bugId) return record.bugId;

  const rarity = new Map(bugs.map((b) => [b.id, b.rarity]));
  const records = new Map((await db.days.where('date').between(first, date, true, false).toArray()).map((d) => [d.date, d]));
  const history: DayBugInfo[] = [];
  for (let k = addDays(date, -1); k >= first; k = addDays(k, -1)) {
    const s = status.get(k) ?? { scheduled: false, perfect: false };
    const id = s.perfect ? dayBugId(records.get(k), k, today, bugs) : null;
    history.push({ ...s, tier: id ? rarity.get(id) ?? 'common' : null });
  }
  const id = rollBug(bugs, bugOdds(streakBonus(history)), deps.rng);
  return db.transaction('rw', db.days, async () => {
    const cur = await db.days.get(date);
    if (!cur) return null;
    if (cur.bugId) return cur.bugId;
    await db.days.update(date, { bugId: id, updatedAt: deps.now().getTime() });
    return id;
  });
}

/** Đảo trạng thái đã làm của hôm nay; trả về true khi vừa tick. */
export async function toggleHabit(deps: DayDeps, id: string): Promise<boolean> {
  const date = dayKey(deps.now());
  const { db } = deps;
  return db.transaction('rw', [db.habits, db.habitChecks, db.days], async () => {
    const habit = await db.habits.get(id);
    if (!habit) throw new AppError('habitNotFound');
    if ((await db.days.get(date))?.isRestDay) throw new AppError('habitRestDay');
    if (!isScheduled(habit, date)) throw new AppError('habitNotToday');
    if (await db.habitChecks.get([id, date])) {
      await db.habitChecks.delete([id, date]);
      return false;
    }
    await db.habitChecks.add({ habitId: id, date, at: deps.now().getTime() });
    return true;
  });
}
