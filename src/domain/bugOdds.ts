/**
 * Tỉ lệ gặp côn trùng theo chuỗi ngày làm đủ thói quen (spec docs/superpowers/specs/2026-10-09-bug-streak-odds-design.md).
 * Mỗi ngày làm đủ liên tiếp, nhóm Hiếm và Rất hiếm mỗi nhóm +1%; gặp nhóm nào thì bộ đếm nhóm đó về 0;
 * ngày bỏ lỡ làm cả hai về 0. Bộ đếm suy từ lịch sử, không lưu riêng.
 */
export type BugTier = 'common' | 'rare' | 'epic';

/** Tỉ lệ gốc của nhóm (khi chuỗi = 0). Thường gặp = phần còn lại. */
export const BASE_ODDS = { rare: 6 / 29, epic: 0.02 } as const;
/** Mỗi ngày trong chuỗi cộng thêm chừng này cho mỗi nhóm. */
export const STEP = 0.01;

/** Một ngày đã qua: có thói quen có lịch không, có làm đủ không, gặp nhóm nào (khi làm đủ). */
export interface DayBugInfo { scheduled: boolean; perfect: boolean; tier: BugTier | null }

/**
 * Số ngày cộng dồn của mỗi nhóm, đi lùi từ hôm qua (`history` mới nhất trước):
 * ngày không có lịch bỏ qua; ngày bỏ lỡ làm đứt chuỗi; ngày làm đủ +1 cho nhóm chưa gặp lại kể từ đó.
 */
export function streakBonus(history: Iterable<DayBugInfo>): { rare: number; epic: number } {
  let rare = 0;
  let epic = 0;
  let rareOpen = true;
  let epicOpen = true;
  for (const d of history) {
    if (!d.scheduled) continue;
    if (!d.perfect) break;
    if (rareOpen) {
      if (d.tier === 'rare') rareOpen = false;
      else rare += 1;
    }
    if (epicOpen) {
      if (d.tier === 'epic') epicOpen = false;
      else epic += 1;
    }
    if (!rareOpen && !epicOpen) break;
  }
  return { rare, epic };
}

/** Tỉ lệ ba nhóm, tổng = 1: Rất hiếm ưu tiên khi chạm trần 100%, Hiếm lấy phần còn lại. */
export function bugOdds(bonus: { rare: number; epic: number }): Record<BugTier, number> {
  const epic = Math.min(1, BASE_ODDS.epic + STEP * bonus.epic);
  const rare = Math.min(1 - epic, BASE_ODDS.rare + STEP * bonus.rare);
  return { epic, rare, common: Math.max(0, 1 - epic - rare) };
}

/** Thông tin côn trùng tầng domain cần (nội dung + hình ở `content/bugs.tsx`). */
export interface BugInfo { id: string; weight: number; rarity: BugTier }

/** Băm khoá ngày ra số trong [0, 1): FNV-1a rồi trộn bit (murmur3 fmix32) để các ngày liền nhau rải đều. */
export function hashUnit(key: string): number {
  let h = 0x811c9dc5;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 2 ** 32;
}

/** Chọn theo `weight` trong danh sách, từ số `u` trong [0, 1). */
function pickWeighted(bugs: BugInfo[], u: number): string {
  let r = u * bugs.reduce((n, b) => n + b.weight, 0);
  for (const b of bugs) {
    r -= b.weight;
    if (r < 0) return b.id;
  }
  return bugs[bugs.length - 1].id;
}

/** Cách cũ (trước khi bốc thật): con của ngày bốc sẵn theo khoá ngày. Chỉ dùng cho ngày cũ chưa lưu `bugId`. */
export function legacyBugFor(date: string, bugs: BugInfo[]): string {
  return pickWeighted(bugs, hashUnit(date));
}

/** Chọn một con trong nhóm theo `weight`. */
export function pickBugInTier(bugs: BugInfo[], tier: BugTier, u: number): string {
  return pickWeighted(bugs.filter((b) => b.rarity === tier), u);
}

/** Bốc con của ngày: số ngẫu nhiên thứ nhất chọn nhóm, thứ hai chọn con trong nhóm. */
export function rollBug(bugs: BugInfo[], odds: Record<BugTier, number>, rng: () => number): string {
  const tier = pickTier(odds, rng());
  return pickBugInTier(bugs, tier, rng());
}

/** Chọn nhóm từ số ngẫu nhiên `u` trong [0, 1). */
export function pickTier(odds: Record<BugTier, number>, u: number): BugTier {
  if (u < odds.epic) return 'epic';
  if (u < odds.epic + odds.rare) return 'rare';
  return 'common';
}
