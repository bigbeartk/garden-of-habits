/** Ba buổi trong ngày để chia việc cần làm. */
export const PERIODS = ['morning', 'afternoon', 'evening'] as const;
export type Period = (typeof PERIODS)[number];

export const PERIOD_LABEL: Record<Period, string> = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' };

/** Buổi hiện tại: 4–11h sáng, 11–18h chiều, còn lại là tối (kể cả 0–4h, vẫn thuộc ngày hôm trước). */
export function periodOf(now: Date): Period {
  const h = now.getHours();
  if (h >= 4 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'afternoon';
  return 'evening';
}
