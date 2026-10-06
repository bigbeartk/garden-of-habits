import type { PlantDB } from '../db/db';
import { getSetting, setSetting } from '../db/settings';

export type Lang = 'vi' | 'en';
export const LANGS: readonly Lang[] = ['vi', 'en'];
/** Một giá trị có bản cho từng ngôn ngữ (tên cây, lời cây nói…). */
export type Localized<T> = { vi: T; en: T };

export const tr = <T,>(l: Localized<T>, lang: Lang): T => l[lang];

/** Ngôn ngữ của máy: phần tử đầu tiên là vi* hoặc en* quyết định; không có thì tiếng Anh. */
export function detectLang(langs: readonly string[]): Lang {
  for (const l of langs) {
    const base = l.toLowerCase().slice(0, 2);
    if (base === 'vi' || base === 'en') return base;
  }
  return 'en';
}

export const deviceLangs = (): readonly string[] =>
  typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language];

/**
 * Ngôn ngữ hiển thị: đã có setting → theo đó. Chưa có: có ngày TRƯỚC hôm nay (người dùng từ trước khi có
 * song ngữ) → tiếng Việt; máy mới → theo máy. Kết quả suy ra được ghi lại ngay để lần sau không suy lại
 * (nếu không, máy mới tiếng Anh sang hôm sau sẽ có "ngày cũ" và bị đổi sang tiếng Việt).
 * Chỉ xét ngày trước `todayKey` vì `ensureToday` tạo bản ghi hôm nay ngay lần mở đầu.
 */
export async function resolveLang(db: PlantDB, todayKey: string, langs: readonly string[] = deviceLangs()): Promise<Lang> {
  const saved = await getSetting(db, 'language');
  if (saved === 'vi' || saved === 'en') return saved;
  const hasOldDays = (await db.days.where('date').below(todayKey).count()) > 0;
  const lang: Lang = hasOldDays ? 'vi' : detectLang(langs);
  await setSetting(db, 'language', lang);
  return lang;
}
