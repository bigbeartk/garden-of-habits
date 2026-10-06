# Song ngữ Việt / Anh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garden of Habits có hai ngôn ngữ giao diện (Tiếng Việt / English), đổi trong Cài đặt, mặc định theo máy, người dùng cũ giữ tiếng Việt.

**Architecture:** Lớp i18n tự viết trong `src/i18n/` (`vi.ts` là nguồn chuẩn, `en.ts` có kiểu `Messages = typeof vi` nên thiếu khoá là `tsc` lỗi), Context `useI18n()` trả `{ lang, t, setLang, tr }`. Nội dung (tên cây/chậu/dáng/hiệu ứng, lời cây) đổi sang `Localized<T> = { vi; en }` ngay trong file nội dung. Lỗi domain thành `AppError` có mã. Một unit test quét AST chặn chữ Việt viết cứng ngoài `i18n/` và `content/`.

**Tech Stack:** React 19 + TypeScript, Dexie, Vitest + jsdom + fake-indexeddb, Playwright WebKit (iPhone 13), TypeScript compiler API (đã có sẵn trong devDependencies, dùng cho test quét).

**Spec:** `docs/superpowers/specs/2026-10-06-bilingual-design.md`

## Global Constraints

- Hai ngôn ngữ: `type Lang = 'vi' | 'en'`. Không thêm thư viện i18n.
- Mặc định: setting `language` → nếu chưa có mà bảng `days` có bản ghi **trước hôm nay** → `'vi'` (người dùng cũ; chỉ xét ngày trước hôm nay vì `ensureToday` tạo bản ghi hôm nay ngay lần mở đầu của máy mới) → nếu không, `detectLang(navigator.languages)` (`vi*` → `vi`, `en*` → `en`, còn lại `en`). Kết quả suy ra **được ghi một lần** vào setting `language` ở lần mở đầu tiên; từ đó không suy lại (đổi ngôn ngữ máy sau này không tự đổi app).
- Không dịch dữ liệu người dùng gõ; `DayRecord.speech` đã lưu giữ nguyên.
- Không đổi: tên DB `chau-cay-chibi`, mã sao lưu `chau-cay-chibi-backup`, `SCHEMA_VERSION = 5`, `appId`, tên file sao lưu `chau-cay-backup-YYYY-MM-DD.json`, mọi `data-testid`, tên app `Garden of Habits`.
- Bản tiếng Việt phải **giống hệt chữ hiện tại** (test cũ và E2E cũ không phải sửa nhãn).
- Context mặc định (khi không bọc Provider) là tiếng Việt → test render không Provider vẫn tiếng Việt.
- Câu tiếng Anh: giọng chibi dễ thương, giữ emoji, không dịch từng chữ; tối đa 100 ký tự cho lời của ngày (`SPEECH_MAX`).
- Lịch luôn bắt đầu từ thứ Hai ở cả hai ngôn ngữ.
- Quy tắc repo (CLAUDE.md): TDD; nối lệnh bằng `&&`; `set -o pipefail` khi pipe test; **không** pipe Playwright vào `head` (ghi ra file); thay đổi giao diện phải chạy E2E WebKit; trước push chạy `TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run`.
- Mọi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Bảng thuật ngữ tiếng Anh (dùng thống nhất ở mọi task)

| Việt | English |
|---|---|
| Lịch / Hôm nay / Khu vườn / Cài đặt | Calendar / Today / Garden / Settings |
| Buổi Sáng / Chiều / Tối | Morning / Afternoon / Evening |
| Mục tiêu | Goal |
| Mẫu việc / Mẫu | Templates / Template |
| Nhắc việc / việc nhắc | Reminders / reminder |
| Ngày tiết kiệm năng lượng / Thức dậy | Rest day / Wake up |
| Đổi cây / Đổi chậu / Ghi chú | Change plant / Change pot / Note |
| Hạt giống / Nảy mầm / Ra chồi / Ra hoa | Seed / Sprout / Bud / Bloom |
| Cây đặc biệt / Dáng cây / Gốc | Special plant / Plant style / Original |
| Cây héo / Ngày nghỉ | Wilted / Rest days |
| Lời cây nói | Plant's words |
| Sao lưu / Khôi phục / Gộp / Thay thế | Back up / Restore / Merge / Replace |
| Ủng hộ tôi | Support me |
| Quay lại Lịch / Quay lại Cài đặt | Back to Calendar / Back to Settings |

### Nhãn tiếng Anh mà E2E (Task 10) bám vào — phải dùng đúng

`Open menu` / `Close menu`; tab `Calendar` `Today` `Garden` `Settings`; `Back to Calendar`; `Add morning task` (`afternoon`, `evening`); ô `New morning task`; `Complete: <task>`; `Delete: <task>` / `Confirm delete: <task>` / `Cancel`; `Today's goal`; `Change plant` `Change pot` `Note` `Rest day` `Wake up`; `Tap the plant`; `Previous month` / `Next month`; `Close`; thẻ Cài đặt `Ngôn ngữ · Language` với radio `Tiếng Việt` / `English`; `💾 Back up data`; `Manage templates`; `Open reminders`; `Garden` heading; nút `Display options`.

## Review Focus

1. **Người dùng cũ, iPhone để tiếng Anh, lần mở đầu tiên sau khi cập nhật** → phải ra tiếng Việt (có thể nháy một khung hình ở lần mở đầu tiên, các lần sau không nháy nhờ `goh-lang`). Test: Task 1 (`resolveLang` có ngày trước hôm nay → `vi`; máy mới sang hôm sau vẫn `en`), Task 10 E2E (cả hai trường hợp, locale `en-US`).
2. **Khôi phục file sao lưu cũ (không có `language`) bằng `replace`** → ngôn ngữ hiện tại giữ nguyên, không bị xoá về mặc định. Test: Task 2.
3. **Đổi ngôn ngữ giữa ngày** → lời cây nói của hôm nay giữ nguyên, câu khen/chạm sau đó theo ngôn ngữ mới, không crash. Test: Task 5 (TodayScreen render `en` với `speech` tiếng Việt đã lưu).
4. **Chữ tiếng Anh dài làm vỡ bố cục iPhone 13** (tóm tắt Khu vườn một dòng, dải 4 tab, hàng 4 nút dưới chậu, nút thẻ mẫu). Test: Task 10 E2E đo tràn + soát ảnh.
5. **Thông báo lỗi khi đang ở tiếng Anh** (thêm việc rỗng ở ngày tương lai, file sao lưu hỏng) → hiện tiếng Anh, không lọt câu Việt. Test: Task 4 (`errorText` mọi mã) + Task 9 (SettingsScreen `en` với file hỏng).

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/i18n/vi.ts` (mới) | Mọi chữ giao diện tiếng Việt, object lồng theo màn; chuỗi có tham số là hàm. Export `vi`, `type Messages = typeof vi`. |
| `src/i18n/en.ts` (mới) | `export const en: Messages`. |
| `src/i18n/lang.ts` (mới) | `Lang`, `LANGS`, `Localized<T>`, `tr()`, `detectLang()`, `resolveLang()`. Không import React. |
| `src/i18n/fmt.ts` (mới) | `monthLabel`, `longDate`, `dateTime`, `shortDateTime` theo `Lang`. |
| `src/i18n/I18nProvider.tsx` (mới) | Context, `I18nProvider`, `useI18n()`. |
| `src/i18n/errors.ts` (mới) | `errorText(e, t)`. |
| `src/domain/errors.ts` (mới) | `AppError`, `ErrorCode`. |
| `src/components/LanguagePicker.tsx` (mới) | Radiogroup chọn ngôn ngữ (thẻ Cài đặt). |
| `tests/unit/i18n/*.test.ts(x)` (mới) | Test lõi, fmt, errors, quét chữ cứng. |
| `tests/e2e/i18n.spec.ts` (mới) | E2E tiếng Anh. |
| `src/db/settings.ts` | Thêm `language: Lang`. |
| `src/db/backup.ts` | Trường `language`; `code`/`path` cho lỗi parse. |
| `src/domain/{calendar,growth,period}.ts` | Bỏ nhãn chữ (chuyển vào i18n). |
| `src/domain/{dayService,plannedService,reminderService,templateService}.ts` | `throw new AppError(code, …)`. |
| `src/content/**` | `name`, lời cây → `Localized`. |
| `src/app`, `src/components`, `src/screens` | Lấy chữ từ `t`. |
| `tests/unit/helpers.tsx` | `renderWithDeps(ui, deps, nav, lang = 'vi')` bọc `I18nProvider`. |
| `main.tsx` | Bọc `<I18nProvider>`. |
| `CLAUDE.md`, `docs/android.md` | Tài liệu. |

---

### Task 1: Lõi i18n + lưới chống chữ Việt viết cứng

**Files:**
- Create: `src/i18n/lang.ts`, `src/i18n/vi.ts`, `src/i18n/en.ts`, `src/i18n/I18nProvider.tsx`
- Create: `tests/unit/i18n/lang.test.ts`, `tests/unit/i18n/provider.test.tsx`, `tests/unit/i18n/no-hardcoded-vi.test.ts`
- Modify: `src/db/settings.ts`, `tests/unit/helpers.tsx`

**Interfaces:**
- Produces:
  - `type Lang = 'vi' | 'en'`; `const LANGS: readonly Lang[]`; `type Localized<T> = { vi: T; en: T }`; `tr<T>(l: Localized<T>, lang: Lang): T`
  - `detectLang(langs: readonly string[]): Lang`; `resolveLang(db: PlantDB, todayKey: string, langs?: readonly string[]): Promise<Lang>` (đọc setting; chưa có thì suy ra rồi **ghi** setting)
  - `vi` (object), `type Messages = typeof vi`, `en: Messages`
  - `I18nProvider({ children, lang?: Lang })`; `useI18n(): { lang: Lang; t: Messages; setLang(l: Lang): void; tr<T>(l: Localized<T>): T }`
  - `SettingsShape.language: Lang`
  - `renderWithDeps(ui, deps, nav?, lang: Lang = 'vi')`
  - `NOT_YET_MIGRATED: Set<string>` trong test quét (mỗi task sau xoá file đã chuyển xong; Task 9 làm nó rỗng)

- [ ] **Step 1: Viết test đỏ cho `lang.ts`**

```ts
// tests/unit/i18n/lang.test.ts
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
```

- [ ] **Step 2: Chạy, thấy đỏ**

Run: `npx vitest run tests/unit/i18n/lang.test.ts`
Expected: FAIL — `Cannot find module '../../../src/i18n/lang'`.

- [ ] **Step 3: Viết `lang.ts` và thêm setting**

```ts
// src/i18n/lang.ts
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

const deviceLangs = () => (typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]);

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
```

Trong `src/db/settings.ts`, `SettingsShape` thêm (kèm import `import type { Lang } from '../i18n/lang';`):

```ts
  /** ngôn ngữ giao diện người dùng tự chọn; không có = suy ra (resolveLang) */
  language: Lang;
