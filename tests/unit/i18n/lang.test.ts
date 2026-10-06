import { describe, expect, it } from 'vitest';
import { detectLang, resolveLang, tr } from '../../../src/i18n/lang';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDb, makeDay } from '../helpers';

describe('detectLang', () => {
  it('máy tiếng Việt → vi', () => expect(detectLang(['vi-VN', 'en-US'])).toBe('vi'));
  it('máy tiếng Anh → en', () => expect(detectLang(['en-GB'])).toBe('en'));
  it('ngôn ngữ đầu tiên có hỗ trợ quyết định', () => expect(detectLang(['fr-FR', 'vi'])).toBe('vi'));
  it('không hỗ trợ / rỗng → en', () => {
    expect(detectLang(['ja-JP'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });
});

describe('resolveLang', () => {
  const TODAY = '2026-10-06';
  it('có setting → dùng setting', async () => {
    const db = makeDb();
    await db.days.put(makeDay({ date: '2026-10-01' }));
    await setSetting(db, 'language', 'en');
    expect(await resolveLang(db, TODAY, ['vi-VN'])).toBe('en');
  });
  it('người dùng cũ (có ngày trước hôm nay, chưa chọn) → vi dù máy tiếng Anh, và ghi lại', async () => {
    const db = makeDb();
    await db.days.put(makeDay({ date: '2026-10-01' }));
    expect(await resolveLang(db, TODAY, ['en-US'])).toBe('vi');
    expect(await getSetting(db, 'language')).toBe('vi');
  });
  it('máy mới chỉ có bản ghi hôm nay → theo máy, và ghi lại', async () => {
    const db = makeDb();
    await db.days.put(makeDay({ date: TODAY }));
    expect(await resolveLang(db, TODAY, ['en-US'])).toBe('en');
    expect(await getSetting(db, 'language')).toBe('en');
  });
  it('lần sau không suy lại: máy mới tiếng Anh vẫn English dù đã có ngày cũ', async () => {
    const db = makeDb();
    expect(await resolveLang(db, '2026-10-01', ['en-US'])).toBe('en');
    await db.days.put(makeDay({ date: '2026-10-01' }));
    expect(await resolveLang(db, TODAY, ['en-US'])).toBe('en');
  });
});

it('tr chọn đúng nhánh', () => {
  expect(tr({ vi: 'Hướng dương', en: 'Sunflower' }, 'en')).toBe('Sunflower');
});
