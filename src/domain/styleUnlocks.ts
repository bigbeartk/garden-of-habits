import type { PlantDB } from '../db/db';
import { getSetting, setSetting } from '../db/settings';
import { BASE_STYLE_ID, type Catalog } from './types';

type Deps = { db: PlantDB; catalog: Catalog };

/** Một dáng cụ thể của một loài (vd. Hướng dương · Khổng lồ). */
export interface StylePair {
  plantId: string;
  styleId: string;
}

export const styleKey = (p: StylePair) => `${p.plantId}|${p.styleId}`;

/** Số ngày ra hoa của từng loài (ngày nghỉ không tính, kể cả khi đã tick đủ việc). */
export async function bloomCounts(db: PlantDB): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await db.days.each((d) => {
    if (d.finalStage === 'bloom' && !d.isRestDay) counts.set(d.plantId, (counts.get(d.plantId) ?? 0) + 1);
  });
  return counts;
}

/**
 * Các dáng đã mở (không gồm Gốc): khoá đã lưu (`unlockedStyles`, mở rồi giữ)
 * cộng các dáng mà số ngày ra hoa hiện có đã đủ mốc (dữ liệu từ trước khi có tính năng).
 * Bỏ khoá của loài/dáng không còn trong nội dung; xếp theo thứ tự nội dung.
 */
export async function listUnlockedStyles({ db, catalog }: Deps): Promise<Set<string>> {
  const saved = new Set((await getSetting(db, 'unlockedStyles')) ?? []);
  const counts = await bloomCounts(db);
  const out = new Set<string>();
  for (const plant of catalog.plants) {
    for (const s of plant.styles ?? []) {
      const key = styleKey({ plantId: plant.id, styleId: s.id });
      if (saved.has(key) || (counts.get(plant.id) ?? 0) >= s.unlockAt) out.add(key);
    }
  }
  return out;
}

/** Dáng chọn được của một loài: Gốc trước, rồi các dáng đã mở theo thứ tự nội dung. */
export async function availableStyles(deps: Deps, plantId: string): Promise<string[]> {
  const unlocked = await listUnlockedStyles(deps);
  const plant = deps.catalog.plants.find((p) => p.id === plantId);
  return [BASE_STYLE_ID, ...(plant?.styles ?? []).map((s) => s.id).filter((id) => unlocked.has(styleKey({ plantId, styleId: id })))];
}

export interface StyleProgress {
  bloomDays: number;
  styles: { id: string; unlockAt: number; unlocked: boolean }[];
}

/** Số ngày ra hoa của loài và trạng thái mở của từng dáng (cho bảng Đổi cây). */
export async function styleProgress(deps: Deps, plantId: string): Promise<StyleProgress> {
  const unlocked = await listUnlockedStyles(deps);
  const plant = deps.catalog.plants.find((p) => p.id === plantId);
  return {
    bloomDays: (await bloomCounts(deps.db)).get(plantId) ?? 0,
    styles: (plant?.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt, unlocked: unlocked.has(styleKey({ plantId, styleId: s.id })) })),
  };
}

/** Lưu các dáng của loài vừa đủ mốc; gọi trong transaction có `days` + `settings`. Trả về khoá mới ghi. */
export async function unlockStylesFor({ db, catalog }: Deps, plantId: string): Promise<string[]> {
  const plant = catalog.plants.find((p) => p.id === plantId);
  if (!plant?.styles?.length) return [];
  const count = (await bloomCounts(db)).get(plantId) ?? 0;
  const saved = (await getSetting(db, 'unlockedStyles')) ?? [];
  const added = plant.styles
    .filter((s) => count >= s.unlockAt)
    .map((s) => styleKey({ plantId, styleId: s.id }))
    .filter((k) => !saved.includes(k));
  if (added.length) await setSetting(db, 'unlockedStyles', [...saved, ...added]);
  return added;
}
