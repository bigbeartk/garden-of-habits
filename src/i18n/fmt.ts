import { parseDayKey } from '../domain/dayKey';
import type { Lang } from './lang';

/** Định dạng ngày/giờ theo ngôn ngữ. Bản tiếng Việt giữ đúng chữ từ trước khi có song ngữ. */
const LOCALE: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US' };
const VI_WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

export function monthLabel(lang: Lang, year: number, month: number): string {
  if (lang === 'vi') return `Tháng ${month + 1}, ${year}`;
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function weekdayName(lang: Lang, key: string): string {
  const d = parseDayKey(key);
  return lang === 'vi' ? VI_WEEKDAY_LONG[d.getDay()] : d.toLocaleDateString('en-US', { weekday: 'long' });
}

export function longDate(lang: Lang, key: string): string {
  const d = parseDayKey(key);
  if (lang === 'vi') return `${VI_WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

export const dateTime = (lang: Lang, ms: number) =>
  new Date(ms).toLocaleString(LOCALE[lang], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** không có năm; dùng cho dòng phiên bản */
export const shortDateTime = (lang: Lang, ms: number) =>
  new Date(ms).toLocaleString(LOCALE[lang], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
