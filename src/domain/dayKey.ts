/** Ngày mới bắt đầu lúc 4:00 sáng giờ địa phương. */
export const DAY_START_HOUR = 4;

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayKey(now: Date): string {
  const shifted = new Date(now.getTime());
  shifted.setHours(shifted.getHours() - DAY_START_HOUR);
  return formatDate(shifted);
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}
