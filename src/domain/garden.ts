import type { DayRecord } from './types';

export interface GardenEntry {
  plantId: string;
  /** số ngày loài này được chọn trong khoảng */
  count: number;
}

export interface GardenReport {
  /** mọi loài trong `plantIds`, nhiều ngày nhất đứng trước (bằng nhau thì giữ thứ tự của `plantIds`) */
  entries: GardenEntry[];
  /** số ngày có bản ghi trong khoảng (kể cả ngày tiết kiệm năng lượng) */
  days: number;
  /** số ngày cây ra hoa (xong hết việc) */
  bloomDays: number;
  /** tổng số việc đã xong */
  todosDone: number;
}

/** Báo cáo "Khu vườn" từ ngày `from` tới ngày `to` (khoá 'YYYY-MM-DD', tính cả hai đầu; ngược thì tự đổi chỗ). */
export function gardenReport(records: DayRecord[], plantIds: string[], from: string, to: string): GardenReport {
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  const inRange = records.filter((r) => r.date >= lo && r.date <= hi);
  const counts = new Map(plantIds.map((id) => [id, 0]));
  for (const r of inRange) {
    const c = counts.get(r.plantId);
    if (c !== undefined) counts.set(r.plantId, c + 1);
  }
  const entries = plantIds
    .map((plantId, i) => ({ plantId, count: counts.get(plantId) ?? 0, i }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .map(({ plantId, count }) => ({ plantId, count }));
  return {
    entries,
    days: inRange.length,
    bloomDays: inRange.filter((r) => r.finalStage === 'bloom').length,
    todosDone: inRange.reduce((n, r) => n + r.todos.filter((t) => t.done).length, 0),
  };
}