```

- [ ] **Step 4: Chạy lại, xanh**

Run: `npx vitest run tests/unit/i18n/lang.test.ts`
Expected: PASS (9 test).

- [ ] **Step 5: Test đỏ cho Provider**

```tsx
// tests/unit/i18n/provider.test.tsx
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DepsProvider } from '../../../src/app/deps';
import { I18nProvider, useI18n } from '../../../src/i18n/I18nProvider';
import { getSetting } from '../../../src/db/settings';
import { makeDeps } from '../helpers';

function Probe() {
  const { lang, t, setLang } = useI18n();
  return <button type="button" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>{t.nav.tabs.today}</button>;
}

describe('I18nProvider', () => {
  it('không bọc Provider → tiếng Việt', () => {
    render(<Probe />);
    expect(screen.getByRole('button')).toHaveTextContent('Hôm nay');
  });

  it('lang cố định → không đọc DB; setLang đổi ngay, ghi setting và html lang', async () => {
    const { deps } = makeDeps();
    render(<DepsProvider value={deps}><I18nProvider lang="vi"><Probe /></I18nProvider></DepsProvider>);
    act(() => screen.getByRole('button').click());
    expect(screen.getByRole('button')).toHaveTextContent('Today');
    expect(document.documentElement.lang).toBe('en');
    await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBe('en'));
  });

  it('không cố định → dùng resolveLang (DB có setting en)', async () => {
    const { deps } = makeDeps();
    await deps.db.settings.put({ key: 'language', value: 'en' });
    render(<DepsProvider value={deps}><I18nProvider><Probe /></I18nProvider></DepsProvider>);
    await waitFor(() => expect(screen.getByRole('button')).toHaveTextContent('Today'));
  });
});
```

- [ ] **Step 6: Chạy, thấy đỏ** — `npx vitest run tests/unit/i18n/provider.test.tsx` → FAIL (module không có).

- [ ] **Step 7: Viết `vi.ts`, `en.ts` (khung ban đầu) và Provider**

`vi.ts` bắt đầu với nhóm `nav` (các task sau thêm nhóm của mình; **chữ tiếng Việt chép nguyên văn từ code hiện tại**):

```ts
// src/i18n/vi.ts
/** Nguồn chuẩn mọi chữ giao diện. Thêm chuỗi mới: thêm ở đây và ở en.ts (tsc báo nếu thiếu). */
export const vi = {
  nav: {
    tabs: { calendar: 'Lịch', today: 'Hôm nay', garden: 'Khu vườn', settings: 'Cài đặt' },
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    backToCalendar: 'Quay lại Lịch',
    backToSettings: 'Quay lại Cài đặt',
  },
};

export type Messages = typeof vi;
```

```ts
// src/i18n/en.ts
import type { Messages } from './vi';

export const en: Messages = {
  nav: {
    tabs: { calendar: 'Calendar', today: 'Today', garden: 'Garden', settings: 'Settings' },
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    backToCalendar: 'Back to Calendar',
    backToSettings: 'Back to Settings',
  },
};
```

```tsx
// src/i18n/I18nProvider.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useDeps } from '../app/deps';
import { setSetting } from '../db/settings';
import { dayKey } from '../domain/dayKey';
import { en } from './en';
import { detectLang, resolveLang, tr, type Lang, type Localized } from './lang';
import { vi, type Messages } from './vi';

const MESSAGES: Record<Lang, Messages> = { vi, en };
/** gợi ý ngôn ngữ lần trước (chỉ để khỏi nháy lúc mở app); nguồn thật là DB */
const HINT_KEY = 'goh-lang';

interface I18n {
  lang: Lang;
  t: Messages;
  setLang: (l: Lang) => void;
  tr: <T>(l: Localized<T>) => T;
}

const make = (lang: Lang, setLang: (l: Lang) => void): I18n => ({ lang, t: MESSAGES[lang], setLang, tr: (l) => tr(l, lang) });

/** Mặc định (không bọc Provider): tiếng Việt, để test cũ và component lẻ vẫn như trước. */
const I18nContext = createContext<I18n>(make('vi', () => {}));
export const useI18n = () => useContext(I18nContext);

function readHint(): Lang | null {
  try {
    const v = localStorage.getItem(HINT_KEY);
    return v === 'vi' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}
function writeHint(l: Lang) {
  try {
    localStorage.setItem(HINT_KEY, l);
  } catch {
    /* chế độ riêng tư: bỏ qua */
  }
}

/**
 * `lang` có giá trị: dùng luôn, không đọc DB (test). Không có: render ngay bằng gợi ý/ngôn ngữ máy rồi
 * đổi theo `resolveLang` khi đọc xong DB.
 */
export function I18nProvider({ children, lang: fixed }: { children: ReactNode; lang?: Lang }) {
  const { db, now } = useDeps();
  const [lang, setLangState] = useState<Lang>(() => fixed ?? readHint() ?? detectLang(navigator.languages ?? []));
  /** người dùng đã tự chọn trong lúc đang giải → đừng ghi đè */
  const chosen = useRef(false);

  useEffect(() => {
    if (fixed) return;
    let alive = true;
    resolveLang(db, dayKey(now()))
      .then((l) => {
        if (alive && !chosen.current) {
          setLangState(l);
          writeHint(l);
        }
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
    // chỉ giải một lần lúc mở app; `now` của deps mặc định là hàm ổn định
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, fixed]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    chosen.current = true;
    setLangState(l);
    writeHint(l);
    setSetting(db, 'language', l).catch(console.error);
  }, [db]);

  const value = useMemo(() => make(lang, setLang), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
```

- [ ] **Step 8: Chạy lại** — `npx vitest run tests/unit/i18n` → PASS.

- [ ] **Step 9: Helper test bọc Provider**

Trong `tests/unit/helpers.tsx`:

```tsx
import { I18nProvider } from '../../src/i18n/I18nProvider';
import type { Lang } from '../../src/i18n/lang';
// …
export function renderWithDeps(ui: ReactElement, deps: DayDeps, nav: (tab: Tab) => void = () => {}, lang: Lang = 'vi') {
  return render(
    <DepsProvider value={deps}>
      <I18nProvider lang={lang}>
        <NavContext.Provider value={nav}>{ui}</NavContext.Provider>
      </I18nProvider>
    </DepsProvider>,
  );
}
```

- [ ] **Step 10: Bọc app trong `main.tsx`**

```tsx
import { I18nProvider } from './i18n/I18nProvider';
// …
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <App />
      </I18nProvider>
    </MotionConfig>
```

- [ ] **Step 11: Test quét chữ Việt viết cứng (xanh nhờ danh sách chờ)**

```ts
// tests/unit/i18n/no-hardcoded-vi.test.ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { expect, it } from 'vitest';

/** Chữ có dấu tiếng Việt (đủ để nhận ra câu Việt; chữ không dấu như "Mini" không tính). */
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const ROOTS = ['src/app', 'src/components', 'src/screens', 'src/domain', 'src/db', 'src/hooks', 'src/platform', 'src/main.tsx'];

/**
 * File còn chữ Việt viết cứng, chờ chuyển sang i18n. Mỗi task chuyển xong thì XOÁ file khỏi đây;
 * Task 9 làm danh sách rỗng. Không bao giờ THÊM file vào đây.
 */
export const NOT_YET_MIGRATED = new Set<string>([
  // điền bằng Step 12
]);

/** Chuỗi được phép (không bao giờ tới mắt người dùng). */
const ALLOWED = new Set<string>([
  'Đã huỷ chia sẻ', // platform: AbortError chỉ để nhận diện bằng name
]);

function files(p: string): string[] {
  if (statSync(p).isFile()) return /\.tsx?$/.test(p) ? [p] : [];
  return readdirSync(p).flatMap((f) => files(join(p, f)));
}

function viStrings(file: string): string[] {
  const src = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const found: string[] = [];
  const visit = (n: ts.Node) => {
    let text: string | null = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) text = n.text;
    else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) text = n.text;
    else if (ts.isJsxText(n)) text = n.text.trim();
    if (text && VI.test(text) && !ALLOWED.has(text)) found.push(text);
    n.forEachChild(visit);
  };
  visit(src);
  return found;
}

const all = ROOTS.flatMap(files).map((f) => relative('.', f).replace(/\\/g, '/'));

it('không còn chữ Việt viết cứng ngoài src/i18n và src/content', () => {
  const offenders = all.filter((f) => !NOT_YET_MIGRATED.has(f)).map((f) => [f, viStrings(f)] as const).filter(([, s]) => s.length > 0);
  expect(offenders).toEqual([]);
});

it('danh sách chờ không chứa file đã sạch (xoá khỏi NOT_YET_MIGRATED khi chuyển xong)', () => {
  const clean = [...NOT_YET_MIGRATED].filter((f) => viStrings(f).length === 0);
  expect(clean).toEqual([]);
});
```

- [ ] **Step 12: Điền `NOT_YET_MIGRATED`**

Chạy test với danh sách rỗng: `npx vitest run tests/unit/i18n/no-hardcoded-vi.test.ts` → FAIL, `offenders` liệt kê các file. Chép đúng tên các file đó (đã sắp xếp) vào `NOT_YET_MIGRATED`. Chạy lại → PASS cả hai test.

- [ ] **Step 13: Chạy toàn bộ và kiểm kiểu**

Run: `npx tsc --noEmit && npm test`
Expected: PASS hết (test cũ không đổi).

- [ ] **Step 14: Commit**

```bash
git add src/i18n src/db/settings.ts src/main.tsx tests/unit/helpers.tsx tests/unit/i18n
git commit -m "feat(i18n): typed vi/en core, language resolution and hardcoded-Vietnamese guard"
```

---

### Task 2: Thẻ "Ngôn ngữ · Language" trong Cài đặt + sao lưu `language`

**Files:**
- Create: `src/components/LanguagePicker.tsx`
- Modify: `src/screens/SettingsScreen.tsx` (chỉ chèn thẻ), `src/screens/settings.css` (nếu cần), `src/db/backup.ts`, `src/i18n/vi.ts`, `src/i18n/en.ts`
- Test: `tests/unit/screens/SettingsScreen.test.tsx`, `tests/unit/db/backup.test.ts`

**Interfaces:**
- Consumes: `useI18n()`, `Lang`, `SettingsShape.language` (Task 1)
- Produces: `LanguagePicker()`; `BackupFile.language?: Lang`; nhóm `vi.language = { title: 'Ngôn ngữ · Language' }`

- [ ] **Step 1: Test đỏ cho thẻ**

Thêm vào `tests/unit/screens/SettingsScreen.test.tsx`:

```tsx
it('thẻ Ngôn ngữ đổi giao diện sang English và lưu lại', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<SettingsScreen />, deps);
  const group = screen.getByRole('radiogroup', { name: 'Ngôn ngữ · Language' });
  expect(within(group).getByRole('radio', { name: 'Tiếng Việt' })).toHaveAttribute('aria-checked', 'true');
  await userEvent.click(within(group).getByRole('radio', { name: 'English' }));
  expect(within(group).getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
  await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBe('en'));
});

