import { dayCellStatus } from './calendar';
import { addDays } from './dayKey';
import type { DayRecord } from './types';

export interface GardenEntry {
  plantId: string;
  /** số ngày loài này được chọn trong khoảng (không tính ngày tiết kiệm năng lượng) */
  count: number;
}

export interface GardenReport {
  /** mọi loài trong `plantIds`, nhiều ngày nhất đứng trước (bằng nhau thì giữ thứ tự của `plantIds`) */
  entries: GardenEntry[];
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
 */
export function gardenReport(
  records: DayRecord[],
  plantIds: string[],
  from: string,
  to: string,
  { todayKey, firstKey }: { todayKey: string; firstKey: string | null },
): GardenReport {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const inRange = records.filter((r) => r.date >= lo && r.date <= hi);
  const counts = new Map(plantIds.map((id) => [id, 0]));
  for (const r of inRange) {
    if (r.isRestDay) continue;
    const c = counts.get(r.plantId);
    if (c !== undefined) counts.set(r.plantId, c + 1);
  }
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

  return {
    entries,
    restDays: inRange.filter((r) => r.isRestDay).length,
    wiltedDays,
    days: inRange.length,
    bloomDays: inRange.filter((r) => r.finalStage === 'bloom').length,
    todosDone: inRange.reduce((n, r) => n + r.todos.filter((t) => t.done).length, 0),
  };
}
