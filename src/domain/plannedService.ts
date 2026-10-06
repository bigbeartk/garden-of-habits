import type { PlantDB } from '../db/db';
import { dayKey } from './dayKey';
import type { DayDeps } from './dayService';
import { newId } from './id';
import type { Period } from './period';
import type { PlannedTodo } from './types';
import { AppError } from './errors';

/** Lên lịch một việc cho ngày sau hôm nay; đến ngày đó `ensureToday` đưa nó vào danh sách todo. */
export async function addPlanned(deps: DayDeps, date: string, text: string, period: Period): Promise<PlannedTodo> {
  if (date <= dayKey(deps.now())) throw new AppError('plannedNotFuture');
  const clean = text.trim();
  if (!clean) throw new AppError('emptyTask');
  return deps.db.transaction('rw', deps.db.planned, async () => {
    // createdAt luôn tăng trong cùng một ngày để giữ đúng thứ tự thêm
    const last = (await listPlanned(deps.db, date)).at(-1)?.createdAt ?? 0;
    const item: PlannedTodo = { id: newId(), date, text: clean, period, createdAt: Math.max(deps.now().getTime(), last + 1) };
    await deps.db.planned.add(item);
    return item;
  });
}

export function listPlanned(db: PlantDB, date: string): Promise<PlannedTodo[]> {
  return db.planned.where('date').equals(date).sortBy('createdAt');
}

export async function deletePlanned(db: PlantDB, id: string): Promise<void> {
  await db.planned.delete(id);
}

/** Số việc đã lên lịch cho từng ngày trong khoảng [from, to]. */
export async function plannedCountsInRange(db: PlantDB, from: string, to: string): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const p of await db.planned.where('date').between(from, to, true, true).toArray()) {
    counts[p.date] = (counts[p.date] ?? 0) + 1;
  }
  return counts;
}

export async function editPlanned(db: PlantDB, id: string, text: string): Promise<void> {
  const clean = text.trim();
  if (!clean) throw new AppError('emptyTask');
  await db.planned.update(id, { text: clean });
}

/** Đặt mục tiêu cho ngày sau hôm nay; nội dung trống thì xoá mục tiêu. */
export async function setPlannedGoal(deps: DayDeps, date: string, title: string): Promise<void> {
  if (date <= dayKey(deps.now())) throw new AppError('plannedNotFuture');
  const clean = title.trim();
  if (clean) await deps.db.plannedGoals.put({ date, title: clean });
  else await deps.db.plannedGoals.delete(date);
}

export async function getPlannedGoal(db: PlantDB, date: string): Promise<string> {
  return (await db.plannedGoals.get(date))?.title ?? '';
}