it('thẻ Ngôn ngữ đứng sau thẻ Lịch, trước Sao lưu', () => {
  const { deps } = makeDeps();
  renderWithDeps(<SettingsScreen />, deps);
  const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(heads.indexOf('Ngôn ngữ · Language')).toBe(heads.indexOf('Lịch') + 1);
  expect(heads.indexOf('Sao lưu & khôi phục')).toBe(heads.indexOf('Ngôn ngữ · Language') + 1);
});
```

(Dùng import sẵn có của file; thêm `within`, `userEvent`, `getSetting` nếu thiếu. Nếu tiêu đề thẻ Lịch trong file đang là chữ khác "Lịch", dùng đúng chữ đó.)

- [ ] **Step 2: Chạy → FAIL** (`radiogroup` không có): `npx vitest run tests/unit/screens/SettingsScreen.test.tsx`

- [ ] **Step 3: Viết `LanguagePicker` + chèn thẻ**

`vi.ts` / `en.ts` thêm `language: { title: 'Ngôn ngữ · Language' }` (giống nhau ở cả hai để ai cũng tìm thấy).

```tsx
// src/components/LanguagePicker.tsx
import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/lang';

/** Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó. */
const NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English' };

export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="card settings__section">
      <h2 id="lang-title">{t.language.title}</h2>
      <div className="settings__row" role="radiogroup" aria-labelledby="lang-title">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            className={lang === l ? 'btn btn--primary' : 'btn'}
            onClick={() => setLang(l)}
          >
            {NAMES[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
```

Trong `SettingsScreen.tsx`, chèn `<LanguagePicker />` ngay sau `</div>` của thẻ Lịch (sau hai `SettingSwitch`), trước thẻ `Sao lưu & khôi phục`.

- [ ] **Step 4: Chạy → PASS.** Thêm `'src/components/LanguagePicker.tsx'` thì **không** cần vào danh sách chờ vì file không có chữ Việt có dấu ngoài `NAMES` — kiểm: `npx vitest run tests/unit/i18n/no-hardcoded-vi.test.ts`. Nếu fail vì `'Tiếng Việt'`, thêm `'Tiếng Việt'` vào `ALLOWED` với chú thích `// tên ngôn ngữ, viết bằng chính nó`.

- [ ] **Step 5: Test đỏ cho sao lưu**

Thêm vào `tests/unit/db/backup.test.ts` (dùng helper sẵn có của file để tạo DB/backup):

```ts
describe('language trong sao lưu', () => {
  it('createBackup ghi language nếu đã chọn', async () => {
    const db = makeDb();
    await setSetting(db, 'language', 'en');
    expect((await createBackup(db, 1)).language).toBe('en');
  });

  it('replace: file có language → ghi; file không có → giữ ngôn ngữ của máy', async () => {
    const db = makeDb();
    await setSetting(db, 'language', 'en');
    const base = await createBackup(makeDb(), 1); // không có language
    await restoreBackup(db, base, 'replace');
    expect(await getSetting(db, 'language')).toBe('en');
    await restoreBackup(db, { ...base, language: 'vi' }, 'replace');
    expect(await getSetting(db, 'language')).toBe('vi');
  });

  it('merge: máy đã chọn → giữ; máy chưa chọn → lấy từ file', async () => {
    const a = makeDb();
    await setSetting(a, 'language', 'vi');
    const file = { ...(await createBackup(makeDb(), 1)), language: 'en' as const };
    await restoreBackup(a, file, 'merge');
    expect(await getSetting(a, 'language')).toBe('vi');
    const b = makeDb();
    await restoreBackup(b, file, 'merge');
    expect(await getSetting(b, 'language')).toBe('en');
  });

  it('parseBackup nhận language và từ chối giá trị lạ', async () => {
    const ok = parseBackup(JSON.stringify({ ...(await createBackup(makeDb(), 1)), language: 'en' }));
    expect(ok.ok && ok.backup.language).toBe('en');
    const bad = parseBackup(JSON.stringify({ ...(await createBackup(makeDb(), 1)), language: 'fr' }));
    expect(bad.ok).toBe(false);
  });
});
```

- [ ] **Step 6: Chạy → FAIL.**

- [ ] **Step 7: Sửa `backup.ts`**

- `BackupSchema` thêm: `language: z.enum(['vi', 'en']).optional(), // file cũ chưa có`
- `createBackup`: đọc `const language = await getSetting(db, 'language');` và thêm `...(language ? { language } : {}),`
- `restoreBackup` nhánh `replace`: `if (backup.language) await setSetting(db, 'language', backup.language);` (**không** xoá khi file thiếu)
- nhánh `merge`: `if (backup.language && (await getSetting(db, 'language')) === undefined) await setSetting(db, 'language', backup.language);`

- [ ] **Step 8: Chạy** — `npx tsc --noEmit && npm test` → PASS.

Lưu ý: sau khi khôi phục, `I18nProvider` không tự đọc lại setting. Chấp nhận: lần mở app sau sẽ theo setting mới (ghi chú trong CLAUDE.md ở Task 11).

- [ ] **Step 9: Commit**

```bash
git add src/components/LanguagePicker.tsx src/screens/SettingsScreen.tsx src/db/backup.ts src/i18n tests/unit
git commit -m "feat(i18n): language card in Settings and language in backups"
```

---

### Task 3: Định dạng ngày/tháng + nhãn buổi/giai đoạn

**Files:**
- Create: `src/i18n/fmt.ts`, `tests/unit/i18n/fmt.test.ts`
- Modify: `src/domain/calendar.ts` (bỏ `WEEKDAY_SHORT`, `WEEKDAY_LONG`, `monthLabel`, `longDateLabel`), `src/domain/growth.ts` (bỏ `STAGE_LABEL`), `src/domain/period.ts` (bỏ `PERIOD_LABEL`), `tests/unit/domain/calendar.test.ts`, `tests/unit/domain/period.test.ts`
- Modify (người dùng nhãn): `src/components/{DayCell,DayDetailSheet,InlineAdd,PlannedList,TemplateForm,TodoList}.tsx`, `src/screens/{CalendarScreen,FutureDayScreen,TemplatesScreen,SettingsScreen}.tsx`
- Modify: `src/i18n/vi.ts`, `src/i18n/en.ts`

**Interfaces:**
- Produces trong `vi`/`en`:
  - `period: Record<Period, string>` (`Sáng/Chiều/Tối` ↔ `Morning/Afternoon/Evening`)
  - `stage: Record<GrowthStage, string>`
  - `calendar.weekdaysShort: string[]` (bắt đầu thứ Hai), `calendar.prevMonth`, `calendar.nextMonth`
- Produces trong `fmt.ts`: `monthLabel(lang, year, month)`, `longDate(lang, key)`, `dateTime(lang, ms)`, `shortDateTime(lang, ms)` (không năm, dùng cho dòng phiên bản)

- [ ] **Step 1: Test đỏ**

```ts
// tests/unit/i18n/fmt.test.ts
import { describe, expect, it } from 'vitest';
import { dateTime, longDate, monthLabel } from '../../../src/i18n/fmt';
import { en } from '../../../src/i18n/en';
import { vi } from '../../../src/i18n/vi';

describe('fmt', () => {
  it('tiếng Việt giữ đúng chữ cũ', () => {
    expect(monthLabel('vi', 2026, 9)).toBe('Tháng 10, 2026');
    expect(longDate('vi', '2026-10-01')).toBe('Thứ Năm, 01/10/2026');
    expect(longDate('vi', '2026-10-04')).toBe('Chủ Nhật, 04/10/2026');
    expect(vi.calendar.weekdaysShort).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  });
  it('English', () => {
    expect(monthLabel('en', 2026, 9)).toBe('October 2026');
    expect(longDate('en', '2026-10-01')).toBe('Thursday, Oct 1, 2026');
    expect(en.calendar.weekdaysShort).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
  it('dateTime theo locale', () => {
    const ms = new Date(2026, 9, 6, 14, 5).getTime();
    expect(dateTime('vi', ms)).toBe(new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    expect(dateTime('en', ms)).toContain('2026');
  });
  it('nhãn buổi và giai đoạn', () => {
    expect([vi.period.morning, vi.period.afternoon, vi.period.evening]).toEqual(['Sáng', 'Chiều', 'Tối']);
    expect(en.stage.bloom).toBe('Bloom');
  });
});
```

- [ ] **Step 2: Chạy → FAIL.**

- [ ] **Step 3: Viết `fmt.ts` và thêm nhóm vào `vi`/`en`**

```ts
// src/i18n/fmt.ts
import { parseDayKey } from '../domain/dayKey';
import type { Lang } from './lang';

const LOCALE: Record<Lang, string> = { vi: 'vi-VN', en: 'en-US' };
const VI_WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

export function monthLabel(lang: Lang, year: number, month: number): string {
  if (lang === 'vi') return `Tháng ${month + 1}, ${year}`;
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function longDate(lang: Lang, key: string): string {
  const d = parseDayKey(key);
  if (lang === 'vi') return `${VI_WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
}

export const dateTime = (lang: Lang, ms: number) =>
  new Date(ms).toLocaleString(LOCALE[lang], { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const shortDateTime = (lang: Lang, ms: number) =>
  new Date(ms).toLocaleString(LOCALE[lang], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
```

Trong `fmt.ts` chuỗi Việt nằm trong `src/i18n/` nên không bị test quét.

`vi.ts` thêm (import `type { Period }` và `type { GrowthStage }`):

```ts
  period: { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' } as Record<Period, string>,
  stage: { seed: 'Hạt giống', sprout: 'Nảy mầm', bud: 'Ra chồi', bloom: 'Ra hoa' } as Record<GrowthStage, string>,
  calendar: {
    weekdaysShort: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    prevMonth: 'Tháng trước',
    nextMonth: 'Tháng sau',
  },
```

`en.ts`:

```ts
  period: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
  stage: { seed: 'Seed', sprout: 'Sprout', bud: 'Bud', bloom: 'Bloom' },
  calendar: {
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
  },
```

- [ ] **Step 4: Chạy fmt test → PASS.**

- [ ] **Step 5: Bỏ nhãn khỏi domain, sửa test domain**

- Xoá `WEEKDAY_SHORT`, `WEEKDAY_LONG`, `pad`, `monthLabel`, `longDateLabel` khỏi `calendar.ts` (giữ import `parseDayKey` nếu còn dùng, không thì bỏ). Xoá `STAGE_LABEL` khỏi `growth.ts`, `PERIOD_LABEL` khỏi `period.ts`.
- `tests/unit/domain/calendar.test.ts`: xoá import `monthLabel, longDateLabel` và 3 dòng `expect` của chúng (đã chuyển sang `fmt.test.ts`).
- `tests/unit/domain/period.test.ts`: bỏ `PERIOD_LABEL` khỏi import, xoá dòng `expect(PERIODS.map((p) => PERIOD_LABEL[p]))…` (đã có trong fmt test).

- [ ] **Step 6: Sửa nơi dùng** (`npx tsc --noEmit` liệt kê đủ). Ở mỗi component thêm `const { t, lang } = useI18n();` rồi:
- `PERIOD_LABEL[p]` → `t.period[p]`; `STAGE_LABEL[x]` → `t.stage[x]`
- `longDateLabel(k)` → `longDate(lang, k)`; `monthLabel(y, m)` → `monthLabel(lang, y, m)`; `WEEKDAY_SHORT` → `t.calendar.weekdaysShort` (key của `<span>` dùng index)
- `CalendarScreen` nút `aria-label="Tháng trước"` → `t.calendar.prevMonth`, `"Tháng sau"` → `t.calendar.nextMonth`
- `SettingsScreen`: bỏ hàm `formatDateTime` cục bộ, dùng `dateTime(lang, ms)`; dòng phiên bản dùng `shortDateTime(lang, __BUILD_TIME__)`
- Các câu ghép như `` `Thêm việc buổi ${PERIOD_LABEL[period]}` `` tạm viết `` `Thêm việc buổi ${t.period[period]}` `` (Task 6 chuyển thành hàm i18n).

- [ ] **Step 7: Chạy** — `npx tsc --noEmit && npm test` → PASS. Test quét: file đã sạch nào thì xoá khỏi `NOT_YET_MIGRATED` (test thứ hai sẽ báo).

- [ ] **Step 8: Commit**

```bash
git add -A src tests
git commit -m "feat(i18n): locale-aware dates, weekday, period and stage labels"
```

---

### Task 4: Mã lỗi `AppError` + lỗi sao lưu + `errorText`

**Files:**
- Create: `src/domain/errors.ts`, `src/i18n/errors.ts`, `tests/unit/i18n/errors.test.ts`
- Modify: `src/domain/{dayService,plannedService,reminderService,templateService}.ts`, `src/db/backup.ts`, `src/i18n/vi.ts`, `src/i18n/en.ts`, `tests/unit/db/backup.test.ts`

**Interfaces:**
- Produces:
  - `type ErrorCode = 'dayLocked' | 'dayNotFound' | 'todoNotFound' | 'emptyTask' | 'emptyReminder' | 'emptyTemplateName' | 'templateNotFound' | 'reminderNotFound' | 'plannedNotFuture' | 'specialLocked' | 'styleLocked' | 'unknownPlant' | 'unknownPot' | 'unknownStyle'`
  - `type ErrorParams = { date?: string; id?: string }`
  - `class AppError extends Error { code: ErrorCode; params: ErrorParams }` — `message` = `vi.errors[code](params)`
  - `LockedDayError extends AppError` (giữ tên, `name = 'LockedDayError'`)
  - `errorText(e: unknown, t: Messages): string`
  - `type BackupErrorCode = 'notJson' | 'wrongFormat' | 'tooNew' | 'corrupt'`; `ParseResult` lỗi = `{ ok: false; error: string; code: BackupErrorCode; path?: string }`
  - `vi.errors: Record<ErrorCode, (p: ErrorParams) => string>`; `vi.backup.errors: Record<BackupErrorCode, (path?: string) => string>`

- [ ] **Step 1: Test đỏ**

```ts
// tests/unit/i18n/errors.test.ts
import { describe, expect, it } from 'vitest';
import { AppError, LockedDayError, type ErrorCode } from '../../../src/domain/errors';
import { errorText } from '../../../src/i18n/errors';
import { en } from '../../../src/i18n/en';
import { vi } from '../../../src/i18n/vi';
import { parseBackup } from '../../../src/db/backup';

const CODES = Object.keys(vi.errors) as ErrorCode[];
const VI_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

describe('errorText', () => {
  it('mọi mã có câu tiếng Anh, không lọt chữ Việt', () => {
    for (const code of CODES) {
      const s = errorText(new AppError(code, { date: '2026-10-01', id: 'x' }), en);
      expect(s.length).toBeGreaterThan(0);
      expect(s).not.toMatch(VI_CHARS);
    }
  });
  it('message của AppError là câu tiếng Việt (log và test cũ)', () => {
    expect(new LockedDayError('2026-10-01').message).toBe('Ngày 2026-10-01 đã qua, chỉ có thể sửa ghi chú.');
    expect(new LockedDayError('2026-10-01')).toBeInstanceOf(AppError);
  });
  it('lỗi lạ → message gốc', () => {
    expect(errorText(new Error('boom'), en)).toBe('boom');
  });
});

describe('parseBackup trả mã lỗi', () => {
  it.each([
    ['{', 'notJson'],
    ['{"format":"x"}', 'wrongFormat'],
    ['{"format":"chau-cay-chibi-backup","schemaVersion":999}', 'tooNew'],
    ['{"format":"chau-cay-chibi-backup","schemaVersion":1}', 'corrupt'],
  ])('%s → %s', (text, code) => {
    const r = parseBackup(text);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe(code);
      expect(en.backup.errors[r.code](r.path)).not.toMatch(VI_CHARS);
    }
  });
});
```

- [ ] **Step 2: Chạy → FAIL.**

- [ ] **Step 3: Viết code**

`vi.ts` thêm (chép nguyên văn câu cũ):

```ts
  errors: {
    dayLocked: (p: ErrorParams) => `Ngày ${p.date} đã qua, chỉ có thể sửa ghi chú.`,
    dayNotFound: (p: ErrorParams) => `Không tìm thấy ngày ${p.date}`,
    todoNotFound: (_p: ErrorParams) => 'Không tìm thấy việc cần làm',
    emptyTask: (_p: ErrorParams) => 'Nội dung việc cần làm không được để trống',
    emptyReminder: (_p: ErrorParams) => 'Nội dung việc nhắc không được để trống',
    emptyTemplateName: (_p: ErrorParams) => 'Tên mẫu không được để trống',
    templateNotFound: (_p: ErrorParams) => 'Không tìm thấy mẫu',
    reminderNotFound: (_p: ErrorParams) => 'Không tìm thấy việc nhắc',
    plannedNotFuture: (_p: ErrorParams) => 'Chỉ lên lịch được cho ngày sau hôm nay',
    specialLocked: (_p: ErrorParams) => 'Cây đặc biệt này chưa mở khoá',
    styleLocked: (_p: ErrorParams) => 'Dáng cây này chưa mở khoá',
    unknownPlant: (p: ErrorParams) => `Không có loại cây "${p.id}"`,
    unknownPot: (p: ErrorParams) => `Không có loại chậu "${p.id}"`,
    unknownStyle: (p: ErrorParams) => `Không có dáng "${p.id}"`,
  },
  backup: {
    errors: {
      notJson: (_path?: string) => 'File không phải JSON hợp lệ.',
      wrongFormat: (_path?: string) => 'Đây không phải file sao lưu của Garden of Habits.',
      tooNew: (_path?: string) => 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.',
      corrupt: (path?: string) => `File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "${path ?? ''}").`,
    },
  },
```

`en.ts`:

```ts
  errors: {
    dayLocked: (p) => `${p.date} is in the past — only the note can be changed.`,
    dayNotFound: (p) => `Couldn't find the day ${p.date}`,
    todoNotFound: () => "Couldn't find that task",
    emptyTask: () => "A task can't be empty",
    emptyReminder: () => "A reminder can't be empty",
    emptyTemplateName: () => "The template name can't be empty",
    templateNotFound: () => "Couldn't find that template",
    reminderNotFound: () => "Couldn't find that reminder",
    plannedNotFuture: () => 'You can only plan days after today',
    specialLocked: () => "This special plant isn't unlocked yet",
    styleLocked: () => "This plant style isn't unlocked yet",
    unknownPlant: (p) => `Unknown plant "${p.id}"`,
    unknownPot: (p) => `Unknown pot "${p.id}"`,
    unknownStyle: (p) => `Unknown style "${p.id}"`,
  },
  backup: {
    errors: {
      notJson: () => "This file isn't valid JSON.",
      wrongFormat: () => "This isn't a Garden of Habits backup file.",
      tooNew: () => 'This backup was made by a newer version of the app. Please update the app and try again.',
      corrupt: (path) => `The backup file is damaged or missing data (at "${path ?? ''}").`,
    },
  },
```

`ErrorParams` khai báo trong `src/domain/errors.ts` và `vi.ts` import kiểu đó:

```ts
// src/domain/errors.ts
import { vi } from '../i18n/vi';

export type ErrorParams = { date?: string; id?: string };
export type ErrorCode = keyof typeof vi.errors;

/** Lỗi nghiệp vụ có mã để giao diện dịch; message là câu tiếng Việt (log, test cũ). */
export class AppError extends Error {
  constructor(readonly code: ErrorCode, readonly params: ErrorParams = {}) {
    super(vi.errors[code](params));
    this.name = 'AppError';
  }
}

export class LockedDayError extends AppError {
  constructor(date: string) {
    super('dayLocked', { date });
    this.name = 'LockedDayError';
  }
}
```

(Vòng import `vi.ts` ↔ `errors.ts` chỉ là `import type` phía `vi.ts` nên không sao.)

```ts
// src/i18n/errors.ts
import { AppError } from '../domain/errors';
import type { Messages } from './vi';

/** Câu báo lỗi cho người dùng theo ngôn ngữ đang dùng. */
export function errorText(e: unknown, t: Messages): string {
  if (e instanceof AppError) return t.errors[e.code](e.params);
  return e instanceof Error ? e.message : String(e);
}
```

`dayService.ts`: xoá class `LockedDayError` cũ, `export { LockedDayError } from './errors';` (giữ đường import cũ); đổi từng `throw new Error(...)` / `Promise.reject(new Error(...))` theo bảng:

| Câu cũ | Mới |
|---|---|
| `` `Không tìm thấy ngày ${date}` `` | `new AppError('dayNotFound', { date })` |
| `'Không tìm thấy việc cần làm'` | `new AppError('todoNotFound')` |
| `'Nội dung việc cần làm không được để trống'` (dayService ×2, plannedService ×2) | `new AppError('emptyTask')` |
| `` `Không có loại cây "${plantId}"` `` | `new AppError('unknownPlant', { id: plantId })` |
| `'Cây đặc biệt này chưa mở khoá'` | `new AppError('specialLocked')` |
| `` `Không có dáng "${styleId}"` `` | `new AppError('unknownStyle', { id: styleId })` |
| `'Dáng cây này chưa mở khoá'` | `new AppError('styleLocked')` |
| `` `Không có loại chậu "${potId}"` `` | `new AppError('unknownPot', { id: potId })` |
| `'Chỉ lên lịch được cho ngày sau hôm nay'` (×2) | `new AppError('plannedNotFuture')` |
| `'Nội dung việc nhắc không được để trống'` | `new AppError('emptyReminder')` |
| `'Không tìm thấy việc nhắc'` | `new AppError('reminderNotFound')` |
| `'Tên mẫu không được để trống'` | `new AppError('emptyTemplateName')` |
| `'Không tìm thấy mẫu'` (×2) | `new AppError('templateNotFound')` |

`backup.ts` `parseBackup`: mỗi nhánh lỗi trả `{ ok: false, code, error: vi.backup.errors[code](path), ...(path ? { path } : {}) }` với `path = issue.path.join('.')` cho `corrupt`; cập nhật kiểu `ParseResult`.

- [ ] **Step 4: Chạy** — `npx tsc --noEmit && npm test` → PASS (test cũ so `message`/`error` vẫn đúng chữ).

- [ ] **Step 5: Đổi chỗ hiện lỗi trên giao diện**

`grep -rn "e.message\|\.message)" src/screens src/components` — mỗi chỗ `setError(e.message)` / `(e as Error).message` hiện cho người dùng đổi thành `setError(errorText(e, t))` (lấy `t` từ `useI18n()`). `SettingsScreen` nhánh `!result.ok` đổi `setError(result.error)` → `setError(t.backup.errors[result.code](result.path))`.

- [ ] **Step 6: Test giao diện lỗi tiếng Anh** — thêm vào `tests/unit/screens/SettingsScreen.test.tsx`:

```tsx
it('file sao lưu hỏng báo lỗi tiếng Anh khi đang dùng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<SettingsScreen />, deps, undefined, 'en');
  const file = new File(['{'], 'x.json', { type: 'application/json' });
  await userEvent.upload(screen.getByTestId('restore-input'), file);
  expect(await screen.findByText("This file isn't valid JSON.")).toBeInTheDocument();
});
```

Chạy → PASS.

- [ ] **Step 7: Commit**

```bash
git add -A src tests
git commit -m "feat(i18n): coded AppError and backup error codes translated in the UI"
```

---

### Task 5: Nội dung song ngữ (`Localized`) + câu tiếng Anh

**Files:**
- Modify: `src/content/types.ts`, `src/content/plants/{sunflower,corn,cactus,monstera,orange,cherry,rose,watermelon,tulip}.tsx`, `src/content/plants/styles.ts` (nếu đọc `name`), `src/content/pots/registry.ts`, `src/content/specials/registry.ts`, `src/content/{sayings,praises,taps,support}.ts`
- Modify (người dùng `.name` / `pick*`): `src/screens/{GardenScreen,TodayScreen}.tsx`, `src/components/{DayDetailSheet,PlantPickerSheet,PlantScene,PotPickerSheet}.tsx`, `src/dev/ArtGallery.tsx`
- Test: `tests/unit/content/{plants,praises,sayings,taps,registries,styles}.test.*`, `tests/unit/screens/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `Localized<T>`, `tr`, `Lang` (Task 1)
- Produces:
  - `PlantSpecies.name | PlantStyle.name | PotStyle.name | SpecialVariant.name: Localized<string>`
  - `PlantSpecies.sayings? | praises? | taps?: Localized<string[]>`
  - `COMMON_SAYINGS | COMMON_PRAISES | BLOOM_PRAISES | COMMON_TAPS | SLEEPY_TAPS: Localized<string[]>`
  - `pickSaying(species, rng, lang: Lang)`, `pickPraise(species, rng, bloomed: boolean, lang: Lang)`, `pickTap(species, rng, { last, sleeping, lang })`

- [ ] **Step 1: Test đỏ cho nội dung** — sửa các test nội dung để kiểm **mỗi ngôn ngữ**:

```ts
// tests/unit/content/sayings.test.ts (thay phần kiểm số lượng)
import { LANGS } from '../../../src/i18n/lang';
// …
it.each(LANGS)('COMMON_SAYINGS[%s]: ≥ 30 câu, không trùng, ≤ 100 ký tự', (lang) => {
  const list = COMMON_SAYINGS[lang];
  expect(list.length).toBeGreaterThanOrEqual(30);
  expect(new Set(list).size).toBe(list.length);
  for (const s of list) expect(s.length).toBeLessThanOrEqual(100);
});
it.each(LANGS)('mỗi loài có ≥ 2 lời của ngày [%s]', (lang) => {
  for (const p of PLANTS) expect(p.sayings?.[lang].length ?? 0).toBeGreaterThanOrEqual(2);
});
it('pickSaying lấy từ đúng ngôn ngữ', () => {
  const sunflower = getSpecies('sunflower');
  const pool = new Set([...COMMON_SAYINGS.en, ...(sunflower.sayings?.en ?? [])]);
  for (let i = 0; i < 20; i++) expect(pool).toContain(pickSaying(sunflower, mulberry32(i), 'en'));
});
```

Tương tự `praises.test.ts` (≥ 1 câu khen mỗi loài mỗi ngôn ngữ; `BLOOM_PRAISES[lang]` khi ra hoa), `taps.test.ts` (≥ 2 câu chạm mỗi loài mỗi ngôn ngữ; `SLEEPY_TAPS[lang]` khi ngủ; không lặp câu vừa nói). `plants.test.tsx` / `registries.test.tsx` / `styles.test.tsx`: mọi `name.vi` và `name.en` là chuỗi không rỗng; giữ nguyên các kiểm tra khác, chỗ nào so `name` bằng chuỗi thì đổi sang `name.vi`.

Câu tiếng Anh dài hơn: thêm vào `sayings.test.ts`
```ts
it('lời của ngày tiếng Anh vẫn ≤ 100 ký tự kể cả của loài', () => {
  for (const p of PLANTS) for (const s of p.sayings?.en ?? []) expect(s.length).toBeLessThanOrEqual(100);
});
```

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/content` → FAIL (kiểu/thuộc tính).

- [ ] **Step 3: Đổi kiểu trong `content/types.ts`** — `name: Localized<string>` ở 4 interface; `sayings?/praises?/taps?: Localized<string[]>` (import `type { Localized } from '../i18n/lang'`).

- [ ] **Step 4: Đổi dữ liệu.** Tên tiếng Anh dùng bảng sau; câu tiếng Anh viết mới (cùng số lượng hoặc nhiều hơn bản Việt, giữ emoji, giọng chibi, ≤ 100 ký tự):

| id | vi | en |
|---|---|---|
| sunflower | Hướng dương | Sunflower |
| corn | Ngô | Corn |
| cactus | Xương rồng | Cactus |
| pothos | Monstera | Monstera |
| orange | Cây cam | Orange tree |
| cherry | Cherry | Cherry |
| rose | Hoa hồng | Rose |
| watermelon | Dưa hấu | Watermelon |
| hydrangea | Tulip | Tulip |

Dáng: `mini` Mini/Mini, `giant` Khổng lồ/Giant, `popcorn` Bỏng ngô/Popcorn, `rainbow` Cầu vồng/Rainbow, `bunny` Tai thỏ/Bunny ears, `barrel` Cầu vàng/Golden barrel, `pole` Leo cột/Moss pole, `trailing` Rủ/Trailing, `kumquat` Quất Tết/Lunar New Year kumquat, `bonsai` Bonsai/Bonsai, `weeping` Rủ/Weeping, `lantern` Cần câu/Fishing rod, `arch` Cổng vòm/Arch, `dome` Chuông kính/Glass dome, `square` Vuông/Square, `trellis` Giàn leo/Trellis, `parrot` Vẹt/Parrot, `bouquet` Bó hoa/Bouquet. (Tên dáng `Gốc` → `Original` nằm ở i18n, Task 6.)

Chậu: Đất nung/Terracotta, Sứ chấm bi/Polka dot, Gốm mint/Mint ceramic, Giỏ mây/Rattan basket, Hộp gỗ/Wooden box, Cốc hồng/Pink cup, Sứ hoa hồng/Rose porcelain, Xô thiếc/Tin bucket, Gốm xanh lam/Blue ceramic, Bê tông/Concrete, Bể kính/Glass bowl, Chậu mèo/Cat pot.

Hiệu ứng: Phát sáng/Glow, Lấp lánh/Sparkle, Cầu vồng/Rainbow, Vàng ròng/Solid gold, Pha lê/Crystal.

Lời loài cây giữ tính cách: xương rồng `cool` (ngầu, ngắn gọn, "chill"), hoa hồng `lady` (sang chảnh, "darling", "my dear"). Ví dụ hướng dương:

```ts
  name: { vi: 'Hướng dương', en: 'Sunflower' },
  sayings: {
    vi: ['Hôm nay mình hướng về phía bạn nè! 🌻', 'Nắng lên rồi, mình cùng tỏa sáng nha ☀️'],
    en: ["Today I'm turning my face toward you! 🌻", "The sun's up — let's shine together ☀️"],
  },
  praises: { vi: ['Bạn sáng chói như mặt trời luôn 🌻'], en: ["You're as bright as the sun! 🌻"] },
  taps: {
    vi: ['Bạn là mặt trời của mình đó ☀️', 'Mình quay theo bạn nè 🌻'],
    en: ["You're my sunshine ☀️", "Look, I'm turning to follow you 🌻"],
  },
```

`support.ts`: chữ hiển thị chuyển sang i18n ở Task 9; ở đây không đổi.

- [ ] **Step 5: Đổi hàm chọn câu** — ví dụ `taps.ts`:

```ts
export function pickTap(species: PlantSpecies, rng: Rng, { last, sleeping, lang }: { last: string | null; sleeping: boolean; lang: Lang }): string {
  const pool = sleeping ? SLEEPY_TAPS[lang] : [...COMMON_TAPS[lang], ...(species.taps?.[lang] ?? [])];
  const fresh = pool.filter((t) => t !== last);
  return pickUniform(fresh.length > 0 ? fresh : pool, rng);
}
```

`pickSaying(species, rng, lang)` và `pickPraise(species, rng, bloomed, lang)` làm tương tự (đúng một lần gọi `pickUniform` như cũ).

- [ ] **Step 6: Sửa nơi dùng** (`npx tsc --noEmit` liệt kê): lấy `{ lang, tr } = useI18n()`; `species.name` → `tr(species.name)`; `pot.name`, `special.name`, `getStyle(...)?.name` tương tự; `TodayScreen` truyền `lang` vào `pickSaying/pickPraise/pickTap`. `PlantScene` `aria-label={title ?? tr(species.name)}`. `ArtGallery` dùng `name.vi`.

- [ ] **Step 7: Sửa `TodayScreen.test.tsx`** — các chỗ `[...COMMON_TAPS, ...(species.taps ?? [])]` đổi thành `[...COMMON_TAPS.vi, ...(species.taps?.vi ?? [])]`; tương tự `SLEEPY_TAPS.vi`, `COMMON_PRAISES.vi`, `BLOOM_PRAISES.vi`, `COMMON_SAYINGS.vi`. (Test đổi ngôn ngữ giữa ngày nằm ở Task 7 vì cần nhãn tiếng Anh của màn Hôm nay.)

- [ ] **Step 8: Chạy** — `npx tsc --noEmit && npm test` → PASS.

- [ ] **Step 9: Commit**

```bash
git add -A src tests
git commit -m "feat(i18n): bilingual plant, pot, style and effect names and plant lines"
```


---

### Task 6: Chữ của khung app + component dùng chung

**Files:**
- Modify: `src/app/{nav,TabBar}.tsx`; `src/components/{BackButton,BottomSheet,ConfirmButton,DeleteWithConfirm,SpeechBubble,SkyBackground,MiniPlant,PotPickerSheet,PlantPickerSheet,NoteSheet,InlineAdd,TodoList,PlannedList,DayCell,DayDetailSheet,TemplateForm,BackgroundPicker}.tsx`; `src/components/backgrounds/*.tsx`; `src/i18n/{vi,en}.ts`; `tests/unit/i18n/no-hardcoded-vi.test.ts`
- Test: `tests/unit/components/i18n-components.test.tsx` (mới)

**Interfaces:**
- Consumes: `useI18n()`, `t.period`, `t.nav`
- Produces trong `vi`/`en` các nhóm `common`, `todo`, `sheets`, `picker`, `dayCell`, `detail`, `templateForm`, `background`, `scenes`. Hàm có tham số, bắt buộc theo đúng mẫu sau (E2E dùng):
  - `todo.addTask(p: Period)`: vi `` `Thêm việc buổi ${period[p]}` `` / en `` `Add ${periodLower[p]} task` ``
  - `todo.newTask(p: Period)`: vi `` `Việc mới buổi ${…}` `` / en `` `New ${…} task` ``
  - `todo.complete(text)`: `Hoàn thành: …` / `Complete: …`
  - `common.delete(text)`: `Xoá: …` / `Delete: …`; `common.confirmDelete(text)`: `Xác nhận xoá: …` / `Confirm delete: …`; `common.cancel`: `Thôi` / `Cancel`; `common.close`: `Đóng` / `Close`
  - `picker.styleButton(name, n)`: `` `Dáng cây: ${name} (${n}/3)` `` / `` `Plant styles: ${name} (${n}/3)` ``; `picker.stylesOf(name)`: `Dáng của …` / `…'s styles`; `picker.backToPlants`: `Quay lại chọn cây` / `Back to plants`; `picker.base`: `Gốc` / `Original`; `picker.mystery`: `Dáng bí ẩn` / `Mystery style`; `picker.unlockAt(n)`: `Ra hoa ${n} ngày để mở` / `Bloom ${n} days to unlock`; `picker.progressLabel`: `Tiến độ mở dáng` / `Style unlock progress`

Quy trình cho **mỗi file** (lặp lại, đây là toàn bộ cách làm):
1. Mở file, liệt kê mọi chuỗi Việt (test quét in ra đúng danh sách: tạm xoá file khỏi `NOT_YET_MIGRATED` rồi chạy test quét).
2. Mỗi chuỗi → một khoá trong nhóm tương ứng ở `vi.ts` (**chép nguyên văn**), chuỗi có biến → hàm. Thêm bản `en.ts` theo bảng thuật ngữ.
3. Thay trong component bằng `t.<nhóm>.<khoá>` (lấy `const { t } = useI18n();`). Hằng số module-level (vd. `OPTIONS` của `BackgroundPicker`, `STATUS_LABEL` của `DayCell`) đổi thành map id → khoá đọc trong component: `t.background.options[id]`.
4. `npx tsc --noEmit && npx vitest run` cho file test liên quan.

- [ ] **Step 1: Test đỏ (render tiếng Anh)**

```tsx
// tests/unit/components/i18n-components.test.tsx
import { screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { TabBar } from '../../../src/app/TabBar';
import { InlineAddButton } from '../../../src/components/InlineAdd';
import { DeleteWithConfirm } from '../../../src/components/DeleteWithConfirm';
import { makeDeps, renderWithDeps } from '../helpers';

it('TabBar tiếng Anh', () => {
  renderWithDeps(<TabBar current="calendar" onChange={() => {}} />, makeDeps().deps, undefined, 'en');
  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

it('nút ＋ buổi tiếng Anh', () => {
  renderWithDeps(<InlineAddButton period="morning" onClick={() => {}} />, makeDeps().deps, undefined, 'en');
  expect(screen.getByRole('button', { name: 'Add morning task' })).toBeInTheDocument();
});

it('xoá có xác nhận tiếng Anh', async () => {
  renderWithDeps(<DeleteWithConfirm text="Read" onDelete={() => {}} />, makeDeps().deps, undefined, 'en');
  expect(screen.getByRole('button', { name: 'Delete: Read' })).toBeInTheDocument();
});
```

Trước khi viết, mở `InlineAdd.tsx` và `DeleteWithConfirm.tsx` để dùng **đúng tên export và props hiện có** (sửa 2 test cuối theo đó; không đổi API component).

- [ ] **Step 2: Chạy → FAIL.**

- [ ] **Step 3: Chuyển chữ theo quy trình trên** cho các file trong danh sách, xoá từng file khỏi `NOT_YET_MIGRATED` khi sạch. Riêng các cảnh nền (`backgrounds/*.tsx`): chữ thường chỉ là `aria-label`/`<title>` của SVG → nhóm `scenes`.

- [ ] **Step 4: Chạy** — `npx tsc --noEmit && npm test` → PASS (test cũ tiếng Việt không đổi, test quét xanh).

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "feat(i18n): translate app shell and shared components"
```

---

### Task 7: Màn Lịch, Hôm nay, Ngày tương lai

**Files:**
- Modify: `src/screens/{CalendarScreen,TodayScreen,FutureDayScreen}.tsx`, `src/components/GoalInput.tsx` (nếu cần), `src/i18n/{vi,en}.ts`, `tests/unit/i18n/no-hardcoded-vi.test.ts`
- Test: `tests/unit/screens/{CalendarScreen,TodayScreen}.test.tsx`

**Interfaces:**
- Produces nhóm `calendar` (bổ sung), `today`, `future`. Bắt buộc:
  - `today.goalLabel`: `Mục tiêu hôm nay` / `Today's goal`; `today.goalPlaceholder`: `Đặt mục tiêu cho hôm nay…` / `Set a goal for today…`
  - `future.goalLabel`: `Mục tiêu ngày này` / `Goal for this day`; `future.goalPlaceholder`: `Đặt mục tiêu cho ngày này…` / `Set a goal for this day…`
  - `today.changePlant` `today.changePot` `today.note` `today.restDay` `today.wakeUp` `today.tapPlant` `today.editSpeech` `today.speechLabel` `today.hideSpeech` `today.showSpeech` `today.emptySpeech` (`Chạm để viết lời cây nói ✎` / `Tap to write the plant's words ✎`) `today.specialToday(name)` `today.specialBadge(name)` `today.styleUnlocked(plant, style, more)`
  - `future.seeYou(weekday)`: vi `Hẹn gặp bạn vào ${weekday} nha!` / en `See you on ${weekday}!` — `weekday` lấy từ `fmt` (thêm `weekdayName(lang, key)` vào `fmt.ts`, vi dùng `VI_WEEKDAY_LONG`, en `toLocaleDateString('en-US', { weekday: 'long' })`, kèm test trong `fmt.test.ts`)

- [ ] **Step 1: Test đỏ** — thêm vào `TodayScreen.test.tsx` (Review Focus 3; dùng import sẵn có của file, thêm `COMMON_TAPS`, `ensureToday`, `getSpecies`, `userEvent` nếu thiếu):

```tsx
it('đổi sang English giữa ngày: lời của ngày đã lưu giữ nguyên, câu chạm theo English', async () => {
  const { deps } = makeDeps();
  await ensureToday(deps);
  const day = (await deps.db.days.toArray())[0];
  await deps.db.days.put({ ...day, speech: 'Câu tiếng Việt đã lưu' });
  renderWithDeps(<TodayScreen />, deps, undefined, 'en');
  expect(await screen.findByText('Câu tiếng Việt đã lưu')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Tap the plant' }));
  const species = getSpecies(day.plantId);
  await waitFor(() =>
    expect([...COMMON_TAPS.en, ...(species.taps?.en ?? [])]).toContain(screen.getByTestId('speech-bubble').textContent),
  );
});

it('Hôm nay bằng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<TodayScreen />, deps, undefined, 'en');
  expect(await screen.findByLabelText("Today's goal")).toBeInTheDocument();
  for (const name of ['Change plant', 'Change pot', 'Note', 'Rest day', 'Add morning task', 'Back to Calendar']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  }
});
```

`CalendarScreen.test.tsx`:

```tsx
it('Lịch bằng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<CalendarScreen />, deps, undefined, 'en');
  expect(await screen.findByRole('heading', { name: 'October 2026' })).toBeInTheDocument();
  expect(screen.getByText('Mon')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Previous month' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy → FAIL.**
- [ ] **Step 3: Chuyển chữ** (quy trình của Task 6) cho 3 màn; xoá khỏi `NOT_YET_MIGRATED`.
- [ ] **Step 4:** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): translate Calendar, Today and future-day screens"`

---

### Task 8: Khu vườn

**Files:**
- Modify: `src/screens/GardenScreen.tsx`, `src/i18n/{vi,en}.ts`, `tests/unit/i18n/no-hardcoded-vi.test.ts`
- Test: `tests/unit/screens/GardenScreen.test.tsx`

**Interfaces:**
- Produces nhóm `garden`: `title`, `from`, `to`, `thisMonth`, `last30`, `all`, `options` (`Tuỳ chọn hiển thị` / `Display options`), `onlyPlanted`, `separateSpecial`, `wilted` (`Cây héo`/`Wilted`), `rest` (`Ngày nghỉ`/`Rest days`), `empty`, `summary(days, blooms, tasks, specials)`.
- `summary` tiếng Anh ngắn để vừa một dòng: `` `${d} ${d === 1 ? 'day' : 'days'} · ${b} bloom · ${t} ${t === 1 ? 'task' : 'tasks'} · ✨ ${s} special` `` (vi giữ nguyên chữ cũ).

- [ ] **Step 1: Test đỏ**

```tsx
it('Khu vườn bằng English: tóm tắt có số nhiều', async () => {
  const { deps } = makeDeps();
  await deps.db.days.bulkPut([makeDay({ date: '2026-10-01', finalStage: 'bloom', todos: [] }), makeDay({ date: '2026-10-02' })]);
  renderWithDeps(<GardenScreen />, deps, undefined, 'en');
  expect(await screen.findByTestId('garden-summary')).toHaveTextContent(/^2 days · 1 bloom · 0 tasks · ✨ 0 special$/);
  expect(screen.getByRole('button', { name: 'Display options' })).toBeInTheDocument();
});
```

(Điều chỉnh dữ liệu theo đúng cách `gardenReport` đếm nếu số khác; khẳng định chính là định dạng.)

- [ ] **Step 2: Chạy → FAIL.** **Step 3:** chuyển chữ. **Step 4:** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(i18n): translate Garden screen"`

---

### Task 9: Cài đặt, Mẫu, Nhắc việc, Ủng hộ — danh sách chờ về 0

**Files:**
- Modify: `src/screens/{SettingsScreen,TemplatesScreen,RemindersScreen}.tsx`, `src/components/SupportCard.tsx`, `src/content/support.ts` (chỉ để lại URL/đường dẫn ảnh), các file còn trong `NOT_YET_MIGRATED`, `src/i18n/{vi,en}.ts`
- Test: `tests/unit/screens/{SettingsScreen,TemplatesScreen,RemindersScreen}.test.tsx`, `tests/unit/i18n/no-hardcoded-vi.test.ts`

**Interfaces:**
- Produces nhóm `settings`, `install`, `templates`, `reminders`, `support`. Bắt buộc:
  - `settings.backupNow`: `💾 Sao lưu dữ liệu` / `💾 Back up data`; `settings.restoreFromFile`: `📂 Khôi phục từ file` / `📂 Restore from file`; `settings.saved(name, native)`: en `` `Created ${name} ✓ ${native ? 'Remember to save it to Google Drive or Files.' : 'Remember to save it to Files or iCloud Drive.'}` ``
  - `settings.manageTemplates`: `Quản lý mẫu` / `Manage templates`; `settings.openReminders`: `Mở nhắc việc` / `Open reminders`; `settings.version(v, time, native)`
  - `templates.newTemplate`: `＋ Mẫu mới` / `＋ New template`; `templates.name`: `Tên mẫu` / `Template name`; `templates.makeDefault(name)`: `Đặt làm mặc định: …` / `Make default: …`; `templateForm.items(p)` (đã có ở Task 6)
  - `reminders.add`: `＋ Việc nhắc mới` / `＋ New reminder`; `reminders.complete(text)`: `Hoàn thành nhắc: …` / `Complete reminder: …`; `reminders.uncomplete(text)`; `reminders.addToToday(text)`: `Thêm vào hôm nay: …` / `Add to today: …`; `reminders.todayPill`: `☀ Hôm nay` / `☀ Today`
  - `support.*`: tiêu đề, lời mời, `Lưu mã QR` / `Save QR code`, `Ủng hộ qua PayPal` / `Support via PayPal`, lỗi lưu QR

- [ ] **Step 1: Test đỏ** — mỗi màn một test render `'en'` khẳng định 2–3 nhãn chính ở trên (theo mẫu Task 7). Ví dụ:

```tsx
it('Nhắc việc bằng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<RemindersScreen onBack={() => {}} />, deps, undefined, 'en');
  expect(await screen.findByRole('button', { name: '＋ New reminder' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Back to Settings' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Chạy → FAIL.** **Step 3:** chuyển chữ cho các file còn lại; `NOT_YET_MIGRATED` phải **rỗng**. Sau đó đổi khai báo thành `const NOT_YET_MIGRATED = new Set<string>(); // đã chuyển hết — không thêm lại` và giữ nguyên hai test.
- [ ] **Step 4:** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5: Kiểm bằng mắt chuỗi Việt còn sót trong `en`:** `grep -nP "[ạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđ]" src/i18n/en.ts` → chỉ được ra `Tiếng Việt` (nếu có).
- [ ] **Step 6: Commit** — `git commit -m "feat(i18n): translate Settings, Templates, Reminders and Support; no hardcoded Vietnamese left"`

---

### Task 10: E2E tiếng Anh trên WebKit + soát bố cục

**Files:**
- Create: `tests/e2e/i18n.spec.ts`
- Modify (chỉ khi tràn): `src/i18n/en.ts` (rút gọn chữ) hoặc CSS liên quan

- [ ] **Step 1: Viết E2E**

```ts
// tests/e2e/i18n.spec.ts
import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

async function goTabEn(page: Page, name: 'Calendar' | 'Today' | 'Garden' | 'Settings') {
  const open = page.getByRole('button', { name: 'Open menu' });
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name, exact: true }).click();
}

test.describe('máy tiếng Anh', () => {
  test.use({ locale: 'en-US' });

  test('cài mới → tiếng Anh; luồng chính chạy được', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await goTabEn(page, 'Today');
    await page.getByRole('button', { name: 'Add morning task' }).click();
    const draft = page.getByLabel('New morning task');
    await draft.fill('Drink water');
    await draft.press('Enter');
    await page.keyboard.press('Escape');
    await page.getByRole('checkbox', { name: 'Complete: Drink water' }).click();
    await expect(page.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom');
    await expect(page.getByTestId('speech-bubble')).toHaveAttribute('data-kind', 'praise');
  });

  test('chọn Tiếng Việt trong Cài đặt → giữ sau khi tải lại', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    await goTabEn(page, 'Settings');
    await page.getByRole('radio', { name: 'Tiếng Việt' }).click();
    await expect(page.getByRole('heading', { name: 'Sao lưu & khôi phục' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tháng trước' })).toBeVisible();
  });

  test('máy mới tiếng Anh: sang hôm sau vẫn English (không bị coi là người dùng cũ)', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-01T10:00:00'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible();
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Previous month' })).toBeVisible();
  });

  test('người dùng cũ (có ngày trước hôm nay, chưa có setting) vẫn tiếng Việt dù máy tiếng Anh', async ({ page }) => {
    // hôm qua: app tạo bản ghi ngày 01/10
    await page.clock.setFixedTime(at('2026-10-01T10:00:00'));
    await page.goto('/');
    await expect(page.getByTestId('calendar-card')).toBeVisible();
    // giả lập bản cũ chưa từng có song ngữ: xoá setting language và gợi ý localStorage
    await page.evaluate(async () => {
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').delete('language');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      });
      localStorage.removeItem('goh-lang');
    });
    // hôm nay mở bản mới
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tháng trước' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tháng trước' })).toBeVisible();
  });

  test('tóm tắt Khu vườn tiếng Anh với số lớn vẫn một dòng; tab và nút không tràn', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    await goTabEn(page, 'Garden');
    const summary = page.getByTestId('garden-summary');
    await summary.evaluate((el) => {
      el.textContent = '9999 days · 9999 bloom · 99999 tasks · ✨ 9999 special';
    });
    const fits = await summary.evaluate((el) => el.scrollWidth <= el.clientWidth + 1);
    expect(fits).toBe(true);
    await page.getByRole('button', { name: 'Open menu' }).click();
    const tabs = page.locator('#fnav-tabs');
    expect(await tabs.evaluate((el) => el.getBoundingClientRect().left >= 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy E2E WebKit**

Run (ghi ra file, không pipe `head`): `npm run e2e > pw.log 2>&1; echo exit=$?` rồi `grep -nE "passed|failed|Error" pw.log`
Expected: mọi test (cũ + 5 mới) passed.

- [ ] **Step 3: Chụp ảnh soát bố cục tiếng Anh** — script tạm trong scratchpad (không commit) dùng Playwright WebKit `devices['iPhone 13']`, `locale: 'en-US'`, chụp: Lịch, Hôm nay (có 3 việc mỗi buổi, có khung `special-intro` nếu được), bảng Đổi cây + màn dáng, Ngày tương lai, Khu vườn (mở Display options), Cài đặt (cuộn hết), Mẫu (có 1 mẫu), Nhắc việc (có 2 việc). Xem từng ảnh: chữ tràn/xuống dòng xấu ở hàng 4 nút dưới chậu, hàng nút thẻ mẫu, nút viên `☀ Today`, dải tab, khung `style-unlock`. Tràn thì rút gọn chữ trong `en.ts` trước; chỉ sửa CSS nếu không rút được. Sửa xong chạy lại Step 2.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/i18n.spec.ts src
git commit -m "test(e2e): English UI on WebKit iPhone 13"
```

---

### Task 11: Tài liệu, kiểm tra kiểu CI, push

**Files:**
- Modify: `CLAUDE.md`, `docs/android.md`

- [ ] **Step 1: `CLAUDE.md`**
  - Đầu file: thay "Toàn bộ chữ trên giao diện là **tiếng Việt**." bằng: "Giao diện **song ngữ Việt / Anh** (`src/i18n/`): mọi chữ mới phải thêm vào `vi.ts` **và** `en.ts` (tsc báo thiếu); test `no-hardcoded-vi` chặn chữ Việt viết cứng ngoài `src/i18n` và `src/content`. Nội dung mới (cây, chậu, dáng, hiệu ứng, lời cây) phải có `{ vi, en }`."
  - Thêm mục **Ngôn ngữ** ở "Quy tắc nghiệp vụ": luật giải ngôn ngữ (setting → có ngày cũ → máy; ghi lại lần đầu), thẻ `Ngôn ngữ · Language` sau thẻ Lịch, `goh-lang` trong localStorage, lời cây nói đã lưu không dịch, khôi phục sao lưu đổi ngôn ngữ có hiệu lực ở lần mở sau.
  - Bảng "Thêm cây mới": tên/lời thành `Localized`; test cần ≥ số câu **mỗi ngôn ngữ**.
  - Danh sách nhãn test: ghi rằng test unit render tiếng Việt mặc định (`renderWithDeps(..., lang = 'vi')`), E2E tiếng Anh ở `tests/e2e/i18n.spec.ts` dùng nhãn tiếng Anh tương ứng.
  - Settings shape: thêm `language: 'vi' | 'en'`; mục sao lưu thêm `"language"` tuỳ chọn.
  - Thứ tự thẻ Cài đặt: Nhắc việc → Mẫu việc → Lịch → Ngôn ngữ → Sao lưu & khôi phục → Ủng hộ tôi.
- [ ] **Step 2: `docs/android.md`** — thêm vào checklist soát tay: "Máy để tiếng Anh, cài mới → app tiếng Anh; đổi sang Tiếng Việt trong Cài đặt, thoát hẳn mở lại vẫn tiếng Việt."
- [ ] **Step 3: Kiểm tra đầy đủ như CI**

```bash
set -o pipefail && npx tsc --noEmit && npm test && TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run && npm run build
```
Expected: tất cả pass.

- [ ] **Step 4: Commit và push**

```bash
git add CLAUDE.md docs/android.md
git commit -m "docs: document bilingual UI"
git push origin main
```

Sau đó kiểm tra run mới nhất: `https://api.github.com/repos/bigbeartk/garden-of-habits/actions/runs?per_page=1` (cả job PWA và `android` phải xanh).
