import { dayCellStatus } from './calendar';
import { addDays } from './dayKey';
import type { DayRecord } from './types';

export interface GardenEntry {
  plantId: string;
  /** số ngày loài này được chọn trong khoảng (không tính ngày tiết kiệm năng lượng) */
  count: number;
}

export interface GardenSpecialEntry {
  plantId: string;
  specialId: string;
  /** số ngày loài này mang hiệu ứng này */
  count: number;
}

/** Một luống trong vườn: loài thường, cây đặc biệt (loài + hiệu ứng), cây héo hoặc ngày nghỉ. */
export type GardenBed =
  | { kind: 'plant'; plantId: string; count: number }
  | { kind: 'special'; plantId: string; specialId: string; count: number }
  | { kind: 'wilted'; count: number }
  | { kind: 'rest'; count: number };

export interface GardenReport {
  /**
   * Mọi luống theo thứ tự hiển thị: luống > 0 ngày trước, luống 0 ngày (mờ) sau;
   * trong mỗi nhóm: loài thường → cây đặc biệt → cây héo → ngày nghỉ (cây thật luôn ở trên).
   */
  beds: GardenBed[];
  /** mọi loài trong `plantIds`, nhiều ngày nhất đứng trước (bằng nhau thì giữ thứ tự của `plantIds`) */
  entries: GardenEntry[];
  /** chỉ có khi `separateSpecial`: luống riêng cho từng cặp loài + hiệu ứng, nhiều nhất đứng trước */
  specials: GardenSpecialEntry[];
  /** số ngày cây đặc biệt (không tính ngày tiết kiệm năng lượng) */
  specialDays: number;
  /** số ngày tiết kiệm năng lượng */
  restDays: number;
  /** số ngày bỏ lỡ (cây héo trên Lịch): không có bản ghi, từ ngày dùng app đầu tiên tới hôm qua */
  wiltedDays: number;
  /** số ngày có bản ghi trong khoảng (kể cả ngày tiết kiệm năng lượng) */
  days: number;
  /** số ngày cây ra hoa (xong hết việc) */
  bloomDays: number;
  /** tổng số việc đã xong */
  todosDone: number;
}

/**
 * Báo cáo "Khu vườn" từ ngày `from` tới ngày `to` (khoá 'YYYY-MM-DD', tính cả hai đầu; ngược thì tự đổi chỗ).
 * `todayKey` / `firstKey` (ngày dùng app đầu tiên) để biết ngày nào là cây héo, giống ô lịch.
 * `separateSpecial`: ngày cây đặc biệt không tính cho loài thường mà tách thành `specials`.
 */
export function gardenReport(
  records: DayRecord[],
  plantIds: string[],
  from: string,
  to: string,
  { todayKey, firstKey, separateSpecial = false }: { todayKey: string; firstKey: string | null; separateSpecial?: boolean },
): GardenReport {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const inRange = records.filter((r) => r.date >= lo && r.date <= hi);
  const counts = new Map(plantIds.map((id) => [id, 0]));
  const specialCounts = new Map<string, GardenSpecialEntry>();
  let specialDays = 0;
  for (const r of inRange) {
    if (r.isRestDay) continue;
    if (r.specialId) {
      specialDays++;
      if (separateSpecial) {
        if (!counts.has(r.plantId)) continue; // loài đã xoá khỏi nội dung
        const key = `${r.plantId}|${r.specialId}`;
        const cur = specialCounts.get(key) ?? { plantId: r.plantId, specialId: r.specialId, count: 0 };
        specialCounts.set(key, { ...cur, count: cur.count + 1 });
        continue;
      }
    }
    const c = counts.get(r.plantId);
    if (c !== undefined) counts.set(r.plantId, c + 1);
  }
  const order = (id: string) => plantIds.indexOf(id);
  const specials = [...specialCounts.values()].sort(
    (a, b) => b.count - a.count || order(a.plantId) - order(b.plantId) || a.specialId.localeCompare(b.specialId),
  );
  const entries = plantIds
    .map((plantId, i) => ({ plantId, count: counts.get(plantId) ?? 0, i }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .map(({ plantId, count }) => ({ plantId, count }));

  // chỉ cần duyệt từng ngày trong đoạn có thể héo: từ ngày dùng app đầu tiên tới hôm qua
  let wiltedDays = 0;
  if (firstKey !== null) {
    const byDate = new Set(inRange.map((r) => r.date));
    const start = lo > firstKey ? lo : firstKey;
    const end = hi < todayKey ? hi : addDays(todayKey, -1);
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (!byDate.has(d) && dayCellStatus(d, undefined, todayKey, firstKey) === 'missed') wiltedDays++;
    }
  }

  const restDays = inRange.filter((r) => r.isRestDay).length;
  const all: GardenBed[] = [
    ...entries.map((e): GardenBed => ({ kind: 'plant', ...e })),
    ...specials.map((e): GardenBed => ({ kind: 'special', ...e })),
    { kind: 'wilted', count: wiltedDays },
    { kind: 'rest', count: restDays },
  ];
  const beds = [...all.filter((b) => b.count > 0), ...all.filter((b) => b.count === 0)];

  return {
    beds,
    entries,
    specials,
    specialDays,
    restDays,
    wiltedDays,
    days: inRange.length,
    bloomDays: inRange.filter((r) => r.finalStage === 'bloom').length,
    todosDone: inRange.reduce((n, r) => n + r.todos.filter((t) => t.done).length, 0),
  };
}
