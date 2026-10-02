export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening';

export function timeOfDay(now: Date): TimeOfDay {
  const h = now.getHours();
  if (h >= 4 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'afternoon';
  return 'evening';
}
