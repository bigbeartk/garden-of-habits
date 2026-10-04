import type { PlantDB } from '../db/db';
import { getSetting, setSetting } from '../db/settings';
import type { Catalog } from './types';

/** Một cây đặc biệt cụ thể: loài + hiệu ứng (vd. Ngô · Phát sáng). */
export interface SpecialPair {
  plantId: string;
  specialId: string;
}

export const pairKey = (p: SpecialPair) => `${p.plantId}|${p.specialId}`;

/** Ghi nhận cặp vừa tung trúng; gọi trong transaction có bảng `settings`. */
export async function unlockSpecial(db: PlantDB, pair: SpecialPair): Promise<void> {
  const keys = (await getSetting(db, 'unlockedSpecials')) ?? [];
  const key = pairKey(pair);
  if (!keys.includes(key)) await setSetting(db, 'unlockedSpecials', [...keys, key]);
}

/**
 * Các cây đặc biệt chọn lại được ở bảng Đổi cây: cặp đã tung trúng (setting `unlockedSpecials`)
 * cộng các cặp có trong lịch sử (dữ liệu từ trước khi có tính năng này).
 * Bỏ cặp mà loài / hiệu ứng không còn trong nội dung; xếp theo thứ tự loài rồi hiệu ứng.
 */
export async function listUnlockedSpecials(deps: { db: PlantDB; catalog: Catalog }): Promise<SpecialPair[]> {
  const { db, catalog } = deps;
  const keys = new Set((await getSetting(db, 'unlockedSpecials')) ?? []);
  await db.days.each((d) => {
    if (d.specialId) keys.add(pairKey({ plantId: d.plantId, specialId: d.specialId }));
  });
  const pairs: SpecialPair[] = [];
  for (const plant of catalog.plants) {
    for (const special of catalog.specials) {
      const pair = { plantId: plant.id, specialId: special.id };
      if (keys.has(pairKey(pair))) pairs.push(pair);
    }
  }
  return pairs;
}
