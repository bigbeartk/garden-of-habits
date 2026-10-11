import { getSetting } from '../db/settings';
import { dayKey } from './dayKey';
import type { DayDeps } from './dayService';
import { AppError } from './errors';
import { perfectHabitDays } from './habitService';
import type { Catalog } from './types';

/** Số ngày đạt cho mỗi lượt mở cây mới (dùng đều thì khoảng 3 tháng). */
export const PLANT_UNLOCK_EVERY = 90;

/**
 * Số ngày đạt tới hết hôm nay: không phải ngày nghỉ, và cây ra hoa HOẶC làm đủ thói quen ("Ngày trọn vẹn").
 * Tính cả lịch sử; ngày đạt cả hai chỉ tính 1; ngày không có bản ghi `days` mà làm đủ thói quen vẫn tính.
 */
export async function goodDayCount(deps: DayDeps): Promise<number> {
  const { db } = deps;
  const today = dayKey(deps.now());
  const good = new Set<string>();
  const rest = new Set<string>();
  await db.days.each((d) => {
    if (d.isRestDay) rest.add(d.date);
    else if (d.finalStage === 'bloom' && d.date <= today) good.add(d.date);
  });
  const firstDay = (await db.days.orderBy('date').first())?.date;
  const firstHabit = (await db.habits.toArray()).reduce<string | undefined>((m, h) => (!m || h.startDate < m ? h.startDate : m), undefined);
  const from = [firstDay, firstHabit].filter((x): x is string => !!x).sort()[0];
  if (from && from <= today) {
    for (const date of await perfectHabitDays(deps, from, today)) if (!rest.has(date)) good.add(date);
  }
  return good.size;
}

/** Lượt mở đã kiếm được, tối đa bằng số loài khoá. */
export function earnedSlots(goodDays: number, lockedTotal: number): number {
  return Math.min(lockedTotal, Math.floor(goodDays / PLANT_UNLOCK_EVERY));
}

export interface PlantUnlockState {
  /** loài khoá chưa mở, theo thứ tự nội dung */
  locked: string[];
  /** loài khoá đã mở, theo thứ tự nội dung */
  unlocked: string[];
  freeSlots: number;
  goodDays: number;
  /** mốc ngày đạt cho lượt kế tiếp; null khi đã kiếm đủ lượt cho mọi loài khoá */
  nextAt: number | null;
}

const lockedIds = (catalog: Catalog) => catalog.plants.filter((p) => p.locked).map((p) => p.id);

/** Danh sách đã mở (giá trị setting), bỏ id lạ / loài không khoá, theo thứ tự nội dung. */
const cleanUnlocked = (catalog: Catalog, saved: string[] | undefined) => {
  const set = new Set(saved ?? []);
  return lockedIds(catalog).filter((id) => set.has(id));
};

/*
 * Dùng được trong useLiveQuery: mọi lệnh đọc Dexie phải BẮT ĐẦU trước khi await một promise không phải của Dexie
 * (await hàm async tự viết bọc getSetting rồi mới đọc `days` làm liveQuery mất dấu bảng `days`: tick hoàn thành
 * không cập nhật). Nên đọc setting và đếm ngày đạt song song bằng Promise.all.
 */
export async function plantUnlockState(deps: DayDeps): Promise<PlantUnlockState> {
  const all = lockedIds(deps.catalog);
  const [saved, goodDays] = await Promise.all([getSetting(deps.db, 'unlockedPlants'), goodDayCount(deps)]);
  const unlocked = cleanUnlocked(deps.catalog, saved);
  const earned = earnedSlots(goodDays, all.length);
  // cây đã mở có thể nhiều hơn lượt đang có (bỏ tick làm tụt) → mốc kế tiếp tính từ số lớn hơn
  const used = Math.max(earned, unlocked.length);
  return {
    locked: all.filter((id) => !unlocked.includes(id)),
    unlocked,
    freeSlots: Math.max(0, earned - unlocked.length),
    goodDays,
    nextAt: used < all.length ? (used + 1) * PLANT_UNLOCK_EVERY : null,
  };
}

/** Mở một loài khoá: phải còn lượt, là loài khoá và chưa mở. Ghi setting bằng lệnh Dexie trực tiếp trong transaction riêng. */
export async function unlockPlant(deps: DayDeps, plantId: string): Promise<void> {
  const state = await plantUnlockState(deps);
  if (state.freeSlots < 1 || !state.locked.includes(plantId)) throw new AppError('plantUnlockUnavailable', { id: plantId });
  const { db } = deps;
  await db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get('unlockedPlants');
    const saved = (row?.value as string[] | undefined) ?? [];
    if (!saved.includes(plantId)) await db.settings.put({ key: 'unlockedPlants', value: [...saved, plantId] });
  });
}

/** Loài chọn được (bốc ngày mới, đổi tay): loài không khoá + loài khoá đã mở, theo thứ tự nội dung. */
export async function availablePlants(deps: DayDeps): Promise<Catalog['plants']> {
  const unlocked = new Set(cleanUnlocked(deps.catalog, await getSetting(deps.db, 'unlockedPlants')));
  return deps.catalog.plants.filter((p) => !p.locked || unlocked.has(p.id));
}
