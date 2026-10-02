# Chậu Cây Chibi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an offline PWA todo app for iPhone where finishing todos waters a chibi plant that grows through 4 stages, with a cute calendar history, templates, rest days, and backup/restore.

**Architecture:** React SPA built with Vite and made installable/offline with vite-plugin-pwa. All data lives in IndexedDB via Dexie. Pure TypeScript domain logic (`src/domain`) is unit-tested in isolation; content (plants, pots, special effects) lives in registries under `src/content` so new items are one file + one registry line. Screens consume a `DayDeps` context (db, catalog, rng, clock) so tests can inject a fresh DB, a seeded RNG and a controllable clock.

**Tech Stack:** Vite 6+, React 19, TypeScript 5, vite-plugin-pwa (Workbox), Dexie 4 + dexie-react-hooks, motion (`motion/react`), zod, @fontsource (Baloo 2, Quicksand), Vitest + jsdom + Testing Library + fake-indexeddb, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-chibi-plant-todo-design.md`

## Global Constraints

- Node ≥ 20 for development; target iOS Safari ≥ 16.4 running as an installed home-screen PWA.
- All user-facing copy is Vietnamese.
- A day starts at **04:00 local time** (`DAY_START_HOUR = 4`); day keys are `'YYYY-MM-DD'`.
- Growth by ratio of todos done that day: 0 done (or 0 todos) → `seed`; ≥1 done → `sprout`; ≥50% → `bud`; 100% → `bloom`.
- Special plant chance is exactly **10%** per new day (`SPECIAL_CHANCE = 0.1`).
- Past days are locked: only the note may be edited. The energy-saving (rest) day can only be toggled for **today**.
- Unfinished todos stay on their own day; a new day only receives the default template's items.
- Days with no record (after the first-ever record, before today) render a **wilted plant**.
- Pastel tokens (exact): peach `#FFD6DE`, mint `#CDEFE3`, butter `#FFF1C1`, lavender `#E3D9FF`, sky `#D4ECFF`, text cocoa `#5B4636`.
- Fonts: Baloo 2 (headings) + Quicksand (body), self-hosted through `@fontsource` — **no runtime network requests**; everything is precached.
- Binary data (calendar background) is stored in IndexedDB as `{ mime, data: ArrayBuffer }`, never as a `Blob` (Safari IndexedDB Blob bugs).
- Respect `prefers-reduced-motion` and iPhone safe-area insets.
- UI tasks (10, 12, 13, 14, 15): invoke the `frontend-design` skill before writing that task's CSS. The CSS in this plan is the baseline; visual polish may go beyond it but must keep every `data-testid`, `aria-label`, role and class name used by tests.
- Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Shell commands below are bash (Git Bash on Windows).

## Review Focus

1. **App left open or resumed across 04:00** — expected: a new day record is created on resume, the screen switches to it, and the previous day becomes locked (test in Task 11 `useToday`, lock test in Task 4).
2. **Calendar months before the first-ever use** — expected: blank cells, not a wall of wilted plants; today before `ensureToday` finishes is "pending", not wilted (test in Task 13 `dayCellStatus`).
3. **Restoring a corrupt, foreign, or newer-version file** — expected: a clear Vietnamese error and existing data untouched (tests in Task 6 and Task 15).
4. **Merge-restore that brings in a second default template** — expected: exactly one default remains, the most recently updated (test in Task 6).
5. **Unknown plant/pot/special ids** (removed content, or a backup from a newer version) — expected: rendering falls back to the first plant / terracotta pot / no special, never crashes (tests in Tasks 8, 9, 10).

---

## File Map

```
index.html, vite.config.ts, tsconfig.json, playwright.config.ts, pwa-assets.config.ts
public/favicon.svg (+ generated PNG icons)
src/main.tsx
src/app/        App.tsx, TabBar.tsx, nav.tsx, deps.tsx, theme.css
src/domain/     types.ts, dayKey.ts, timeOfDay.ts, random.ts, id.ts, growth.ts,
                dayService.ts, templateService.ts, calendar.ts
src/db/         db.ts, settings.ts, queries.ts, backup.ts, share.ts
src/content/    types.ts, ArtView.tsx, Face.tsx, catalog.ts, greetings.ts
  common/       SleepingSeed.tsx, WiltedPlant.tsx
  plants/       parts.tsx, sunflower.tsx, corn.tsx, cactus.tsx, pothos.tsx, orange.tsx, cherry.tsx, registry.ts
  pots/         BasicPot.tsx, pots.tsx, registry.ts
  specials/     specials.tsx, specials.css, registry.ts
src/hooks/      useNow.ts, useToday.ts, useBackupReminder.ts, useCalendarBg.ts
src/utils/      image.ts
src/components/ PlantScene.tsx, SkyBackground.tsx, MiniPlant.tsx, IconButton.tsx, BottomSheet.tsx,
                SpeechBubble.tsx, WateringCan.tsx, StageBurst.tsx, TodoList.tsx,
                PlantPickerSheet.tsx, PotPickerSheet.tsx, NoteSheet.tsx, DayCell.tsx,
                DayDetailSheet.tsx, BackgroundPicker.tsx, TemplateForm.tsx, ConfirmButton.tsx,
                scene.css, sheet.css, todo.css
src/screens/    CalendarScreen.tsx, TodayScreen.tsx, TemplatesScreen.tsx, SettingsScreen.tsx,
                calendar.css, today.css, templates.css, settings.css
tests/unit/     setup.ts, helpers.tsx, domain/*, db/*, content/*, components/*, screens/*, hooks/*
tests/e2e/      app.spec.ts
.github/workflows/deploy.yml, README.md
```

---

### Task 1: Project scaffold, theme, tab bar, PWA shell

**Files:**
- Create: `package.json` (via npm), `index.html`, `vite.config.ts`, `tsconfig.json`, `pwa-assets.config.ts`, `.gitignore`, `public/favicon.svg`, `src/main.tsx`, `src/app/App.tsx`, `src/app/TabBar.tsx`, `src/app/nav.tsx`, `src/app/theme.css`, `src/screens/CalendarScreen.tsx`, `src/screens/TodayScreen.tsx`, `src/screens/TemplatesScreen.tsx`, `src/screens/SettingsScreen.tsx`, `tests/unit/setup.ts`
- Test: `tests/unit/app/TabBar.test.tsx`

**Interfaces:**
- Produces: `type Tab = 'calendar' | 'today' | 'templates' | 'settings'`, `TABS`, `NavContext`, `useNav(): (tab: Tab) => void` (in `src/app/nav.tsx`); `TabBar({ current, onChange })`; `App()`; screen components `CalendarScreen`, `TodayScreen`, `TemplatesScreen`, `SettingsScreen` (stubs, replaced in later tasks).

- [ ] **Step 1: Install dependencies**

```bash
cd D:/Learning/Shop_Claude
npm init -y
npm pkg set type=module name=chau-cay-chibi private=true --json
npm pkg set scripts.dev="vite" scripts.build="tsc --noEmit && vite build" scripts.preview="vite preview" scripts.test="vitest run" scripts.test:watch="vitest" scripts.e2e="playwright test" scripts.icons="pwa-assets-generator"
npm i react react-dom dexie dexie-react-hooks motion zod @fontsource/baloo-2 @fontsource/quicksand
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vite-plugin-pwa @vite-pwa/assets-generator vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom fake-indexeddb @playwright/test
```

Note: `npm pkg set ... --json` with `private=true` sets a boolean; if npm complains about `name=` with `--json`, run `npm pkg set name=chau-cay-chibi` separately without `--json`.

- [ ] **Step 2: Write config files**

`.gitignore`:
```
node_modules
dist
dev-dist
test-results
playwright-report
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": ["vite/client", "vite-plugin-pwa/client", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests/unit", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Chậu Cây Chibi',
        short_name: 'Chậu Cây',
        description: 'Làm việc nhỏ mỗi ngày, tưới cây cùng nhau',
        lang: 'vi',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FFF8F0',
        theme_color: '#FFD6DE',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
});
```

`pwa-assets.config.ts`:
```ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
});
```

`index.html`:
```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
    <meta name="theme-color" content="#FFD6DE" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Chậu Cây" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
    <title>Chậu Cây Chibi</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```
(Vite rewrites the absolute `/...` asset URLs to include `base` at build time.)

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#FFD6DE"/>
  <path d="M256 300 Q250 230 256 190" stroke="#7BBF6A" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M256 200 Q200 140 160 175 Q200 220 256 200 Z" fill="#9AD98F" stroke="#5B4636" stroke-width="10"/>
  <path d="M256 200 Q312 140 352 175 Q312 220 256 200 Z" fill="#9AD98F" stroke="#5B4636" stroke-width="10"/>
  <path d="M146 300 L180 440 Q256 456 332 440 L366 300 Z" fill="#F2A88A" stroke="#5B4636" stroke-width="12" stroke-linejoin="round"/>
  <rect x="126" y="276" width="260" height="44" rx="22" fill="#E38E6E" stroke="#5B4636" stroke-width="12"/>
  <circle cx="220" cy="380" r="9" fill="#5B4636"/><circle cx="292" cy="380" r="9" fill="#5B4636"/>
  <path d="M240 400 q16 14 32 0" stroke="#5B4636" stroke-width="8" fill="none" stroke-linecap="round"/>
  <ellipse cx="196" cy="402" rx="14" ry="8" fill="#FF9FB2"/><ellipse cx="316" cy="402" rx="14" ry="8" fill="#FF9FB2"/>
</svg>
```

`tests/unit/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step 3: Generate icons**

Run: `npm run icons`
Expected: creates `public/pwa-64x64.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico`.

- [ ] **Step 4: Write the failing TabBar test**

`tests/unit/app/TabBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TabBar } from '../../../src/app/TabBar';

describe('TabBar', () => {
  it('hiển thị 4 tab và đánh dấu tab hiện tại', () => {
    render(<TabBar current="calendar" onChange={() => {}} />);
    for (const name of ['Lịch', 'Hôm nay', 'Mẫu', 'Cài đặt']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
  });

  it('gọi onChange với tab được chọn', async () => {
    const onChange = vi.fn();
    render(<TabBar current="calendar" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));
    expect(onChange).toHaveBeenCalledWith('today');
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run tests/unit/app/TabBar.test.tsx`
Expected: FAIL — cannot resolve `../../../src/app/TabBar`.

- [ ] **Step 6: Implement nav, TabBar, theme, App, stub screens, main**

`src/app/nav.tsx`:
```tsx
import { createContext, useContext } from 'react';

export type Tab = 'calendar' | 'today' | 'templates' | 'settings';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Lịch', icon: '📅' },
  { id: 'today', label: 'Hôm nay', icon: '🌱' },
  { id: 'templates', label: 'Mẫu', icon: '📝' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

export const NavContext = createContext<(tab: Tab) => void>(() => {});
export const useNav = () => useContext(NavContext);
```

`src/app/TabBar.tsx`:
```tsx
import { TABS, type Tab } from './nav';

export function TabBar({ current, onChange }: { current: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Điều hướng">
      {TABS.map((t) => {
        const active = t.id === current;
        return (
          <button
            key={t.id}
            type="button"
            className={`tabbar__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(t.id)}
          >
            <span className="tabbar__icon" aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

`src/app/theme.css`:
```css
:root {
  --peach: #FFD6DE;
  --mint: #CDEFE3;
  --butter: #FFF1C1;
  --lavender: #E3D9FF;
  --sky: #D4ECFF;
  --cocoa: #5B4636;
  --cocoa-soft: #8A7566;
  --cream: #FFF8F0;
  --white: #FFFDFB;
  --berry: #F27A93;
  --leaf: #7BBF6A;
  --radius-lg: 28px;
  --radius-md: 20px;
  --radius-sm: 14px;
  --shadow-soft: 0 6px 18px rgba(91, 70, 54, 0.12);
  --shadow-pop: 0 3px 0 rgba(91, 70, 54, 0.18);
  --font-display: 'Baloo 2', 'Quicksand', system-ui, sans-serif;
  --font-body: 'Quicksand', system-ui, sans-serif;
  --tabbar-h: 72px;
  color-scheme: light;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body {
  background: var(--cream);
  color: var(--cocoa);
  font-family: var(--font-body);
  font-weight: 500;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}
button, input, textarea { font: inherit; color: inherit; }
.app { display: flex; flex-direction: column; height: 100dvh; padding-top: env(safe-area-inset-top); }
.app__main { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.screen { min-height: 100%; padding: 16px 16px calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px); }
.screen__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.screen__title { font-family: var(--font-display); font-weight: 700; font-size: 1.6rem; margin: 0; }
.card { background: var(--white); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft); padding: 16px; }
.muted { color: var(--cocoa-soft); }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 44px; padding: 0 18px; border: 2px solid var(--cocoa); border-radius: 999px;
  background: var(--white); box-shadow: var(--shadow-pop); font-weight: 700; cursor: pointer;
  transition: transform 0.12s ease;
}
.btn:active { transform: translateY(2px) scale(0.97); box-shadow: none; }
.btn:disabled { opacity: 0.45; cursor: default; }
.btn--primary { background: var(--peach); }
.btn--ghost { border-color: transparent; box-shadow: none; background: transparent; text-decoration: underline; }
.btn--round { width: 44px; padding: 0; font-size: 1.4rem; }
.input, .textarea {
  width: 100%; min-height: 44px; padding: 10px 14px; border: 2px solid var(--lavender);
  border-radius: var(--radius-sm); background: #fff; outline: none;
}
.input:focus, .textarea:focus { border-color: var(--berry); }
.textarea { min-height: 120px; resize: vertical; }
.pill { padding: 4px 12px; border-radius: 999px; background: var(--mint); font-weight: 700; font-size: 0.9rem; }
.error { color: #C2415B; background: #FFE8EC; border-radius: var(--radius-sm); padding: 8px 12px; }
.toast { background: var(--mint); border-radius: var(--radius-sm); padding: 8px 12px; }
.link { background: none; border: none; text-decoration: underline; font-weight: 700; cursor: pointer; }
.empty { text-align: center; }
.tabbar {
  position: fixed; left: 12px; right: 12px; bottom: calc(10px + env(safe-area-inset-bottom));
  height: var(--tabbar-h); display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 8px;
  background: rgba(255, 253, 251, 0.92); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 999px; box-shadow: var(--shadow-soft); z-index: 20;
}
.tabbar__item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border: none; background: transparent; border-radius: 999px; font-size: 0.78rem; font-weight: 700;
  cursor: pointer; transition: background 0.2s, transform 0.2s;
}
.tabbar__icon { font-size: 1.35rem; line-height: 1; }
.tabbar__item.is-active { background: var(--peach); transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}
```

Stub screens (each replaced by its own later task). `src/screens/CalendarScreen.tsx`:
```tsx
export function CalendarScreen() {
  return <section className="screen"><h1 className="screen__title">Lịch</h1></section>;
}
```
`src/screens/TodayScreen.tsx`:
```tsx
export function TodayScreen() {
  return <section className="screen"><h1 className="screen__title">Hôm nay</h1></section>;
}
```
`src/screens/TemplatesScreen.tsx`:
```tsx
export function TemplatesScreen() {
  return <section className="screen"><h1 className="screen__title">Mẫu việc cần làm</h1></section>;
}
```
`src/screens/SettingsScreen.tsx`:
```tsx
export function SettingsScreen() {
  return <section className="screen"><h1 className="screen__title">Cài đặt</h1></section>;
}
```

`src/app/App.tsx`:
```tsx
import { useState } from 'react';
import { NavContext, type Tab } from './nav';
import { TabBar } from './TabBar';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export function App() {
  const [tab, setTab] = useState<Tab>('calendar');
  return (
    <NavContext.Provider value={setTab}>
      <div className="app">
        <main className="app__main">
          {tab === 'calendar' && <CalendarScreen />}
          {tab === 'today' && <TodayScreen />}
          {tab === 'templates' && <TemplatesScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
        <TabBar current={tab} onChange={setTab} />
      </div>
    </NavContext.Provider>
  );
}
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
import './app/theme.css';
import { App } from './app/App';

registerSW({ immediate: true });
void navigator.storage?.persist?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
```

- [ ] **Step 7: Run tests and build**

Run: `npx vitest run tests/unit/app/TabBar.test.tsx` → Expected: 2 passed.
Run: `npm run build` → Expected: build succeeds; `dist/` contains `sw.js` and `manifest.webmanifest`.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite React PWA with pastel theme and tab bar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Domain primitives — day key, time of day, RNG, growth

**Files:**
- Create: `src/domain/dayKey.ts`, `src/domain/timeOfDay.ts`, `src/domain/random.ts`, `src/domain/id.ts`, `src/domain/growth.ts`
- Test: `tests/unit/domain/dayKey.test.ts`, `tests/unit/domain/timeOfDay.test.ts`, `tests/unit/domain/random.test.ts`, `tests/unit/domain/growth.test.ts`

**Interfaces:**
- Produces:
  - `DAY_START_HOUR = 4`, `formatDate(d: Date): string`, `dayKey(now: Date): string`, `parseDayKey(key: string): Date`, `addDays(key: string, n: number): string`
  - `type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening'`, `timeOfDay(now: Date): TimeOfDay`
  - `type Rng = () => number`, `mulberry32(seed: number): Rng`, `pickUniform<T>(items: readonly T[], rng: Rng): T`, `pickWeighted<T extends { weight: number }>(items: readonly T[], rng: Rng): T`, `SPECIAL_CHANCE = 0.1`, `rollSpecial(specials: readonly { id: string; weight: number }[], rng: Rng): string | null`
  - `newId(): string`
  - `GROWTH_STAGES = ['seed','sprout','bud','bloom'] as const`, `type GrowthStage`, `GROWTH_THRESHOLDS`, `STAGE_LABEL: Record<GrowthStage, string>`, `stageFor(done: number, total: number): GrowthStage`, `stageOfTodos(todos: readonly { done: boolean }[]): GrowthStage`, `stageIndex(stage: GrowthStage): number`

- [ ] **Step 1: Write the failing tests**

`tests/unit/domain/dayKey.test.ts`:
```ts
import { addDays, dayKey, formatDate, parseDayKey } from '../../../src/domain/dayKey';

describe('dayKey', () => {
  it('trước 4:00 vẫn tính là ngày hôm trước', () => {
    expect(dayKey(new Date(2026, 9, 2, 3, 59))).toBe('2026-10-01');
  });
  it('từ 4:00 là ngày mới', () => {
    expect(dayKey(new Date(2026, 9, 2, 4, 0))).toBe('2026-10-02');
  });
  it('qua ranh giới năm', () => {
    expect(dayKey(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31');
  });
  it('formatDate thêm số 0', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('parseDayKey và addDays', () => {
    const d = parseDayKey('2026-10-02');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 2]);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
```

`tests/unit/domain/timeOfDay.test.ts`:
```ts
import { timeOfDay } from '../../../src/domain/timeOfDay';

const at = (h: number, m = 0) => new Date(2026, 9, 2, h, m);

describe('timeOfDay', () => {
  it.each([
    [at(3, 59), 'evening'],
    [at(4), 'morning'],
    [at(10, 59), 'morning'],
    [at(11), 'noon'],
    [at(13, 59), 'noon'],
    [at(14), 'afternoon'],
    [at(17, 59), 'afternoon'],
    [at(18), 'evening'],
    [at(0), 'evening'],
  ] as const)('%s → %s', (date, expected) => {
    expect(timeOfDay(date)).toBe(expected);
  });
});
```

`tests/unit/domain/random.test.ts`:
```ts
import { mulberry32, pickUniform, pickWeighted, rollSpecial } from '../../../src/domain/random';

describe('random', () => {
  it('mulberry32 cùng seed cho cùng dãy số trong [0,1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('pickUniform trả về mọi phần tử', () => {
    const rng = mulberry32(1);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(pickUniform(['a', 'b', 'c'], rng));
    expect([...seen].sort()).toEqual(['a', 'b', 'c']);
  });

  it('pickUniform với mảng rỗng thì báo lỗi', () => {
    expect(() => pickUniform([], mulberry32(1))).toThrow();
  });

  it('pickWeighted theo trọng số', () => {
    const rng = mulberry32(3);
    let heavy = 0;
    for (let i = 0; i < 10000; i++) {
      if (pickWeighted([{ id: 'h', weight: 9 }, { id: 'l', weight: 1 }], rng).id === 'h') heavy++;
    }
    expect(heavy / 10000).toBeGreaterThan(0.87);
    expect(heavy / 10000).toBeLessThan(0.93);
  });

  it('rollSpecial ra đặc biệt khoảng 10%', () => {
    const rng = mulberry32(42);
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (rollSpecial([{ id: 'glow', weight: 1 }], rng)) hits++;
    expect(hits / 10000).toBeGreaterThan(0.08);
    expect(hits / 10000).toBeLessThan(0.12);
  });

  it('rollSpecial không có hiệu ứng nào thì trả về null', () => {
    expect(rollSpecial([], () => 0)).toBeNull();
  });
});
```

`tests/unit/domain/growth.test.ts`:
```ts
import { stageFor, stageIndex, stageOfTodos } from '../../../src/domain/growth';

describe('growth', () => {
  it.each([
    [0, 0, 'seed'],
    [0, 3, 'seed'],
    [1, 3, 'sprout'],
    [1, 2, 'bud'],
    [2, 3, 'bud'],
    [3, 3, 'bloom'],
    [1, 1, 'bloom'],
  ] as const)('%i/%i → %s', (done, total, expected) => {
    expect(stageFor(done, total)).toBe(expected);
  });

  it('stageOfTodos đếm việc đã xong', () => {
    expect(stageOfTodos([{ done: true }, { done: false }])).toBe('bud');
  });

  it('stageIndex theo thứ tự lớn lên', () => {
    expect(stageIndex('seed')).toBeLessThan(stageIndex('sprout'));
    expect(stageIndex('sprout')).toBeLessThan(stageIndex('bud'));
    expect(stageIndex('bud')).toBeLessThan(stageIndex('bloom'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/domain`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/domain/dayKey.ts`:
```ts
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
```

`src/domain/timeOfDay.ts`:
```ts
export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening';

export function timeOfDay(now: Date): TimeOfDay {
  const h = now.getHours();
  if (h >= 4 && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'afternoon';
  return 'evening';
}
```

`src/domain/random.ts`:
```ts
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickUniform<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickUniform: danh sách rỗng');
  return items[Math.floor(rng() * items.length)];
}

export function pickWeighted<T extends { weight: number }>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickWeighted: danh sách rỗng');
  const total = items.reduce((sum, i) => sum + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return items[items.length - 1];
}

export const SPECIAL_CHANCE = 0.1;

export function rollSpecial(specials: readonly { id: string; weight: number }[], rng: Rng): string | null {
  if (specials.length === 0) return null;
  return rng() < SPECIAL_CHANCE ? pickWeighted(specials, rng).id : null;
}
```

`src/domain/id.ts`:
```ts
export const newId = (): string => crypto.randomUUID();
```

`src/domain/growth.ts`:
```ts
export const GROWTH_STAGES = ['seed', 'sprout', 'bud', 'bloom'] as const;
export type GrowthStage = (typeof GROWTH_STAGES)[number];

/** bud: tỉ lệ tối thiểu để ra chồi; bloom: tỉ lệ để ra hoa. Nảy mầm khi xong ≥ 1 việc. */
export const GROWTH_THRESHOLDS = { bud: 0.5, bloom: 1 } as const;

export const STAGE_LABEL: Record<GrowthStage, string> = {
  seed: 'Hạt giống',
  sprout: 'Nảy mầm',
  bud: 'Ra chồi',
  bloom: 'Ra hoa',
};

export function stageFor(done: number, total: number): GrowthStage {
  if (total <= 0 || done <= 0) return 'seed';
  const ratio = done / total;
  if (ratio >= GROWTH_THRESHOLDS.bloom) return 'bloom';
  if (ratio >= GROWTH_THRESHOLDS.bud) return 'bud';
  return 'sprout';
}

export function stageOfTodos(todos: readonly { done: boolean }[]): GrowthStage {
  return stageFor(todos.filter((t) => t.done).length, todos.length);
}

export function stageIndex(stage: GrowthStage): number {
  return GROWTH_STAGES.indexOf(stage);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/domain`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain tests/unit/domain
git commit -m "feat: add day key, time of day, seeded RNG and growth rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Data types and Dexie database

**Files:**
- Create: `src/domain/types.ts`, `src/db/db.ts`, `src/db/settings.ts`, `src/db/queries.ts`, `tests/unit/helpers.tsx`
- Test: `tests/unit/db/db.test.ts`

**Interfaces:**
- Consumes: `GrowthStage` (Task 2).
- Produces:
  - `src/domain/types.ts`: `Todo { id; text; done; doneAt: number | null; order }`, `DayRecord { date; plantId; potId; specialId: string | null; isRestDay; greetedAt: number | null; note; todos: Todo[]; finalStage: GrowthStage; createdAt; updatedAt }`, `Template { id; name; items: string[]; isDefault; createdAt; updatedAt }`, `CalendarBg { mime: string; data: ArrayBuffer }`, `Catalog { plants: { id; defaultPotId }[]; potIds: string[]; specials: { id; weight }[] }`
  - `src/db/db.ts`: `SCHEMA_VERSION = 1`, `class PlantDB extends Dexie { days; templates; settings }` (constructor `(name = 'chau-cay-chibi')`), singleton `db`
  - `src/db/settings.ts`: `SettingsShape { calendarBg: CalendarBg; lastBackupAt: number }`, `getSetting(db, key)`, `setSetting(db, key, value)`, `deleteSetting(db, key)`
  - `src/db/queries.ts`: `listDaysInRange(db, from, to): Promise<DayRecord[]>` (inclusive), `firstDayKey(db): Promise<string | null>`, `oldestCreatedAt(db): Promise<number | null>`
  - `tests/unit/helpers.tsx`: `makeDb(): PlantDB`, `makeDay(partial): DayRecord`

- [ ] **Step 1: Write types and the test helpers**

`src/domain/types.ts`:
```ts
import type { GrowthStage } from './growth';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: number | null;
  order: number;
}

export interface DayRecord {
  /** 'YYYY-MM-DD' theo mốc 4:00 sáng */
  date: string;
  plantId: string;
  potId: string;
  specialId: string | null;
  isRestDay: boolean;
  greetedAt: number | null;
  note: string;
  /** luôn được lưu theo thứ tự `order` tăng dần */
  todos: Todo[];
  finalStage: GrowthStage;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  items: string[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarBg {
  mime: string;
  data: ArrayBuffer;
}

/** Phần dữ liệu nội dung mà tầng domain cần (không phụ thuộc React). */
export interface Catalog {
  plants: { id: string; defaultPotId: string }[];
  potIds: string[];
  specials: { id: string; weight: number }[];
}
```

`tests/unit/helpers.tsx`:
```tsx
import { PlantDB } from '../../src/db/db';
import type { DayRecord } from '../../src/domain/types';

export function makeDb(): PlantDB {
  return new PlantDB(`test-${crypto.randomUUID()}`);
}

export function makeDay(partial: Partial<DayRecord> & { date: string }): DayRecord {
  return {
    plantId: 'sunflower',
    potId: 'terracotta',
    specialId: null,
    isRestDay: false,
    greetedAt: null,
    note: '',
    todos: [],
    finalStage: 'seed',
    createdAt: 0,
    updatedAt: 0,
    ...partial,
  };
}
```

- [ ] **Step 2: Write the failing test**

`tests/unit/db/db.test.ts`:
```ts
import { deleteSetting, getSetting, setSetting } from '../../../src/db/settings';
import { firstDayKey, listDaysInRange, oldestCreatedAt } from '../../../src/db/queries';
import { makeDay, makeDb } from '../helpers';

describe('db', () => {
  it('lưu và đọc settings, kể cả ArrayBuffer', async () => {
    const db = makeDb();
    expect(await getSetting(db, 'calendarBg')).toBeUndefined();
    await setSetting(db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([1, 2, 3]).buffer });
    const bg = await getSetting(db, 'calendarBg');
    expect(bg?.mime).toBe('image/jpeg');
    expect([...new Uint8Array(bg!.data)]).toEqual([1, 2, 3]);
    await deleteSetting(db, 'calendarBg');
    expect(await getSetting(db, 'calendarBg')).toBeUndefined();
  });

  it('listDaysInRange bao gồm cả hai đầu', async () => {
    const db = makeDb();
    await db.days.bulkPut(['2026-09-30', '2026-10-01', '2026-10-31', '2026-11-01'].map((date) => makeDay({ date })));
    const days = await listDaysInRange(db, '2026-10-01', '2026-10-31');
    expect(days.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-31']);
  });

  it('firstDayKey và oldestCreatedAt', async () => {
    const db = makeDb();
    expect(await firstDayKey(db)).toBeNull();
    expect(await oldestCreatedAt(db)).toBeNull();
    await db.days.bulkPut([makeDay({ date: '2026-10-05', createdAt: 500 }), makeDay({ date: '2026-10-02', createdAt: 200 })]);
    expect(await firstDayKey(db)).toBe('2026-10-02');
    expect(await oldestCreatedAt(db)).toBe(200);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/db/db.test.ts`
Expected: FAIL — `src/db/db` not found.

- [ ] **Step 4: Implement**

`src/db/db.ts`:
```ts
import Dexie, { type EntityTable } from 'dexie';
import type { DayRecord, Template } from '../domain/types';

export const SCHEMA_VERSION = 1;

export interface SettingRow {
  key: string;
  value: unknown;
}

export class PlantDB extends Dexie {
  days!: EntityTable<DayRecord, 'date'>;
  templates!: EntityTable<Template, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor(name = 'chau-cay-chibi') {
    super(name);
    // Khi đổi cấu trúc: thêm this.version(2).stores(...).upgrade(...) — KHÔNG sửa version(1).
    this.version(SCHEMA_VERSION).stores({
      days: 'date',
      templates: 'id, createdAt',
      settings: 'key',
    });
  }
}

export const db = new PlantDB();
```

`src/db/settings.ts`:
```ts
import type { PlantDB } from './db';
import type { CalendarBg } from '../domain/types';

export interface SettingsShape {
  calendarBg: CalendarBg;
  lastBackupAt: number;
}

export async function getSetting<K extends keyof SettingsShape>(db: PlantDB, key: K): Promise<SettingsShape[K] | undefined> {
  const row = await db.settings.get(key);
  return row?.value as SettingsShape[K] | undefined;
}

export async function setSetting<K extends keyof SettingsShape>(db: PlantDB, key: K, value: SettingsShape[K]): Promise<void> {
  await db.settings.put({ key, value });
}

export async function deleteSetting(db: PlantDB, key: keyof SettingsShape): Promise<void> {
  await db.settings.delete(key);
}
```

`src/db/queries.ts`:
```ts
import type { PlantDB } from './db';
import type { DayRecord } from '../domain/types';

export function listDaysInRange(db: PlantDB, from: string, to: string): Promise<DayRecord[]> {
  return db.days.where('date').between(from, to, true, true).toArray();
}

export async function firstDayKey(db: PlantDB): Promise<string | null> {
  const first = await db.days.orderBy('date').first();
  return first?.date ?? null;
}

export async function oldestCreatedAt(db: PlantDB): Promise<number | null> {
  const first = await db.days.orderBy('date').first();
  return first?.createdAt ?? null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/db/db.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commit**

```bash
git add src/domain/types.ts src/db tests/unit/helpers.tsx tests/unit/db
git commit -m "feat: add data types and Dexie database with settings and queries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Day service — new day, todos, lock rules, rest day, plant/pot changes

**Files:**
- Create: `src/domain/dayService.ts`
- Modify: `tests/unit/helpers.tsx` (append test deps helpers)
- Test: `tests/unit/domain/dayService.test.ts`

**Interfaces:**
- Consumes: `dayKey` (Task 2), `pickUniform`, `rollSpecial`, `Rng`, `mulberry32` (Task 2), `stageOfTodos`, `GrowthStage` (Task 2), `newId` (Task 2), `PlantDB` (Task 3), `DayRecord`, `Todo`, `Catalog` (Task 3).
- Produces (all in `src/domain/dayService.ts`):
  - `interface DayDeps { db: PlantDB; catalog: Catalog; rng: Rng; now: () => Date }`
  - `class LockedDayError extends Error`
  - `ensureToday(deps): Promise<DayRecord>`
  - `addTodo(deps, date, text): Promise<DayRecord>`; `addTodos(deps, date, texts: string[]): Promise<DayRecord>`
  - `interface ToggleResult { day: DayRecord; prevStage: GrowthStage; completed: boolean }`; `toggleTodo(deps, date, id): Promise<ToggleResult>`
  - `editTodo(deps, date, id, text)`, `deleteTodo(deps, date, id)`, `reorderTodos(deps, date, ids: string[])`, `setRestDay(deps, date, isRest: boolean)`, `changePlant(deps, date, plantId)`, `changePot(deps, date, potId)`, `setNote(deps, date, note)`, `markGreeted(deps, date)` — all `Promise<DayRecord>`
  - `tests/unit/helpers.tsx`: `TEST_CATALOG`, `makeDeps(start?: Date, catalog?: Catalog): { deps: DayDeps; clock: { current: Date } }`

- [ ] **Step 1: Append test helpers**

Append to `tests/unit/helpers.tsx` (and merge the imports at the top of the file):
```tsx
import { mulberry32 } from '../../src/domain/random';
import type { DayDeps } from '../../src/domain/dayService';
import type { Catalog } from '../../src/domain/types';

export const TEST_CATALOG: Catalog = {
  plants: [
    { id: 'sunflower', defaultPotId: 'terracotta' },
    { id: 'corn', defaultPotId: 'rattan' },
  ],
  potIds: ['terracotta', 'rattan', 'pink-cup'],
  specials: [{ id: 'glow', weight: 1 }],
};

export function makeDeps(start = new Date(2026, 9, 2, 10, 0), catalog: Catalog = TEST_CATALOG) {
  const clock = { current: start };
  const deps: DayDeps = {
    db: makeDb(),
    catalog,
    rng: mulberry32(42),
    now: () => new Date(clock.current.getTime()),
  };
  return { deps, clock };
}
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/domain/dayService.test.ts`:
```ts
import {
  LockedDayError, addTodo, addTodos, changePlant, changePot, deleteTodo, editTodo,
  ensureToday, markGreeted, reorderTodos, setNote, setRestDay, toggleTodo,
} from '../../../src/domain/dayService';
import { makeDay, makeDeps } from '../helpers';

const TEMPLATE = (isDefault: boolean, items: string[]) => ({
  id: crypto.randomUUID(), name: 'Sáng', items, isDefault, createdAt: 1, updatedAt: 1,
});

describe('ensureToday', () => {
  it('tạo ngày mới với cây trong catalog, chậu mặc định và todo từ mẫu mặc định', async () => {
    const { deps } = makeDeps();
    await deps.db.templates.bulkAdd([TEMPLATE(false, ['Không dùng']), TEMPLATE(true, ['Tập thể dục', 'Ăn sáng'])]);
    const day = await ensureToday(deps);
    expect(day.date).toBe('2026-10-02');
    const plant = deps.catalog.plants.find((p) => p.id === day.plantId)!;
    expect(plant).toBeDefined();
    expect(day.potId).toBe(plant.defaultPotId);
    expect(day.todos.map((t) => t.text)).toEqual(['Tập thể dục', 'Ăn sáng']);
    expect(day.todos.map((t) => t.order)).toEqual([0, 1]);
    expect(day.finalStage).toBe('seed');
    expect(day.greetedAt).toBeNull();
    expect(day.isRestDay).toBe(false);
  });

  it('gọi đồng thời hai lần chỉ tạo một bản ghi', async () => {
    const { deps } = makeDeps();
    const [a, b] = await Promise.all([ensureToday(deps), ensureToday(deps)]);
    expect(a).toEqual(b);
    expect(await deps.db.days.count()).toBe(1);
  });

  it('trước 4:00 sáng vẫn là ngày hôm trước', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 3, 2, 30));
    expect((await ensureToday(deps)).date).toBe('2026-10-02');
  });

  it('không có mẫu mặc định thì danh sách trống', async () => {
    const { deps } = makeDeps();
    expect((await ensureToday(deps)).todos).toEqual([]);
  });

  it('todo chưa xong hôm qua không được chuyển sang hôm nay', async () => {
    const { deps, clock } = makeDeps();
    const d1 = await ensureToday(deps);
    await addTodo(deps, d1.date, 'Việc dở');
    clock.current = new Date(2026, 9, 3, 9, 0);
    const d2 = await ensureToday(deps);
    expect(d2.date).toBe('2026-10-03');
    expect(d2.todos).toEqual([]);
  });
});

describe('todo', () => {
  it('addTodo cắt khoảng trắng và từ chối nội dung rỗng', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    const day = await addTodo(deps, date, '  Uống nước  ');
    expect(day.todos[0].text).toBe('Uống nước');
    await expect(addTodo(deps, date, '   ')).rejects.toThrow('không được để trống');
  });

  it('addTodos thêm nhiều việc vào cuối danh sách', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodo(deps, date, 'A');
    const day = await addTodos(deps, date, ['B', ' ', 'C']);
    expect(day.todos.map((t) => [t.text, t.order])).toEqual([['A', 0], ['B', 1], ['C', 2]]);
  });

  it('toggleTodo cập nhật trạng thái, giai đoạn và báo giai đoạn trước', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodos(deps, date, ['A', 'B']);
    const [a] = (await deps.db.days.get(date))!.todos;
    const r1 = await toggleTodo(deps, date, a.id);
    expect(r1.completed).toBe(true);
    expect(r1.prevStage).toBe('seed');
    expect(r1.day.finalStage).toBe('bud');
    expect(r1.day.todos[0].doneAt).toBe(deps.now().getTime());
    const r2 = await toggleTodo(deps, date, a.id);
    expect(r2.completed).toBe(false);
    expect(r2.day.todos[0].doneAt).toBeNull();
    expect(r2.day.finalStage).toBe('seed');
  });

  it('editTodo, deleteTodo và reorderTodos', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    const day = await addTodos(deps, date, ['A', 'B', 'C']);
    const [a, b, c] = day.todos;
    expect((await editTodo(deps, date, a.id, ' A2 ')).todos[0].text).toBe('A2');
    const reordered = await reorderTodos(deps, date, [c.id, a.id, b.id]);
    expect(reordered.todos.map((t) => [t.text, t.order])).toEqual([['C', 0], ['A2', 1], ['B', 2]]);
    const deleted = await deleteTodo(deps, date, a.id);
    expect(deleted.todos.map((t) => [t.text, t.order])).toEqual([['C', 0], ['B', 1]]);
  });

  it('ngày đã qua bị khoá todo nhưng vẫn sửa được ghi chú', async () => {
    const { deps, clock } = makeDeps();
    const day = await ensureToday(deps);
    const withTodo = await addTodo(deps, day.date, 'A');
    clock.current = new Date(2026, 9, 3, 9, 0);
    await expect(toggleTodo(deps, day.date, withTodo.todos[0].id)).rejects.toBeInstanceOf(LockedDayError);
    await expect(addTodo(deps, day.date, 'B')).rejects.toBeInstanceOf(LockedDayError);
    await expect(setRestDay(deps, day.date, true)).rejects.toBeInstanceOf(LockedDayError);
    expect((await setNote(deps, day.date, 'Nhật ký bù')).note).toBe('Nhật ký bù');
  });

  it('ngày không tồn tại thì báo lỗi', async () => {
    const { deps } = makeDeps();
    await expect(addTodo(deps, '2026-10-02', 'A')).rejects.toThrow('Không tìm thấy ngày');
  });
});

describe('ngày nghỉ, đổi cây, đổi chậu, chào hỏi', () => {
  it('setRestDay giữ nguyên todo', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodo(deps, date, 'A');
    const rest = await setRestDay(deps, date, true);
    expect(rest.isRestDay).toBe(true);
    expect(rest.todos).toHaveLength(1);
    expect((await setRestDay(deps, date, false)).isRestDay).toBe(false);
  });

  it('changePlant đổi chậu theo cây mới nếu đang dùng chậu mặc định', async () => {
    const { deps } = makeDeps();
    const date = '2026-10-02';
    await deps.db.days.put(makeDay({ date, plantId: 'sunflower', potId: 'terracotta', specialId: 'glow' }));
    const day = await changePlant(deps, date, 'corn');
    expect([day.plantId, day.potId, day.specialId]).toEqual(['corn', 'rattan', 'glow']);
  });

  it('changePlant giữ chậu người dùng đã tự chọn', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await changePlant(deps, date, 'sunflower');
    await changePot(deps, date, 'pink-cup');
    const day = await changePlant(deps, date, 'corn');
    expect(day.potId).toBe('pink-cup');
  });

  it('changePlant/changePot với id lạ thì báo lỗi', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await expect(changePlant(deps, date, 'banana')).rejects.toThrow();
    await expect(changePot(deps, date, 'golden-bucket')).rejects.toThrow();
  });

  it('markGreeted ghi thời điểm chào', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    expect((await markGreeted(deps, date)).greetedAt).toBe(deps.now().getTime());
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/unit/domain/dayService.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

`src/domain/dayService.ts`:
```ts
import type { PlantDB } from '../db/db';
import { dayKey } from './dayKey';
import { stageOfTodos, type GrowthStage } from './growth';
import { newId } from './id';
import { pickUniform, rollSpecial, type Rng } from './random';
import type { Catalog, DayRecord, Todo } from './types';

export interface DayDeps {
  db: PlantDB;
  catalog: Catalog;
  rng: Rng;
  now: () => Date;
}

export class LockedDayError extends Error {
  constructor(date: string) {
    super(`Ngày ${date} đã qua, chỉ có thể sửa ghi chú.`);
    this.name = 'LockedDayError';
  }
}

export async function ensureToday(deps: DayDeps): Promise<DayRecord> {
  const { db } = deps;
  const date = dayKey(deps.now());
  return db.transaction('rw', db.days, db.templates, async () => {
    const existing = await db.days.get(date);
    if (existing) return existing;
    const template = (await db.templates.toArray()).find((t) => t.isDefault);
    const plant = pickUniform(deps.catalog.plants, deps.rng);
    const ts = deps.now().getTime();
    const record: DayRecord = {
      date,
      plantId: plant.id,
      potId: plant.defaultPotId,
      specialId: rollSpecial(deps.catalog.specials, deps.rng),
      isRestDay: false,
      greetedAt: null,
      note: '',
      todos: toTodos(template?.items ?? [], 0),
      finalStage: 'seed',
      createdAt: ts,
      updatedAt: ts,
    };
    await db.days.add(record);
    return record;
  });
}

function toTodos(texts: string[], startOrder: number): Todo[] {
  return texts
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text, i) => ({ id: newId(), text, done: false, doneAt: null, order: startOrder + i }));
}

type EditKind = 'today-only' | 'note';

async function mutateDay(deps: DayDeps, date: string, kind: EditKind, fn: (day: DayRecord) => void): Promise<DayRecord> {
  const today = dayKey(deps.now());
  if (kind === 'today-only' && date !== today) throw new LockedDayError(date);
  const { db } = deps;
  return db.transaction('rw', db.days, async () => {
    const day = await db.days.get(date);
    if (!day) throw new Error(`Không tìm thấy ngày ${date}`);
    fn(day);
    day.todos.sort((a, b) => a.order - b.order).forEach((t, i) => (t.order = i));
    day.finalStage = stageOfTodos(day.todos);
    day.updatedAt = deps.now().getTime();
    await db.days.put(day);
    return day;
  });
}

function findTodo(day: DayRecord, id: string): Todo {
  const todo = day.todos.find((t) => t.id === id);
  if (!todo) throw new Error('Không tìm thấy việc cần làm');
  return todo;
}

export function addTodo(deps: DayDeps, date: string, text: string): Promise<DayRecord> {
  const clean = text.trim();
  if (!clean) return Promise.reject(new Error('Nội dung việc cần làm không được để trống'));
  return mutateDay(deps, date, 'today-only', (d) => {
    d.todos.push(...toTodos([clean], d.todos.length));
  });
}

export function addTodos(deps: DayDeps, date: string, texts: string[]): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.todos.push(...toTodos(texts, d.todos.length));
  });
}

export interface ToggleResult {
  day: DayRecord;
  prevStage: GrowthStage;
  completed: boolean;
}

export async function toggleTodo(deps: DayDeps, date: string, id: string): Promise<ToggleResult> {
  let prevStage: GrowthStage = 'seed';
  let completed = false;
  const day = await mutateDay(deps, date, 'today-only', (d) => {
    prevStage = d.finalStage;
    const todo = findTodo(d, id);
    todo.done = !todo.done;
    todo.doneAt = todo.done ? deps.now().getTime() : null;
    completed = todo.done;
  });
  return { day, prevStage, completed };
}

export function editTodo(deps: DayDeps, date: string, id: string, text: string): Promise<DayRecord> {
  const clean = text.trim();
  if (!clean) return Promise.reject(new Error('Nội dung việc cần làm không được để trống'));
  return mutateDay(deps, date, 'today-only', (d) => {
    findTodo(d, id).text = clean;
  });
}

export function deleteTodo(deps: DayDeps, date: string, id: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.todos = d.todos.filter((t) => t.id !== id);
  });
}

export function reorderTodos(deps: DayDeps, date: string, ids: string[]): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    const rank = (t: Todo) => {
      const i = ids.indexOf(t.id);
      return i === -1 ? ids.length + t.order : i;
    };
    d.todos.sort((a, b) => rank(a) - rank(b)).forEach((t, i) => (t.order = i));
  });
}

export function setRestDay(deps: DayDeps, date: string, isRest: boolean): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.isRestDay = isRest;
  });
}

export function changePlant(deps: DayDeps, date: string, plantId: string): Promise<DayRecord> {
  const next = deps.catalog.plants.find((p) => p.id === plantId);
  if (!next) return Promise.reject(new Error(`Không có loại cây "${plantId}"`));
  return mutateDay(deps, date, 'today-only', (d) => {
    const prev = deps.catalog.plants.find((p) => p.id === d.plantId);
    if (!prev || d.potId === prev.defaultPotId) d.potId = next.defaultPotId;
    d.plantId = next.id;
  });
}

export function changePot(deps: DayDeps, date: string, potId: string): Promise<DayRecord> {
  if (!deps.catalog.potIds.includes(potId)) return Promise.reject(new Error(`Không có loại chậu "${potId}"`));
  return mutateDay(deps, date, 'today-only', (d) => {
    d.potId = potId;
  });
}

export function setNote(deps: DayDeps, date: string, note: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'note', (d) => {
    d.note = note;
  });
}

export function markGreeted(deps: DayDeps, date: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.greetedAt = deps.now().getTime();
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/unit/domain/dayService.test.ts`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/domain/dayService.ts tests/unit/helpers.tsx tests/unit/domain/dayService.test.ts
git commit -m "feat: add day service with daily rollover, todo editing and lock rules

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Template service

**Files:**
- Create: `src/domain/templateService.ts`
- Test: `tests/unit/domain/templateService.test.ts`

**Interfaces:**
- Consumes: `PlantDB` (Task 3), `Template` (Task 3), `newId` (Task 2).
- Produces: `parseItems(text: string): string[]`, `listTemplates(db): Promise<Template[]>` (by `createdAt`), `createTemplate(db, name, items, now: number): Promise<Template>`, `updateTemplate(db, id, patch: { name?: string; items?: string[] }, now: number): Promise<Template>`, `deleteTemplate(db, id): Promise<void>`, `setDefaultTemplate(db, id: string | null, now: number): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/domain/templateService.test.ts`:
```ts
import {
  createTemplate, deleteTemplate, listTemplates, parseItems, setDefaultTemplate, updateTemplate,
} from '../../../src/domain/templateService';
import { makeDb } from '../helpers';

describe('templateService', () => {
  it('parseItems tách dòng, bỏ dòng trống', () => {
    expect(parseItems('  Tập thể dục \r\n\nĂn sáng\n   ')).toEqual(['Tập thể dục', 'Ăn sáng']);
  });

  it('createTemplate làm sạch dữ liệu và từ chối tên rỗng', async () => {
    const db = makeDb();
    const t = await createTemplate(db, '  Buổi sáng ', [' A ', '', 'B'], 100);
    expect(t).toMatchObject({ name: 'Buổi sáng', items: ['A', 'B'], isDefault: false, createdAt: 100, updatedAt: 100 });
    await expect(createTemplate(db, '  ', ['A'], 100)).rejects.toThrow('Tên mẫu không được để trống');
  });

  it('listTemplates theo thứ tự tạo', async () => {
    const db = makeDb();
    await createTemplate(db, 'Hai', [], 200);
    await createTemplate(db, 'Một', [], 100);
    expect((await listTemplates(db)).map((t) => t.name)).toEqual(['Một', 'Hai']);
  });

  it('setDefaultTemplate chỉ giữ một mẫu mặc định và có thể bỏ chọn', async () => {
    const db = makeDb();
    const a = await createTemplate(db, 'A', [], 1);
    const b = await createTemplate(db, 'B', [], 2);
    await setDefaultTemplate(db, a.id, 10);
    await setDefaultTemplate(db, b.id, 11);
    const all = await listTemplates(db);
    expect(all.filter((t) => t.isDefault).map((t) => t.name)).toEqual(['B']);
    await setDefaultTemplate(db, null, 12);
    expect((await listTemplates(db)).some((t) => t.isDefault)).toBe(false);
    await expect(setDefaultTemplate(db, 'missing', 13)).rejects.toThrow('Không tìm thấy mẫu');
  });

  it('updateTemplate và deleteTemplate', async () => {
    const db = makeDb();
    const a = await createTemplate(db, 'A', ['x'], 1);
    const updated = await updateTemplate(db, a.id, { name: 'A2', items: ['y', ' '] }, 5);
    expect(updated).toMatchObject({ name: 'A2', items: ['y'], updatedAt: 5, createdAt: 1 });
    await deleteTemplate(db, a.id);
    expect(await listTemplates(db)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/domain/templateService.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/domain/templateService.ts`:
```ts
import type { PlantDB } from '../db/db';
import { newId } from './id';
import type { Template } from './types';

export function parseItems(text: string): string[] {
  return text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function cleanName(name: string): string {
  const n = name.trim();
  if (!n) throw new Error('Tên mẫu không được để trống');
  return n;
}

function cleanItems(items: string[]): string[] {
  return items.map((s) => s.trim()).filter(Boolean);
}

export function listTemplates(db: PlantDB): Promise<Template[]> {
  return db.templates.orderBy('createdAt').toArray();
}

export async function createTemplate(db: PlantDB, name: string, items: string[], now: number): Promise<Template> {
  const template: Template = {
    id: newId(),
    name: cleanName(name),
    items: cleanItems(items),
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.templates.add(template);
  return template;
}

export async function updateTemplate(
  db: PlantDB,
  id: string,
  patch: { name?: string; items?: string[] },
  now: number,
): Promise<Template> {
  return db.transaction('rw', db.templates, async () => {
    const current = await db.templates.get(id);
    if (!current) throw new Error('Không tìm thấy mẫu');
    const next: Template = { ...current, updatedAt: now };
    if (patch.name !== undefined) next.name = cleanName(patch.name);
    if (patch.items !== undefined) next.items = cleanItems(patch.items);
    await db.templates.put(next);
    return next;
  });
}

export async function deleteTemplate(db: PlantDB, id: string): Promise<void> {
  await db.templates.delete(id);
}

export async function setDefaultTemplate(db: PlantDB, id: string | null, now: number): Promise<void> {
  await db.transaction('rw', db.templates, async () => {
    const all = await db.templates.toArray();
    if (id !== null && !all.some((t) => t.id === id)) throw new Error('Không tìm thấy mẫu');
    for (const t of all) {
      const shouldBeDefault = t.id === id;
      if (t.isDefault !== shouldBeDefault) await db.templates.put({ ...t, isDefault: shouldBeDefault, updatedAt: now });
    }
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/domain/templateService.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/templateService.ts tests/unit/domain/templateService.test.ts
git commit -m "feat: add todo template service with single default

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Backup, restore, merge, and backup reminder

**Files:**
- Create: `src/db/backup.ts`, `src/db/share.ts`
- Test: `tests/unit/db/backup.test.ts`

**Interfaces:**
- Consumes: `PlantDB`, `SCHEMA_VERSION` (Task 3), `getSetting`/`setSetting`/`deleteSetting` (Task 3), `GROWTH_STAGES` (Task 2), `formatDate` (Task 2).
- Produces:
  - `BACKUP_FORMAT = 'chau-cay-chibi-backup'`, `type BackupFile`, `createBackup(db, now: number): Promise<BackupFile>`, `serializeBackup(b): string`, `backupFileName(date: Date): string`
  - `type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string }`, `parseBackup(text: string): ParseResult`
  - `type RestoreMode = 'replace' | 'merge'`, `restoreBackup(db, backup, mode): Promise<{ days: number; templates: number }>`
  - `BACKUP_REMIND_AFTER_MS`, `needsBackupReminder(lastBackupAt: number | null, oldestDataAt: number | null, now: number): boolean`
  - `bytesToBase64(buf: ArrayBuffer): string`, `base64ToBytes(b64: string): ArrayBuffer`
  - `src/db/share.ts`: `shareOrDownload(file: File): Promise<void>` (throws `AbortError` if the user cancels the share sheet)

- [ ] **Step 1: Write the failing tests**

`tests/unit/db/backup.test.ts`:
```ts
import {
  BACKUP_FORMAT, BACKUP_REMIND_AFTER_MS, backupFileName, base64ToBytes, bytesToBase64, createBackup,
  needsBackupReminder, parseBackup, restoreBackup, serializeBackup,
} from '../../../src/db/backup';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDb } from '../helpers';

const tpl = (id: string, isDefault: boolean, updatedAt: number) => ({
  id, name: id, items: ['x'], isDefault, createdAt: 1, updatedAt,
});

async function seeded() {
  const db = makeDb();
  await db.days.bulkPut([
    makeDay({ date: '2026-10-01', note: 'một', updatedAt: 10 }),
    makeDay({ date: '2026-10-02', todos: [{ id: 't', text: 'A', done: true, doneAt: 5, order: 0 }], finalStage: 'bloom', updatedAt: 20 }),
  ]);
  await db.templates.put(tpl('sang', true, 3));
  await setSetting(db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([9, 8, 7]).buffer });
  return db;
}

describe('backup', () => {
  it('base64 khứ hồi', () => {
    const bytes = new Uint8Array(70000).map((_, i) => i % 256);
    expect([...new Uint8Array(base64ToBytes(bytesToBase64(bytes.buffer)))]).toEqual([...bytes]);
  });

  it('sao lưu rồi khôi phục (thay thế) ra dữ liệu giống hệt', async () => {
    const src = await seeded();
    const text = serializeBackup(await createBackup(src, 1000));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const dst = makeDb();
    await dst.days.put(makeDay({ date: '2020-01-01' }));
    const res = await restoreBackup(dst, parsed.backup, 'replace');
    expect(res).toEqual({ days: 2, templates: 1 });
    expect(await dst.days.toArray()).toEqual(await src.days.toArray());
    expect(await dst.templates.toArray()).toEqual(await src.templates.toArray());
    expect([...new Uint8Array((await getSetting(dst, 'calendarBg'))!.data)]).toEqual([9, 8, 7]);
  });

  it('parseBackup: JSON hỏng', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, error: 'File không phải JSON hợp lệ.' });
  });

  it('parseBackup: file không phải của app', () => {
    const r = parseBackup(JSON.stringify({ hello: 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('không phải file sao lưu');
  });

  it('parseBackup: phiên bản mới hơn', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 999 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('phiên bản app mới hơn');
  });

  it('parseBackup: thiếu trường thì báo vị trí lỗi', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, days: [{ date: 'x' }], templates: [], calendarBg: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('days.0');
  });

  it('gộp: bản mới hơn thắng, giữ dữ liệu chỉ có ở máy', async () => {
    const src = await seeded();
    const backup = await createBackup(src, 1000);
    const dst = makeDb();
    await dst.days.bulkPut([
      makeDay({ date: '2026-10-01', note: 'mới hơn ở máy', updatedAt: 99 }),
      makeDay({ date: '2026-10-02', note: 'cũ ở máy', updatedAt: 1 }),
      makeDay({ date: '2026-09-30', note: 'chỉ ở máy' }),
    ]);
    const res = await restoreBackup(dst, backup, 'merge');
    expect(res).toEqual({ days: 1, templates: 1 });
    expect((await dst.days.get('2026-10-01'))!.note).toBe('mới hơn ở máy');
    expect((await dst.days.get('2026-10-02'))!.finalStage).toBe('bloom');
    expect((await dst.days.get('2026-09-30'))!.note).toBe('chỉ ở máy');
  });

  it('gộp: chỉ còn một mẫu mặc định (mẫu sửa gần nhất)', async () => {
    const src = makeDb();
    await src.templates.put(tpl('tu-file', true, 50));
    const backup = await createBackup(src, 1000);
    const dst = makeDb();
    await dst.templates.put(tpl('o-may', true, 10));
    await restoreBackup(dst, backup, 'merge');
    const defaults = (await dst.templates.toArray()).filter((t) => t.isDefault).map((t) => t.id);
    expect(defaults).toEqual(['tu-file']);
  });

  it('backupFileName', () => {
    expect(backupFileName(new Date(2026, 9, 2))).toBe('chau-cay-backup-2026-10-02.json');
  });

  it('needsBackupReminder', () => {
    const now = 100 * BACKUP_REMIND_AFTER_MS;
    expect(needsBackupReminder(null, null, now)).toBe(false);
    expect(needsBackupReminder(null, now - BACKUP_REMIND_AFTER_MS - 1, now)).toBe(true);
    expect(needsBackupReminder(now - 1000, now - 10 * BACKUP_REMIND_AFTER_MS, now)).toBe(false);
    expect(needsBackupReminder(now - BACKUP_REMIND_AFTER_MS - 1, 0, now)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/db/backup.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/db/backup.ts`:
```ts
import { z } from 'zod';
import { SCHEMA_VERSION, type PlantDB } from './db';
import { deleteSetting, getSetting, setSetting } from './settings';
import { GROWTH_STAGES } from '../domain/growth';
import { formatDate } from '../domain/dayKey';

export const BACKUP_FORMAT = 'chau-cay-chibi-backup';
export const BACKUP_REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  doneAt: z.number().nullable(),
  order: z.number(),
});

const DaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plantId: z.string(),
  potId: z.string(),
  specialId: z.string().nullable(),
  isRestDay: z.boolean(),
  greetedAt: z.number().nullable(),
  note: z.string(),
  todos: z.array(TodoSchema),
  finalStage: z.enum(GROWTH_STAGES),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(z.string()),
  isDefault: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.number(),
  days: z.array(DaySchema),
  templates: z.array(TemplateSchema),
  calendarBg: z.object({ mime: z.string(), base64: z.string() }).nullable(),
});

export type BackupFile = z.infer<typeof BackupSchema>;
export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };
export type RestoreMode = 'replace' | 'merge';

export function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function createBackup(db: PlantDB, now: number): Promise<BackupFile> {
  return db.transaction('r', db.days, db.templates, db.settings, async () => {
    const days = await db.days.orderBy('date').toArray();
    const templates = await db.templates.orderBy('createdAt').toArray();
    const bg = await getSetting(db, 'calendarBg');
    return {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now,
      days,
      templates,
      calendarBg: bg ? { mime: bg.mime, base64: bytesToBase64(bg.data) } : null,
    };
  });
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup);
}

export function backupFileName(date: Date): string {
  return `chau-cay-backup-${formatDate(date)}.json`;
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Đây không phải file sao lưu của Chậu Cây Chibi.' };
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, error: 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.' };
  }
  const result = BackupSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `File sao lưu bị lỗi ở "${issue.path.join('.')}": ${issue.message}` };
  }
  return { ok: true, backup: result.data };
}

export async function restoreBackup(db: PlantDB, backup: BackupFile, mode: RestoreMode): Promise<{ days: number; templates: number }> {
  const bg = backup.calendarBg ? { mime: backup.calendarBg.mime, data: base64ToBytes(backup.calendarBg.base64) } : null;
  return db.transaction('rw', db.days, db.templates, db.settings, async () => {
    let days = 0;
    let templates = 0;
    if (mode === 'replace') {
      await db.days.clear();
      await db.templates.clear();
      await db.days.bulkPut(backup.days);
      await db.templates.bulkPut(backup.templates);
      if (bg) await setSetting(db, 'calendarBg', bg);
      else await deleteSetting(db, 'calendarBg');
      days = backup.days.length;
      templates = backup.templates.length;
    } else {
      for (const d of backup.days) {
        const cur = await db.days.get(d.date);
        if (!cur || d.updatedAt > cur.updatedAt) {
          await db.days.put(d);
          days++;
        }
      }
      for (const t of backup.templates) {
        const cur = await db.templates.get(t.id);
        if (!cur || t.updatedAt > cur.updatedAt) {
          await db.templates.put(t);
          templates++;
        }
      }
      if (bg && !(await getSetting(db, 'calendarBg'))) await setSetting(db, 'calendarBg', bg);
    }
    const defaults = (await db.templates.toArray())
      .filter((t) => t.isDefault)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    for (const t of defaults.slice(1)) await db.templates.put({ ...t, isDefault: false });
    return { days, templates };
  });
}

export function needsBackupReminder(lastBackupAt: number | null, oldestDataAt: number | null, now: number): boolean {
  if (oldestDataAt === null) return false;
  const reference = lastBackupAt ?? oldestDataAt;
  return now - reference > BACKUP_REMIND_AFTER_MS;
}
```

`src/db/share.ts`:
```ts
/** Mở menu Chia sẻ của iOS (lưu vào Tệp/iCloud); nếu không hỗ trợ thì tải file xuống. */
export async function shareOrDownload(file: File): Promise<void> {
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: file.name });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/unit/db/backup.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/backup.ts src/db/share.ts tests/unit/db/backup.test.ts
git commit -m "feat: add JSON backup, validated restore with replace/merge, and reminder rule

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Art foundation — content types, shared face, ArtView, sleeping seed, wilted plant

All plant/pot art shares one coordinate system: SVG `viewBox="0 0 200 240"`, soil surface at **y = 160**, horizontal centre **x = 100**. PNG art (`{ image }`) is drawn into the same 200×240 box, so a PNG made at 400×480 (or any 5:6 ratio) with the soil line at 2/3 height drops straight in.

**Files:**
- Create: `src/content/types.ts`, `src/content/ArtView.tsx`, `src/content/Face.tsx`, `src/content/plants/parts.tsx`, `src/content/common/SleepingSeed.tsx`, `src/content/common/WiltedPlant.tsx`
- Test: `tests/unit/content/art.test.tsx`

**Interfaces:**
- Consumes: `GrowthStage` (Task 2).
- Produces:
  - `src/content/types.ts`: `type Art = { svg: FC } | { image: string }`, `FaceAnchor { x; y; scale }`, `PlantSpecies { id; name; defaultPotId; stages: Record<GrowthStage, Art>; faceAnchor: Record<GrowthStage, FaceAnchor>; greetings?: string[] }`, `PotStyle { id; name; art: Art }`, `SpecialVariant { id; name; weight; Overlay: FC; Underlay?: FC; plantFilter?: string; plantClassName?: string }`
  - `ArtView({ art })`
  - `type Mood = 'normal' | 'smile' | 'talk' | 'sleep' | 'sad'`, `INK = '#5B4636'`, `Face({ mood, x, y, scale })`
  - `parts.tsx`: `SOIL_Y = 160`, `Seed({ color, stripe? })`, `Sprout({ leaf, stem })`, `LeafyStem({ top, leaf, stem })`, `Trunk()`, `Canopy({ fill })`, `HeartLeaf({ x, y, s?, r? })`
  - `SleepingSeed()`, `WiltedPlant()`

- [ ] **Step 1: Write the failing test**

`tests/unit/content/art.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { Face, type Mood } from '../../../src/content/Face';
import { SleepingSeed } from '../../../src/content/common/SleepingSeed';
import { WiltedPlant } from '../../../src/content/common/WiltedPlant';

const inSvg = (node: React.ReactNode) => render(<svg>{node}</svg>);

describe('art foundation', () => {
  it.each(['normal', 'smile', 'talk', 'sleep', 'sad'] as Mood[])('Face vẽ được mood %s', (mood) => {
    inSvg(<Face mood={mood} x={100} y={100} scale={1} />);
    expect(screen.getByTestId('face')).toHaveAttribute('data-mood', mood);
  });

  it('ArtView vẽ ảnh PNG', () => {
    const { container } = inSvg(<ArtView art={{ image: '/plants/x.png' }} />);
    expect(container.querySelector('image')).toHaveAttribute('href', '/plants/x.png');
  });

  it('ArtView vẽ component SVG', () => {
    inSvg(<ArtView art={{ svg: () => <circle data-testid="dot" r={1} /> }} />);
    expect(screen.getByTestId('dot')).toBeInTheDocument();
  });

  it('hạt ngủ ôm gối và cây héo', () => {
    inSvg(<><SleepingSeed /><WiltedPlant /></>);
    expect(screen.getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(screen.getByTestId('wilted-plant')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content/art.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/content/types.ts`:
```ts
import type { FC } from 'react';
import type { GrowthStage } from '../domain/growth';

/**
 * Hình vẽ trong hệ toạ độ viewBox 0 0 200 240, mặt đất ở y = 160, tâm x = 100.
 * - { svg }: component trả về các phần tử SVG (không bọc <svg>).
 * - { image }: đường dẫn PNG trong public/, vd `${import.meta.env.BASE_URL}plants/sunflower/bloom.png`.
 */
export type Art = { svg: FC } | { image: string };

export interface FaceAnchor {
  x: number;
  y: number;
  scale: number;
}

export interface PlantSpecies {
  id: string;
  name: string;
  defaultPotId: string;
  stages: Record<GrowthStage, Art>;
  faceAnchor: Record<GrowthStage, FaceAnchor>;
  greetings?: string[];
}

export interface PotStyle {
  id: string;
  name: string;
  art: Art;
}

export interface SpecialVariant {
  id: string;
  name: string;
  /** trọng số khi đã trúng 10% */
  weight: number;
  /** vẽ đè lên cây */
  Overlay: FC;
  /** vẽ phía sau chậu và cây */
  Underlay?: FC;
  /** CSS filter áp lên lớp cây */
  plantFilter?: string;
  /** class CSS áp lên lớp cây (cho hiệu ứng động) */
  plantClassName?: string;
}
```

`src/content/ArtView.tsx`:
```tsx
import type { Art } from './types';

export function ArtView({ art }: { art: Art }) {
  if ('image' in art) {
    return <image href={art.image} x={0} y={0} width={200} height={240} preserveAspectRatio="xMidYMid meet" />;
  }
  const Svg = art.svg;
  return <Svg />;
}
```

`src/content/Face.tsx`:
```tsx
import type { FaceAnchor } from './types';

export type Mood = 'normal' | 'smile' | 'talk' | 'sleep' | 'sad';
export const INK = '#5B4636';

export function Face({ mood, x, y, scale }: { mood: Mood } & FaceAnchor) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-testid="face" data-mood={mood}>
      <ellipse cx={-14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <ellipse cx={14} cy={6} rx={5} ry={3} fill="#FF9FB2" opacity={0.75} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
    </g>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'smile') {
    return (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-12 -1 q3 -5 6 0" />
        <path d="M6 -1 q3 -5 6 0" />
      </g>
    );
  }
  if (mood === 'sleep') {
    return (
      <g stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round">
        <path d="M-12 -2 q3 4 6 0" />
        <path d="M6 -2 q3 4 6 0" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={-9} cy={-2} r={3} fill={INK} />
      <circle cx={9} cy={-2} r={3} fill={INK} />
      <circle cx={-8} cy={-3} r={1} fill="#fff" />
      <circle cx={10} cy={-3} r={1} fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'smile':
      return <path d="M-5 5 q5 8 10 0 z" fill="#E86A7E" stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />;
    case 'talk':
      return <ellipse cx={0} cy={7} rx={3} ry={3.6} fill="#E86A7E" stroke={INK} strokeWidth={1.6} />;
    case 'sad':
      return <path d="M-4 9 q4 -4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
    case 'sleep':
      return <path d="M-2 7 q2 2 4 0" fill="none" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />;
    default:
      return <path d="M-4 5 q4 4 8 0" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />;
  }
}
```

`src/content/plants/parts.tsx`:
```tsx
import { INK } from '../Face';

export const SOIL_Y = 160;

export function Seed({ color, stripe }: { color: string; stripe?: string }) {
  return (
    <g data-part="seed">
      <ellipse cx={100} cy={148} rx={20} ry={15} fill={color} stroke={INK} strokeWidth={2} />
      {stripe && (
        <g stroke={stripe} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M92 137 q-3 11 0 22" />
          <path d="M108 137 q3 11 0 22" />
        </g>
      )}
      <ellipse cx={93} cy={142} rx={5} ry={3} fill="#fff" opacity={0.5} />
    </g>
  );
}

export function Sprout({ leaf, stem }: { leaf: string; stem: string }) {
  return (
    <g data-part="sprout">
      <path d="M100 160 Q98 148 100 136" stroke={stem} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M100 104 Q80 84 66 96 Q80 112 100 104 Z" fill={leaf} stroke={INK} strokeWidth={2} />
      <path d="M100 104 Q120 84 134 96 Q120 112 100 104 Z" fill={leaf} stroke={INK} strokeWidth={2} />
      <circle cx={100} cy={120} r={18} fill={leaf} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function LeafyStem({ top, leaf, stem }: { top: number; leaf: string; stem: string }) {
  const mid = (SOIL_Y + top) / 2;
  return (
    <g data-part="stem">
      <path d={`M100 ${SOIL_Y} Q96 ${mid} 100 ${top}`} stroke={stem} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M99 ${mid + 14} Q72 ${mid - 4} 60 ${mid + 10} Q78 ${mid + 28} 99 ${mid + 14} Z`} fill={leaf} stroke={INK} strokeWidth={2} />
      <path d={`M101 ${mid - 2} Q128 ${mid - 20} 140 ${mid - 6} Q122 ${mid + 12} 101 ${mid - 2} Z`} fill={leaf} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function Trunk() {
  return (
    <path d="M94 160 L96 112 Q100 102 104 112 L106 160 Z" fill="#B07D56" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
  );
}

const CANOPY_BLOBS: [number, number, number][] = [
  [72, 96, 26],
  [128, 96, 26],
  [100, 76, 32],
  [100, 106, 28],
];

/** Tán cây: vẽ viền dày trước rồi phủ nền lên để chỉ còn viền ngoài. */
export function Canopy({ fill }: { fill: string }) {
  return (
    <g data-part="canopy">
      {CANOPY_BLOBS.map(([x, y, r]) => (
        <circle key={`o${x}-${y}`} cx={x} cy={y} r={r} fill={fill} stroke={INK} strokeWidth={4} />
      ))}
      {CANOPY_BLOBS.map(([x, y, r]) => (
        <circle key={`i${x}-${y}`} cx={x} cy={y} r={r} fill={fill} />
      ))}
    </g>
  );
}

export function HeartLeaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 12 C-16 2 -14 -16 0 -9 C14 -16 16 2 0 12 Z" fill="#8FD08A" stroke={INK} strokeWidth={1.6} />
      <path d="M0 9 Q-2 0 -6 -6" stroke="#F2EFA0" strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
}
```

`src/content/common/SleepingSeed.tsx`:
```tsx
import { Face, INK } from '../Face';

export function SleepingSeed() {
  return (
    <g data-testid="sleeping-seed">
      <ellipse cx={100} cy={138} rx={22} ry={17} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <Face mood="sleep" x={100} y={135} scale={0.6} />
      <rect x={66} y={146} width={68} height={24} rx={12} fill="#E3D9FF" stroke={INK} strokeWidth={2} />
      <path d="M72 158 h56" stroke="#CFC2F5" strokeWidth={2} strokeDasharray="4 4" />
      <ellipse cx={80} cy={150} rx={7} ry={5} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <ellipse cx={120} cy={150} rx={7} ry={5} fill="#C99A6B" stroke={INK} strokeWidth={2} />
      <g className="zzz" fill="#8B7BC8" fontFamily="'Baloo 2', sans-serif" fontWeight={700}>
        <text x={128} y={118} fontSize={14}>z</text>
        <text x={140} y={102} fontSize={18}>z</text>
        <text x={154} y={84} fontSize={22}>Z</text>
      </g>
    </g>
  );
}
```

`src/content/common/WiltedPlant.tsx`:
```tsx
import { Face, INK } from '../Face';

export function WiltedPlant() {
  return (
    <g data-testid="wilted-plant">
      <path d="M100 160 Q100 118 122 110" stroke="#A89660" strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M100 142 Q78 136 72 156 Q90 156 100 142 Z" fill="#C9C08A" stroke={INK} strokeWidth={2} />
      <circle cx={124} cy={122} r={15} fill="#D8CF96" stroke={INK} strokeWidth={2} />
      <Face mood="sad" x={124} y={124} scale={0.5} />
    </g>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/content/art.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/content tests/unit/content/art.test.tsx
git commit -m "feat: add art system foundation with shared chibi face and common figures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Pots and special-variant registries

**Files:**
- Create: `src/content/pots/BasicPot.tsx`, `src/content/pots/pots.tsx`, `src/content/pots/registry.ts`, `src/content/specials/specials.tsx`, `src/content/specials/specials.css`, `src/content/specials/registry.ts`
- Test: `tests/unit/content/registries.test.tsx`

**Interfaces:**
- Consumes: `PotStyle`, `SpecialVariant` (Task 7), `INK` (Task 7).
- Produces: `POTS: PotStyle[]` (ids: `terracotta`, `polka`, `mint`, `rattan`, `wood`, `pink-cup`), `DEFAULT_POT_ID = 'terracotta'`, `getPot(id: string): PotStyle` (unknown → terracotta); `SPECIALS: SpecialVariant[]` (ids: `glow`, `sparkle`, `rainbow`, `gold`, `crystal`), `getSpecial(id: string | null): SpecialVariant | null` (unknown → null).

- [ ] **Step 1: Write the failing test**

`tests/unit/content/registries.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { DEFAULT_POT_ID, POTS, getPot } from '../../../src/content/pots/registry';
import { SPECIALS, getSpecial } from '../../../src/content/specials/registry';

describe('pots', () => {
  it('id duy nhất và vẽ được tất cả', () => {
    expect(new Set(POTS.map((p) => p.id)).size).toBe(POTS.length);
    for (const pot of POTS) {
      const { container, unmount } = render(<svg><ArtView art={pot.art} /></svg>);
      expect(container.querySelector('[data-part="pot"]')).not.toBeNull();
      unmount();
    }
  });

  it('getPot với id lạ trả về chậu mặc định', () => {
    expect(getPot('khong-co').id).toBe(DEFAULT_POT_ID);
  });
});

describe('specials', () => {
  it('có 5 hiệu ứng, trọng số dương, id duy nhất', () => {
    expect(SPECIALS.map((s) => s.id)).toEqual(['glow', 'sparkle', 'rainbow', 'gold', 'crystal']);
    expect(SPECIALS.every((s) => s.weight > 0)).toBe(true);
  });

  it('vẽ được overlay/underlay', () => {
    for (const s of SPECIALS) {
      const { unmount } = render(<svg>{s.Underlay && <s.Underlay />}<s.Overlay /></svg>);
      unmount();
    }
  });

  it('getSpecial: null và id lạ trả về null', () => {
    expect(getSpecial(null)).toBeNull();
    expect(getSpecial('khong-co')).toBeNull();
    expect(getSpecial('glow')?.name).toBe('Phát sáng');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content/registries.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement pots**

`src/content/pots/BasicPot.tsx`:
```tsx
import type { ReactNode } from 'react';
import { INK } from '../Face';

/** Chậu hình thang chuẩn: thân y 168–232, vành y 152–170, mặt đất y 160. */
export function BasicPot({ body, rim, soil = '#8B5E3C', children }: { body: string; rim: string; soil?: string; children?: ReactNode }) {
  return (
    <g data-part="pot">
      <path d="M46 166 L60 230 Q100 238 140 230 L154 166 Z" fill={body} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {children}
      <rect x={36} y={152} width={128} height={18} rx={9} fill={rim} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={56} ry={4} fill={soil} />
    </g>
  );
}
```

`src/content/pots/pots.tsx`:
```tsx
import { INK } from '../Face';
import { BasicPot } from './BasicPot';

export function TerracottaPot() {
  return (
    <BasicPot body="#F2A88A" rim="#E38E6E">
      <path d="M52 194 L148 194" stroke="#E38E6E" strokeWidth={5} strokeLinecap="round" />
    </BasicPot>
  );
}

export function PolkaPot() {
  const dots: [number, number][] = [[70, 186], [100, 200], [130, 186], [80, 216], [120, 216]];
  return (
    <BasicPot body="#FFFDF8" rim="#FFE3EA">
      {dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={6} fill="#FFB8C8" />)}
    </BasicPot>
  );
}

export function MintPot() {
  return (
    <BasicPot body="#BDE8D6" rim="#A6DCC6">
      <path d="M54 200 q12 -10 24 0 t24 0 t24 0 t22 0" stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
    </BasicPot>
  );
}

export function RattanPot() {
  return (
    <BasicPot body="#EBCB9B" rim="#DDB57E">
      <g stroke="#C99E66" strokeWidth={2.5}>
        {[182, 196, 210, 224].map((y) => <path key={y} d={`M52 ${y} L148 ${y}`} />)}
        {[64, 80, 96, 112, 128, 144].map((x) => <path key={x} d={`M${x} 172 L${x - 4} 228`} />)}
      </g>
    </BasicPot>
  );
}

export function WoodPot() {
  return (
    <g data-part="pot">
      <rect x={44} y={164} width={112} height={66} rx={8} fill="#DDB48A" stroke={INK} strokeWidth={2.5} />
      <g stroke="#C29467" strokeWidth={2.5}>
        <path d="M44 186 L156 186" />
        <path d="M44 208 L156 208" />
      </g>
      <rect x={38} y={152} width={124} height={16} rx={6} fill="#CFA172" stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={56} ry={4} fill="#8B5E3C" />
    </g>
  );
}

export function PinkCupPot() {
  return (
    <g data-part="pot">
      <path d="M152 178 q26 4 22 24 q-4 18 -26 14" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M152 178 q26 4 22 24 q-4 18 -26 14" fill="none" stroke="#FFB3C4" strokeWidth={5} strokeLinecap="round" />
      <BasicPot body="#FFC9D6" rim="#FFB3C4">
        <path d="M100 210 C88 198 92 188 100 196 C108 188 112 198 100 210 Z" fill="#FF8FA8" />
      </BasicPot>
    </g>
  );
}
```

`src/content/pots/registry.ts`:
```ts
import type { PotStyle } from '../types';
import { MintPot, PinkCupPot, PolkaPot, RattanPot, TerracottaPot, WoodPot } from './pots';

/** Thêm chậu mới: tạo component trong pots.tsx (hoặc dùng { image }) rồi thêm 1 dòng ở đây. */
export const POTS: PotStyle[] = [
  { id: 'terracotta', name: 'Đất nung', art: { svg: TerracottaPot } },
  { id: 'polka', name: 'Sứ chấm bi', art: { svg: PolkaPot } },
  { id: 'mint', name: 'Gốm mint', art: { svg: MintPot } },
  { id: 'rattan', name: 'Giỏ mây', art: { svg: RattanPot } },
  { id: 'wood', name: 'Hộp gỗ', art: { svg: WoodPot } },
  { id: 'pink-cup', name: 'Cốc hồng', art: { svg: PinkCupPot } },
];

export const DEFAULT_POT_ID = 'terracotta';

export function getPot(id: string): PotStyle {
  return POTS.find((p) => p.id === id) ?? POTS.find((p) => p.id === DEFAULT_POT_ID)!;
}
```

- [ ] **Step 4: Implement specials**

`src/content/specials/specials.css`:
```css
@keyframes special-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.06); }
}
@keyframes special-twinkle {
  0%, 100% { opacity: 0.2; transform: scale(0.6); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes special-hue {
  from { filter: hue-rotate(0deg) saturate(1.3); }
  to { filter: hue-rotate(360deg) saturate(1.3); }
}
.special-halo { transform-box: view-box; transform-origin: 100px 110px; animation: special-pulse 2.4s ease-in-out infinite; }
.special-star { transform-box: fill-box; transform-origin: center; animation: special-twinkle 1.8s ease-in-out infinite; }
.special-rainbow-plant { animation: special-hue 6s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .special-halo, .special-star, .special-rainbow-plant { animation: none; }
}
```

`src/content/specials/specials.tsx`:
```tsx
import { useId } from 'react';
import './specials.css';

function Star({ x, y, s = 1, color, delay = 0 }: { x: number; y: number; s?: number; color: string; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="special-star" style={{ animationDelay: `${delay}s` }} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill={color} />
    </g>
  );
}

const STAR_SPOTS: [number, number, number][] = [[40, 60, 1], [160, 50, 1.2], [30, 130, 0.8], [170, 120, 0.9], [70, 30, 0.7], [140, 150, 0.7]];

export function GlowHalo() {
  const id = useId();
  return (
    <g data-testid="special-glow">
      <defs>
        <radialGradient id={id}>
          <stop offset="0%" stopColor="#FFF6B0" stopOpacity={0.95} />
          <stop offset="100%" stopColor="#FFF6B0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle className="special-halo" cx={100} cy={110} r={90} fill={`url(#${id})`} />
    </g>
  );
}

export function GlowOverlay() {
  return <g>{STAR_SPOTS.slice(0, 3).map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s} color="#FFE066" delay={i * 0.4} />)}</g>;
}

export function SparkleOverlay() {
  return (
    <g data-testid="special-sparkle">
      {STAR_SPOTS.map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s} color={i % 2 ? '#FFC4D6' : '#C9E8FF'} delay={i * 0.3} />)}
    </g>
  );
}

export function RainbowOverlay() {
  const colors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#D7BAFF'];
  return (
    <g data-testid="special-rainbow" fill="none" strokeLinecap="round" opacity={0.85}>
      {colors.map((c, i) => <path key={c} d={`M${20 + i * 4} 70 A ${40 - i * 4} ${40 - i * 4} 0 0 1 ${100 - i * 4} 70`} stroke={c} strokeWidth={4} />)}
    </g>
  );
}

export function GoldOverlay() {
  return (
    <g data-testid="special-gold">
      {STAR_SPOTS.map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s * 0.9} color="#F5C542" delay={i * 0.25} />)}
    </g>
  );
}

export function CrystalOverlay() {
  return (
    <g data-testid="special-crystal" fill="#FFFFFF" opacity={0.85}>
      {STAR_SPOTS.slice(0, 4).map(([x, y], i) => (
        <path key={i} className="special-star" style={{ animationDelay: `${i * 0.5}s` }} d={`M${x} ${y - 7} L${x + 5} ${y} L${x} ${y + 7} L${x - 5} ${y} Z`} />
      ))}
    </g>
  );
}
```

`src/content/specials/registry.ts`:
```ts
import type { SpecialVariant } from '../types';
import { CrystalOverlay, GlowHalo, GlowOverlay, GoldOverlay, RainbowOverlay, SparkleOverlay } from './specials';

/** Thêm hiệu ứng mới: viết overlay trong specials.tsx rồi thêm 1 dòng ở đây. */
export const SPECIALS: SpecialVariant[] = [
  { id: 'glow', name: 'Phát sáng', weight: 3, Underlay: GlowHalo, Overlay: GlowOverlay, plantFilter: 'drop-shadow(0 0 6px #FFF3A0)' },
  { id: 'sparkle', name: 'Lấp lánh', weight: 3, Overlay: SparkleOverlay },
  { id: 'rainbow', name: 'Cầu vồng', weight: 2, Overlay: RainbowOverlay, plantClassName: 'special-rainbow-plant' },
  { id: 'gold', name: 'Vàng ròng', weight: 1, Overlay: GoldOverlay, plantFilter: 'sepia(0.9) saturate(2.6) hue-rotate(-12deg) brightness(1.08)' },
  { id: 'crystal', name: 'Pha lê', weight: 1, Overlay: CrystalOverlay, plantFilter: 'saturate(0.6) hue-rotate(180deg) brightness(1.15) opacity(0.9)' },
];

export function getSpecial(id: string | null): SpecialVariant | null {
  if (id === null) return null;
  return SPECIALS.find((s) => s.id === id) ?? null;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/content/registries.test.tsx`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/content/pots src/content/specials tests/unit/content/registries.test.tsx
git commit -m "feat: add pot and special-variant registries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Six plant species, plant registry, catalog, greetings

**Files:**
- Create: `src/content/plants/sunflower.tsx`, `corn.tsx`, `cactus.tsx`, `pothos.tsx`, `orange.tsx`, `cherry.tsx`, `src/content/plants/registry.ts`, `src/content/catalog.ts`, `src/content/greetings.ts`
- Test: `tests/unit/content/plants.test.tsx`

**Interfaces:**
- Consumes: parts from Task 7, `PlantSpecies` (Task 7), `POTS` (Task 8), `SPECIALS` (Task 8), `Catalog` (Task 3), `pickUniform`, `Rng` (Task 2), `GROWTH_STAGES` (Task 2).
- Produces: `PLANTS: PlantSpecies[]` (ids in order: `sunflower`, `corn`, `cactus`, `pothos`, `orange`, `cherry`), `getSpecies(id: string): PlantSpecies` (unknown → first), `CATALOG: Catalog`, `COMMON_GREETINGS: string[]`, `pickGreeting(species: PlantSpecies, rng: Rng): string`.

- [ ] **Step 1: Write the failing test**

`tests/unit/content/plants.test.tsx`:
```tsx
import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { CATALOG } from '../../../src/content/catalog';
import { COMMON_GREETINGS, pickGreeting } from '../../../src/content/greetings';
import { PLANTS, getSpecies } from '../../../src/content/plants/registry';
import { POTS } from '../../../src/content/pots/registry';
import { SPECIALS } from '../../../src/content/specials/registry';
import { GROWTH_STAGES } from '../../../src/domain/growth';
import { mulberry32 } from '../../../src/domain/random';

describe('plants', () => {
  it('có 6 loài ban đầu theo thứ tự', () => {
    expect(PLANTS.map((p) => p.id)).toEqual(['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry']);
    expect(PLANTS.map((p) => p.name)).toEqual(['Hướng dương', 'Ngô', 'Xương rồng', 'Trầu bà', 'Cây cam', 'Cherry']);
  });

  it('mỗi loài có đủ 4 giai đoạn, toạ độ mặt và chậu mặc định hợp lệ', () => {
    const potIds = new Set(POTS.map((p) => p.id));
    for (const p of PLANTS) {
      expect(potIds.has(p.defaultPotId)).toBe(true);
      for (const stage of GROWTH_STAGES) {
        expect(p.stages[stage]).toBeDefined();
        expect(p.faceAnchor[stage].scale).toBeGreaterThan(0);
        const { unmount } = render(<svg><ArtView art={p.stages[stage]} /></svg>);
        unmount();
      }
    }
  });

  it('mỗi loài có chậu mặc định khác nhau', () => {
    expect(new Set(PLANTS.map((p) => p.defaultPotId)).size).toBe(PLANTS.length);
  });

  it('getSpecies với id lạ trả về loài đầu tiên', () => {
    expect(getSpecies('khong-co').id).toBe('sunflower');
  });

  it('CATALOG khớp với registry', () => {
    expect(CATALOG.plants).toEqual(PLANTS.map((p) => ({ id: p.id, defaultPotId: p.defaultPotId })));
    expect(CATALOG.potIds).toEqual(POTS.map((p) => p.id));
    expect(CATALOG.specials).toEqual(SPECIALS.map((s) => ({ id: s.id, weight: s.weight })));
  });

  it('pickGreeting lấy từ câu chung + câu riêng của loài', () => {
    const sunflower = getSpecies('sunflower');
    const pool = new Set([...COMMON_GREETINGS, ...(sunflower.greetings ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickGreeting(sunflower, rng))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/content/plants.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the six species**

`src/content/plants/sunflower.tsx`:
```tsx
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#9AD98F';
const STEM = '#7BBF6A';

function SunflowerSeed() {
  return <Seed color="#7A6655" stripe="#F3EDE4" />;
}
function SunflowerSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function SunflowerBud() {
  return (
    <g>
      <LeafyStem top={92} leaf={LEAF} stem={STEM} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M100 60 q6 8 0 12 q-6 -4 0 -12 z" fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 84)`} />
      ))}
      <circle cx={100} cy={84} r={20} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function SunflowerBloom() {
  return (
    <g>
      <LeafyStem top={100} leaf={LEAF} stem={STEM} />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <ellipse key={a} cx={100} cy={46} rx={9} ry={17} fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 78)`} />
      ))}
      <circle cx={100} cy={78} r={24} fill="#B5835A" stroke={INK} strokeWidth={2} />
    </g>
  );
}

export const sunflower: PlantSpecies = {
  id: 'sunflower',
  name: 'Hướng dương',
  defaultPotId: 'terracotta',
  stages: {
    seed: { svg: SunflowerSeed },
    sprout: { svg: SunflowerSprout },
    bud: { svg: SunflowerBud },
    bloom: { svg: SunflowerBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 86, scale: 0.55 },
    bloom: { x: 100, y: 80, scale: 0.8 },
  },
  greetings: ['Hôm nay mình hướng về phía bạn nè! 🌻', 'Nắng lên rồi, mình cùng tỏa sáng nha ☀️'],
};
```

`src/content/plants/corn.tsx`:
```tsx
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#A8DD8C';
const STEM = '#86C46E';

function Blades() {
  return (
    <g fill={LEAF} stroke={INK} strokeWidth={2}>
      <path d="M100 150 Q60 120 40 136 Q70 132 100 156 Z" />
      <path d="M100 140 Q140 106 162 120 Q132 120 100 146 Z" />
    </g>
  );
}

function Kernels() {
  const dots: [number, number][] = [];
  for (let y = 74; y <= 122; y += 8) {
    for (const x of [-8, 0, 8]) {
      if ((x / 15) ** 2 + ((y - 98) / 29) ** 2 < 1) dots.push([100 + x, y]);
    }
  }
  return <g fill="#F7C948">{dots.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={2.6} />)}</g>;
}

function CornSeed() {
  return <Seed color="#FFD45C" />;
}
function CornSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function CornBud() {
  return (
    <g>
      <LeafyStem top={76} leaf={LEAF} stem={STEM} />
      <Blades />
      <ellipse cx={100} cy={98} rx={13} ry={22} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
      <path d="M100 76 L94 62 M100 76 L100 60 M100 76 L106 62" stroke="#D9B26A" strokeWidth={2} strokeLinecap="round" />
    </g>
  );
}
function CornBloom() {
  return (
    <g>
      <LeafyStem top={70} leaf={LEAF} stem={STEM} />
      <Blades />
      <ellipse cx={100} cy={98} rx={18} ry={32} fill="#FFE08A" stroke={INK} strokeWidth={2} />
      <Kernels />
      <path d="M82 112 Q76 82 92 70 Q88 96 96 128 Z" fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d="M118 112 Q124 82 108 70 Q112 96 104 128 Z" fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d="M100 66 L90 48 M100 66 L100 44 M100 66 L110 48" stroke="#D9B26A" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}

export const corn: PlantSpecies = {
  id: 'corn',
  name: 'Ngô',
  defaultPotId: 'rattan',
  stages: {
    seed: { svg: CornSeed },
    sprout: { svg: CornSprout },
    bud: { svg: CornBud },
    bloom: { svg: CornBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 100, scale: 0.45 },
    bloom: { x: 100, y: 100, scale: 0.6 },
  },
  greetings: ['Bắp nè, bắp nè! Hôm nay mình làm gì đây? 🌽', 'Mỗi việc xong là một hạt ngô vàng ươm đó!'],
};
```

`src/content/plants/cactus.tsx`:
```tsx
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Seed } from './parts';

const BODY = '#9ED9A0';
const SPINE = '#5B8F5E';

function Spines({ points }: { points: [number, number][] }) {
  return (
    <g stroke={SPINE} strokeWidth={1.6} strokeLinecap="round">
      {points.map(([x, y]) => <path key={`${x}-${y}`} d={`M${x - 3} ${y} l6 0 M${x} ${y - 3} l0 6`} />)}
    </g>
  );
}

function Column() {
  return (
    <g>
      <path d="M78 130 Q58 128 60 104 Q62 94 70 96 Q72 112 80 116 Z" fill={BODY} stroke={INK} strokeWidth={2} />
      <path d="M122 120 Q142 118 140 94 Q138 84 130 86 Q128 102 120 106 Z" fill={BODY} stroke={INK} strokeWidth={2} />
      <rect x={76} y={78} width={48} height={86} rx={24} fill={BODY} stroke={INK} strokeWidth={2} />
      <Spines points={[[84, 96], [116, 100], [86, 140], [114, 146], [100, 156]]} />
    </g>
  );
}

function CactusSeed() {
  return <Seed color="#4F4038" />;
}
function CactusSprout() {
  return (
    <g>
      <circle cx={100} cy={140} r={20} fill={BODY} stroke={INK} strokeWidth={2} />
      <Spines points={[[86, 132], [114, 132], [100, 124]]} />
    </g>
  );
}
function CactusBud() {
  return (
    <g>
      <Column />
      <circle cx={100} cy={76} r={7} fill="#FFB8CF" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function CactusBloom() {
  return (
    <g>
      <Column />
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx={100} cy={62} rx={7} ry={11} fill="#FF9FC0" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 72)`} />
      ))}
      <circle cx={100} cy={72} r={6} fill="#FFE066" stroke={INK} strokeWidth={1.5} />
    </g>
  );
}

export const cactus: PlantSpecies = {
  id: 'cactus',
  name: 'Xương rồng',
  defaultPotId: 'pink-cup',
  stages: {
    seed: { svg: CactusSeed },
    sprout: { svg: CactusSprout },
    bud: { svg: CactusBud },
    bloom: { svg: CactusBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 143, scale: 0.55 },
    bud: { x: 100, y: 118, scale: 0.75 },
    bloom: { x: 100, y: 118, scale: 0.75 },
  },
  greetings: ['Mình ít uống nước thôi, nhưng thích bạn làm việc lắm 🌵', 'Gai góc bên ngoài, mềm mại bên trong nha!'],
};
```

`src/content/plants/pothos.tsx`:
```tsx
import type { PlantSpecies } from '../types';
import { HeartLeaf, Seed, Sprout } from './parts';

const STEM = '#7BBF6A';

function PothosSeed() {
  return <Seed color="#8A6A4F" />;
}
function PothosSprout() {
  return <Sprout leaf="#8FD08A" stem={STEM} />;
}
function PothosBud() {
  return (
    <g>
      <path d="M100 160 Q90 124 100 100" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <HeartLeaf x={78} y={130} s={1.3} r={-30} />
      <HeartLeaf x={122} y={120} s={1.3} r={30} />
      <HeartLeaf x={100} y={92} s={1.8} />
    </g>
  );
}
function PothosBloom() {
  return (
    <g>
      <path d="M100 160 Q88 120 100 92" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M70 158 Q48 176 46 214" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d="M130 158 Q152 176 154 214" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <HeartLeaf x={46} y={214} s={0.9} r={10} />
      <HeartLeaf x={154} y={214} s={0.9} r={-10} />
      <HeartLeaf x={66} y={138} s={1.4} r={-40} />
      <HeartLeaf x={134} y={134} s={1.4} r={40} />
      <HeartLeaf x={76} y={108} s={1.5} r={-20} />
      <HeartLeaf x={124} y={104} s={1.5} r={20} />
      <HeartLeaf x={100} y={84} s={2.2} />
    </g>
  );
}

export const pothos: PlantSpecies = {
  id: 'pothos',
  name: 'Trầu bà',
  defaultPotId: 'mint',
  stages: {
    seed: { svg: PothosSeed },
    sprout: { svg: PothosSprout },
    bud: { svg: PothosBud },
    bloom: { svg: PothosBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 90, scale: 0.5 },
    bloom: { x: 100, y: 82, scale: 0.6 },
  },
  greetings: ['Lá hình trái tim tặng bạn nè 💚', 'Mình lớn chậm mà chắc, giống bạn đó!'],
};
```

`src/content/plants/orange.tsx`:
```tsx
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Canopy, Seed, Sprout, Trunk } from './parts';

const GREEN = '#93D18A';

function Blossom({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={0} cy={-4} r={3} fill="#FFFFFF" transform={`rotate(${a})`} />)}
      <circle r={2} fill="#FFE066" />
    </g>
  );
}

function Orange({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={9} fill="#FFB25B" stroke={INK} strokeWidth={1.8} />
      <path d={`M${x} ${y - 9} q4 -5 9 -3 q-4 5 -9 3`} fill={GREEN} stroke={INK} strokeWidth={1.2} />
    </g>
  );
}

function OrangeSeed() {
  return <Seed color="#E9D7A8" />;
}
function OrangeSprout() {
  return <Sprout leaf={GREEN} stem="#7BBF6A" />;
}
function OrangeBud() {
  return (
    <g>
      <Trunk />
      <Canopy fill={GREEN} />
      {[[70, 84], [130, 88], [92, 64], [120, 112]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={3.5} fill="#FFFFFF" stroke={INK} strokeWidth={1} />)}
    </g>
  );
}
function OrangeBloom() {
  return (
    <g>
      <Trunk />
      <Canopy fill={GREEN} />
      {[[70, 80], [134, 84], [112, 62], [82, 116]].map(([x, y]) => <Blossom key={`${x}-${y}`} x={x} y={y} />)}
      <Orange x={64} y={104} />
      <Orange x={136} y={108} />
      <Orange x={118} y={124} />
    </g>
  );
}

export const orange: PlantSpecies = {
  id: 'orange',
  name: 'Cây cam',
  defaultPotId: 'wood',
  stages: {
    seed: { svg: OrangeSeed },
    sprout: { svg: OrangeSprout },
    bud: { svg: OrangeBud },
    bloom: { svg: OrangeBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 94, scale: 0.75 },
    bloom: { x: 100, y: 94, scale: 0.75 },
  },
  greetings: ['Vitamin C cho ngày mới nè! 🍊', 'Làm xong việc là có cam ngọt ăn đó!'],
};
```

`src/content/plants/cherry.tsx`:
```tsx
import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { Canopy, Seed, Sprout, Trunk } from './parts';

function CherryPair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y - 14} Q${x - 6} ${y - 6} ${x - 6} ${y} M${x} ${y - 14} Q${x + 6} ${y - 6} ${x + 6} ${y}`} stroke="#7BBF6A" strokeWidth={1.8} fill="none" />
      <circle cx={x - 6} cy={y + 3} r={6} fill="#FF6F91" stroke={INK} strokeWidth={1.6} />
      <circle cx={x + 6} cy={y + 3} r={6} fill="#FF6F91" stroke={INK} strokeWidth={1.6} />
      <circle cx={x - 8} cy={y + 1} r={1.6} fill="#fff" />
      <circle cx={x + 4} cy={y + 1} r={1.6} fill="#fff" />
    </g>
  );
}

function CherrySeed() {
  return <Seed color="#D9B08C" />;
}
function CherrySprout() {
  return <Sprout leaf="#A3D99A" stem="#7BBF6A" />;
}
function CherryBud() {
  return (
    <g>
      <Trunk />
      <Canopy fill="#A3D99A" />
      {[[68, 86], [132, 90], [96, 62], [118, 116], [80, 112]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4} fill="#FFC4D6" stroke={INK} strokeWidth={1} />)}
    </g>
  );
}
function CherryBloom() {
  return (
    <g>
      <Trunk />
      <Canopy fill="#FFC4D6" />
      {[[70, 78], [130, 80], [104, 60], [84, 104]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3} fill="#FFFFFF" />
      ))}
      <CherryPair x={66} y={110} />
      <CherryPair x={136} y={112} />
    </g>
  );
}

export const cherry: PlantSpecies = {
  id: 'cherry',
  name: 'Cherry',
  defaultPotId: 'polka',
  stages: {
    seed: { svg: CherrySeed },
    sprout: { svg: CherrySprout },
    bud: { svg: CherryBud },
    bloom: { svg: CherryBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 94, scale: 0.75 },
    bloom: { x: 100, y: 94, scale: 0.75 },
  },
  greetings: ['Hôm nay mình hồng hào lắm nè 🍒', 'Một quả cherry cho mỗi việc hoàn thành!'],
};
```

`src/content/plants/registry.ts`:
```ts
import type { PlantSpecies } from '../types';
import { cactus } from './cactus';
import { cherry } from './cherry';
import { corn } from './corn';
import { orange } from './orange';
import { pothos } from './pothos';
import { sunflower } from './sunflower';

/** Thêm loài mới: tạo file <id>.tsx export một PlantSpecies rồi thêm vào mảng này. */
export const PLANTS: PlantSpecies[] = [sunflower, corn, cactus, pothos, orange, cherry];

export function getSpecies(id: string): PlantSpecies {
  return PLANTS.find((p) => p.id === id) ?? PLANTS[0];
}
```

`src/content/catalog.ts`:
```ts
import type { Catalog } from '../domain/types';
import { PLANTS } from './plants/registry';
import { POTS } from './pots/registry';
import { SPECIALS } from './specials/registry';

export const CATALOG: Catalog = {
  plants: PLANTS.map((p) => ({ id: p.id, defaultPotId: p.defaultPotId })),
  potIds: POTS.map((p) => p.id),
  specials: SPECIALS.map((s) => ({ id: s.id, weight: s.weight })),
};
```

`src/content/greetings.ts`:
```ts
import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';

export const COMMON_GREETINGS = [
  'Xin chào! Hôm nay mình cùng lớn nhé 🌱',
  'Ơ bạn tới rồi! Mình chờ nãy giờ á 💕',
  'Làm xong việc là tưới cho mình đó nha 💧',
  'Hôm nay bạn trông tuyệt lắm đó ✨',
  'Từng việc nhỏ thôi, mình tin bạn! 🍀',
  'Mình vừa mơ thấy bạn làm xong hết việc đó 😆',
  'Uống nước chưa? Mình uống rồi nè 💦',
  'Cùng nhau nở hoa hôm nay nha 🌸',
  'Bạn là người làm vườn số một của mình! 🏆',
  'Chậm mà chắc, mình không vội đâu 🐢',
];

export function pickGreeting(species: PlantSpecies, rng: Rng): string {
  return pickUniform([...COMMON_GREETINGS, ...(species.greetings ?? [])], rng);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/content`
Expected: all pass.

- [ ] **Step 5: Visual check of every stage**

Create a throwaway preview page to eyeball all art. Create `src/dev/ArtGallery.tsx`:
```tsx
import { ArtView } from '../content/ArtView';
import { Face } from '../content/Face';
import { PLANTS } from '../content/plants/registry';
import { POTS, getPot } from '../content/pots/registry';
import { GROWTH_STAGES } from '../domain/growth';

export function ArtGallery() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: 8 }}>
      {PLANTS.flatMap((p) =>
        GROWTH_STAGES.map((s) => (
          <svg key={`${p.id}-${s}`} viewBox="0 0 200 240" style={{ background: '#fff', borderRadius: 12 }}>
            <ArtView art={getPot(p.defaultPotId).art} />
            <ArtView art={p.stages[s]} />
            <Face mood="smile" {...p.faceAnchor[s]} />
          </svg>
        )),
      )}
      {POTS.map((pot) => (
        <svg key={pot.id} viewBox="0 0 200 240" style={{ background: '#fff', borderRadius: 12 }}>
          <ArtView art={pot.art} />
        </svg>
      ))}
    </div>
  );
}
```
Temporarily render it from `src/main.tsx` (`import { ArtGallery } from './dev/ArtGallery'` and render `<ArtGallery />` instead of `<App />`), run `npm run dev`, then open the page in the browser at 390px width (iPhone 13). Check that every face sits on its plant, nothing pokes outside the 200×240 box, and stems start at the soil line. Adjust `faceAnchor` values or coordinates as needed. **Revert `src/main.tsx`** when you are done, but keep `src/dev/ArtGallery.tsx` because it is useful when adding new plants.

- [ ] **Step 6: Commit**

```bash
git add src/content src/dev tests/unit/content/plants.test.tsx
git commit -m "feat: add six chibi plant species, catalog and greetings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 10: PlantScene and time-of-day sky

**Before writing CSS:** invoke the `frontend-design` skill (see Global Constraints).

**Files:**
- Create: `src/components/PlantScene.tsx`, `src/components/SkyBackground.tsx`, `src/components/scene.css`
- Test: `tests/unit/components/PlantScene.test.tsx`

**Interfaces:**
- Consumes: `getSpecies` (Task 9), `getPot` (Task 8), `getSpecial` (Task 8), `ArtView`, `Face`, `Mood`, `SleepingSeed`, `WiltedPlant` (Task 7), `GrowthStage` (Task 2), `TimeOfDay` (Task 2).
- Produces:
  - `type SceneMode = 'plant' | 'sleeping' | 'wilted'`
  - `PlantScene(props: { plantId: string; potId: string; stage: GrowthStage; specialId: string | null; mood: Mood; mode?: SceneMode; bounceKey?: number; className?: string; title?: string; testId?: string; children?: ReactNode })`. It renders `<svg data-testid={testId ?? 'plant-scene'} data-plant data-pot data-stage data-mode data-special>`; `data-plant`/`data-pot` hold the **resolved** (fallback) ids.
  - `SkyBackground({ time: TimeOfDay; children })` → `<div data-testid="sky" data-time={time}>`

- [ ] **Step 1: Write the failing test**

`tests/unit/components/PlantScene.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import { PlantScene } from '../../../src/components/PlantScene';
import { SkyBackground } from '../../../src/components/SkyBackground';

describe('PlantScene', () => {
  it('ghi các thuộc tính dữ liệu và vẽ mặt theo mood', () => {
    render(<PlantScene plantId="corn" potId="rattan" stage="bud" specialId={null} mood="smile" />);
    const scene = screen.getByTestId('plant-scene');
    expect(scene).toHaveAttribute('data-plant', 'corn');
    expect(scene).toHaveAttribute('data-pot', 'rattan');
    expect(scene).toHaveAttribute('data-stage', 'bud');
    expect(scene).toHaveAttribute('data-mode', 'plant');
    expect(screen.getByTestId('face')).toHaveAttribute('data-mood', 'smile');
  });

  it('id lạ thì dùng cây/chậu mặc định, không bị lỗi', () => {
    render(<PlantScene plantId="banana" potId="golden" stage="bloom" specialId="unknown" mood="normal" />);
    const scene = screen.getByTestId('plant-scene');
    expect(scene).toHaveAttribute('data-plant', 'sunflower');
    expect(scene).toHaveAttribute('data-pot', 'terracotta');
    expect(scene).toHaveAttribute('data-special', '');
  });

  it('hiệu ứng đặc biệt được vẽ', () => {
    render(<PlantScene plantId="cherry" potId="polka" stage="bloom" specialId="glow" mood="normal" />);
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-special', 'glow');
    expect(screen.getByTestId('special-glow')).toBeInTheDocument();
  });

  it('chế độ ngủ và héo', () => {
    const { rerender } = render(<PlantScene plantId="corn" potId="rattan" stage="bloom" specialId="glow" mood="sleep" mode="sleeping" />);
    expect(screen.getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-special', '');
    rerender(<PlantScene plantId="" potId="terracotta" stage="seed" specialId={null} mood="sad" mode="wilted" />);
    expect(screen.getByTestId('wilted-plant')).toBeInTheDocument();
  });

  it('SkyBackground theo buổi', () => {
    render(<SkyBackground time="evening"><span>x</span></SkyBackground>);
    expect(screen.getByTestId('sky')).toHaveAttribute('data-time', 'evening');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/components/PlantScene.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`src/components/PlantScene.tsx`:
```tsx
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArtView } from '../content/ArtView';
import { Face, type Mood } from '../content/Face';
import { SleepingSeed } from '../content/common/SleepingSeed';
import { WiltedPlant } from '../content/common/WiltedPlant';
import { getSpecies } from '../content/plants/registry';
import { getPot } from '../content/pots/registry';
import { getSpecial } from '../content/specials/registry';
import type { GrowthStage } from '../domain/growth';
import './scene.css';

export type SceneMode = 'plant' | 'sleeping' | 'wilted';

export interface PlantSceneProps {
  plantId: string;
  potId: string;
  stage: GrowthStage;
  specialId: string | null;
  mood: Mood;
  mode?: SceneMode;
  /** đổi số này để cây nhún nhảy một lần */
  bounceKey?: number;
  className?: string;
  title?: string;
  testId?: string;
  children?: ReactNode;
}

export function PlantScene({
  plantId, potId, stage, specialId, mood, mode = 'plant', bounceKey = 0, className, title, testId, children,
}: PlantSceneProps) {
  const species = getSpecies(plantId);
  const pot = getPot(potId);
  const special = mode === 'plant' ? getSpecial(specialId) : null;
  const Underlay = special?.Underlay;
  const Overlay = special?.Overlay;
  return (
    <svg
      viewBox="0 0 200 240"
      className={`plant-scene ${className ?? ''}`}
      role="img"
      aria-label={title ?? species.name}
      data-testid={testId ?? 'plant-scene'}
      data-plant={species.id}
      data-pot={pot.id}
      data-stage={stage}
      data-mode={mode}
      data-special={special?.id ?? ''}
    >
      {Underlay && <Underlay />}
      <ArtView art={pot.art} />
      {mode === 'sleeping' && <SleepingSeed />}
      {mode === 'wilted' && <WiltedPlant />}
      {mode === 'plant' && (
        <motion.g
          key={bounceKey}
          className={special?.plantClassName}
          style={{ filter: special?.plantFilter, transformBox: 'view-box', transformOrigin: '100px 160px' }}
          initial={false}
          animate={bounceKey > 0 ? { scale: [1, 1.1, 0.95, 1.04, 1], y: [0, -8, 0, -3, 0] } : undefined}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          <ArtView art={species.stages[stage]} />
          <Face mood={mood} {...species.faceAnchor[stage]} />
        </motion.g>
      )}
      {Overlay && <Overlay />}
      {children}
    </svg>
  );
}
```

`src/components/SkyBackground.tsx`:
```tsx
import type { ReactNode } from 'react';
import type { TimeOfDay } from '../domain/timeOfDay';
import './scene.css';

const SKY_LABEL: Record<TimeOfDay, string> = {
  morning: 'Buổi sáng',
  noon: 'Buổi trưa',
  afternoon: 'Buổi chiều',
  evening: 'Buổi tối',
};

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#FFFFFF" opacity={0.9}>
      <circle cx={0} cy={0} r={12} />
      <circle cx={14} cy={-6} r={15} />
      <circle cx={30} cy={0} r={12} />
      <rect x={0} y={0} width={30} height={12} />
    </g>
  );
}

function SkyDecor({ time }: { time: TimeOfDay }) {
  return (
    <svg className="sky__decor" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {time === 'morning' && (
        <>
          <circle cx={60} cy={70} r={30} fill="#FFE58A" />
          <Cloud x={250} y={60} />
          <Cloud x={300} y={120} s={0.7} />
        </>
      )}
      {time === 'noon' && (
        <>
          <circle cx={195} cy={40} r={36} fill="#FFF3A0" />
          <Cloud x={40} y={90} s={0.9} />
          <Cloud x={290} y={70} />
        </>
      )}
      {time === 'afternoon' && (
        <>
          <circle cx={320} cy={150} r={40} fill="#FFB38A" opacity={0.9} />
          <Cloud x={50} y={60} s={0.8} />
        </>
      )}
      {time === 'evening' && (
        <>
          <circle cx={310} cy={60} r={26} fill="#FFF6D5" />
          <circle cx={322} cy={52} r={22} fill="#6E679F" />
          {[[40, 40], [90, 90], [150, 30], [220, 80], [60, 150], [260, 140], [350, 120]].map(([x, y]) => (
            <circle key={`${x}-${y}`} className="sky__star" cx={x} cy={y} r={2.2} fill="#FFFDE8" />
          ))}
        </>
      )}
    </svg>
  );
}

export function SkyBackground({ time, children }: { time: TimeOfDay; children?: ReactNode }) {
  return (
    <div className={`sky sky--${time}`} data-testid="sky" data-time={time} aria-label={SKY_LABEL[time]}>
      <SkyDecor time={time} />
      <div className="sky__content">{children}</div>
    </div>
  );
}
```

`src/components/scene.css`:
```css
.plant-scene { display: block; width: 100%; height: 100%; overflow: visible; }
.plant-scene .zzz text { animation: zzz-float 2.4s ease-in-out infinite; }
.plant-scene .zzz text:nth-child(2) { animation-delay: 0.4s; }
.plant-scene .zzz text:nth-child(3) { animation-delay: 0.8s; }
@keyframes zzz-float {
  0%, 100% { opacity: 0.3; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-6px); }
}
.sky { position: relative; overflow: hidden; border-radius: 0 0 var(--radius-lg) var(--radius-lg); transition: background 1s ease; }
.sky--morning { background: linear-gradient(180deg, #D4ECFF 0%, #FFF1C1 100%); }
.sky--noon { background: linear-gradient(180deg, #A8DBFF 0%, #E0F4FF 100%); }
.sky--afternoon { background: linear-gradient(180deg, #FFD6C2 0%, #FFE3EA 60%, #E3D9FF 100%); }
.sky--evening { background: linear-gradient(180deg, #5B5A8F 0%, #8C7BC0 60%, #C9B8F0 100%); color: #FFFDFB; }
.sky__decor { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.sky__content { position: relative; height: 100%; }
.sky__star { animation: special-twinkle 2.2s ease-in-out infinite; }
@keyframes special-twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/components/PlantScene.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PlantScene.tsx src/components/SkyBackground.tsx src/components/scene.css tests/unit/components/PlantScene.test.tsx
git commit -m "feat: add PlantScene compositor and time-of-day sky

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Dependency context and live hooks (today, clock, backup reminder)

**Files:**
- Create: `src/app/deps.tsx`, `src/hooks/useNow.ts`, `src/hooks/useToday.ts`, `src/hooks/useBackupReminder.ts`
- Modify: `tests/unit/helpers.tsx` (append `renderWithDeps`)
- Test: `tests/unit/hooks/useToday.test.tsx`

**Interfaces:**
- Consumes: `DayDeps`, `ensureToday` (Task 4), `db` (Task 3), `CATALOG` (Task 9), `dayKey` (Task 2), `getSetting` (Task 3), `oldestCreatedAt` (Task 3), `needsBackupReminder` (Task 6), `NavContext`, `Tab` (Task 1).
- Produces:
  - `defaultDeps: DayDeps`, `DepsProvider`, `useDeps(): DayDeps`
  - `useNow(intervalMs?: number): Date` — re-reads `deps.now()` every interval **and** on `visibilitychange`/`focus`
  - `useToday(): { day: DayRecord | undefined; todayKey: string; now: Date; error: Error | null }` — calls `ensureToday` whenever `todayKey` changes
  - `useBackupReminder(): boolean`
  - `tests/unit/helpers.tsx`: `renderWithDeps(ui, deps, nav?)`

- [ ] **Step 1: Implement the context and append the test helper**

`src/app/deps.tsx`:
```tsx
import { createContext, useContext } from 'react';
import { CATALOG } from '../content/catalog';
import { db } from '../db/db';
import type { DayDeps } from '../domain/dayService';

export const defaultDeps: DayDeps = {
  db,
  catalog: CATALOG,
  rng: Math.random,
  now: () => new Date(),
};

const DepsContext = createContext<DayDeps>(defaultDeps);
export const DepsProvider = DepsContext.Provider;
export const useDeps = () => useContext(DepsContext);
```

Append to `tests/unit/helpers.tsx` (merge imports at the top):
```tsx
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { DepsProvider } from '../../src/app/deps';
import { NavContext, type Tab } from '../../src/app/nav';

export function renderWithDeps(ui: ReactElement, deps: DayDeps, nav: (tab: Tab) => void = () => {}) {
  return render(
    <DepsProvider value={deps}>
      <NavContext.Provider value={nav}>{ui}</NavContext.Provider>
    </DepsProvider>,
  );
}
```

- [ ] **Step 2: Write the failing test**

`tests/unit/hooks/useToday.test.tsx`:
```tsx
import { act, screen, waitFor } from '@testing-library/react';
import { useToday } from '../../../src/hooks/useToday';
import { useBackupReminder } from '../../../src/hooks/useBackupReminder';
import { setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

function Probe() {
  const { day, todayKey } = useToday();
  return <p data-testid="probe">{todayKey}|{day?.date ?? 'loading'}</p>;
}

function ReminderProbe() {
  return <p data-testid="reminder">{String(useBackupReminder())}</p>;
}

describe('useToday', () => {
  it('tạo bản ghi hôm nay khi mở', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    renderWithDeps(<Probe />, deps);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-02|2026-10-02'));
    expect(await deps.db.days.count()).toBe(1);
  });

  it('app mở xuyên qua 4:00 sáng: quay lại app thì sang ngày mới', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 23, 0));
    renderWithDeps(<Probe />, deps);
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-02|2026-10-02'));
    clock.current = new Date(2026, 9, 3, 4, 5);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(screen.getByTestId('probe')).toHaveTextContent('2026-10-03|2026-10-03'));
    expect((await deps.db.days.toArray()).map((d) => d.date)).toEqual(['2026-10-02', '2026-10-03']);
  });
});

describe('useBackupReminder', () => {
  it('nhắc khi dữ liệu cũ hơn 7 ngày mà chưa sao lưu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 20, 10, 0));
    await deps.db.days.put(makeDay({ date: '2026-10-01', createdAt: new Date(2026, 9, 1).getTime() }));
    renderWithDeps(<ReminderProbe />, deps);
    await waitFor(() => expect(screen.getByTestId('reminder')).toHaveTextContent('true'));
    await act(() => setSetting(deps.db, 'lastBackupAt', new Date(2026, 9, 19).getTime()));
    await waitFor(() => expect(screen.getByTestId('reminder')).toHaveTextContent('false'));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/hooks/useToday.test.tsx`
Expected: FAIL — hook modules not found.

- [ ] **Step 4: Implement the hooks**

`src/hooks/useNow.ts`:
```ts
import { useEffect, useState } from 'react';
import { useDeps } from '../app/deps';

export function useNow(intervalMs = 30_000): Date {
  const deps = useDeps();
  const [now, setNow] = useState(() => deps.now());
  useEffect(() => {
    const tick = () => setNow(deps.now());
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [deps, intervalMs]);
  return now;
}
```

`src/hooks/useToday.ts`:
```ts
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { dayKey } from '../domain/dayKey';
import { ensureToday } from '../domain/dayService';
import { useNow } from './useNow';

export function useToday() {
  const deps = useDeps();
  const now = useNow();
  const todayKey = dayKey(now);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    ensureToday(deps).catch((e: Error) => setError(e));
  }, [deps, todayKey]);

  const day = useLiveQuery(() => deps.db.days.get(todayKey), [deps.db, todayKey]);
  return { day, todayKey, now, error };
}
```

`src/hooks/useBackupReminder.ts`:
```ts
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { needsBackupReminder } from '../db/backup';
import { oldestCreatedAt } from '../db/queries';
import { getSetting } from '../db/settings';

export function useBackupReminder(): boolean {
  const deps = useDeps();
  const info = useLiveQuery(
    async () => ({
      last: (await getSetting(deps.db, 'lastBackupAt')) ?? null,
      oldest: await oldestCreatedAt(deps.db),
    }),
    [deps.db],
  );
  return info ? needsBackupReminder(info.last, info.oldest, deps.now().getTime()) : false;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/hooks/useToday.test.tsx`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/deps.tsx src/hooks tests/unit/helpers.tsx tests/unit/hooks
git commit -m "feat: add deps context and live hooks for today, clock and backup reminder

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Today screen — plant, todo list, watering, greeting, rest day, sheets

**Before writing CSS:** invoke the `frontend-design` skill (see Global Constraints). Target the iPhone 13 viewport (390×844): the plant half is `46dvh`, and the list scrolls beneath it.

**Files:**
- Create: `src/components/IconButton.tsx`, `src/components/BottomSheet.tsx`, `src/components/SpeechBubble.tsx`, `src/components/WateringCan.tsx`, `src/components/StageBurst.tsx`, `src/components/TodoList.tsx`, `src/components/PlantPickerSheet.tsx`, `src/components/PotPickerSheet.tsx`, `src/components/NoteSheet.tsx`, `src/components/sheet.css`, `src/components/todo.css`, `src/screens/today.css`
- Modify: `src/screens/TodayScreen.tsx` (replace stub), `src/app/App.tsx` (auto-open Today when not yet greeted)
- Test: `tests/unit/screens/TodayScreen.test.tsx`, `tests/unit/app/App.test.tsx`

**Interfaces:**
- Consumes: `useToday`, `useBackupReminder`, `useDeps` (Task 11), `useNav` (Task 1), `PlantScene`, `SkyBackground` (Task 10), `PLANTS`, `getSpecies` (Task 9), `POTS` (Task 8), `getSpecial` (Task 8), `pickGreeting` (Task 9), day-service functions (Task 4), `stageIndex` (Task 2), `timeOfDay` (Task 2), `Mood` (Task 7).
- Produces: `TodayScreen()`; `BottomSheet({ open, title, onClose, children })`; `IconButton({ label, icon, onClick, pressed?, disabled?, badge? })`; `TodoList(props)`; `NoteSheet({ open, initial, onClose, onSave })` (reused in Task 13 is **not** required — the calendar uses its own inline note editor).

- [ ] **Step 1: Write the failing tests**

`tests/unit/screens/TodayScreen.test.tsx`:
```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayScreen } from '../../../src/screens/TodayScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const user = userEvent.setup();
  renderWithDeps(<TodayScreen />, deps);
  return { deps, clock, user };
};

describe('TodayScreen', () => {
  it('thêm và tick việc làm cây lớn', async () => {
    const { user } = setup();
    await user.type(await screen.findByLabelText('Thêm việc cần làm'), 'Uống nước{Enter}');
    const box = await screen.findByRole('checkbox', { name: 'Hoàn thành: Uống nước' });
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'seed');
    await user.click(box);
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom'));
    expect(screen.getByText('1/1 việc')).toBeInTheDocument();
  });

  it('cây chào lần đầu trong ngày và ghi lại đã chào', async () => {
    const { deps } = setup();
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))?.greetedAt).not.toBeNull());
  });

  it('ngày tiết kiệm năng lượng: ẩn danh sách, cây ngủ, giữ việc', async () => {
    const { deps, user } = setup();
    await user.type(await screen.findByLabelText('Thêm việc cần làm'), 'Dọn nhà{Enter}');
    await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' });
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    expect(await screen.findByTestId('rest-message')).toBeInTheDocument();
    expect(screen.queryByLabelText('Thêm việc cần làm')).not.toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-mode', 'sleeping');
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Thức dậy' }));
    expect(await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' })).toBeInTheDocument();
  });

  it('đổi cây qua bảng chọn', async () => {
    const { user } = setup();
    const current = (await screen.findByTestId('plant-scene')).getAttribute('data-plant');
    const [targetName, targetId] = current === 'corn' ? ['Xương rồng', 'cactus'] : ['Ngô', 'corn'];
    await user.click(screen.getByRole('button', { name: 'Đổi cây' }));
    const dialog = await screen.findByRole('dialog', { name: 'Chọn cây hôm nay' });
    await user.click(within(dialog).getByRole('button', { name: targetName }));
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-plant', targetId));
  });

  it('ghi chú cho hôm nay', async () => {
    const { deps, user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Ghi chú' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ghi chú hôm nay' });
    await user.type(within(dialog).getByLabelText('Nội dung ghi chú'), 'Trời đẹp');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('Trời đẹp'));
  });
});
```

`tests/unit/app/App.test.tsx`:
```tsx
import { screen } from '@testing-library/react';
import { App } from '../../../src/app/App';
import { CATALOG } from '../../../src/content/catalog';
import { markGreeted, ensureToday } from '../../../src/domain/dayService';
import { makeDeps, renderWithDeps } from '../helpers';

describe('App', () => {
  it('lần đầu mở trong ngày thì tự chuyển sang tab Hôm nay để cây chào', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<App />, deps);
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
  });

  it('đã chào rồi thì mở màn Lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    expect(await screen.findByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-current', 'page');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/screens/TodayScreen.test.tsx tests/unit/app/App.test.tsx`
Expected: FAIL — the stub screen has no input/plant scene; the App test fails because the app does not auto-switch.

- [ ] **Step 3: Implement the small components**

`src/components/IconButton.tsx`:
```tsx
export function IconButton({
  label, icon, onClick, pressed, disabled, badge,
}: { label: string; icon: string; onClick: () => void; pressed?: boolean; disabled?: boolean; badge?: boolean }) {
  return (
    <button
      type="button"
      className={`icon-btn${pressed ? ' is-pressed' : ''}`}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <span aria-hidden="true">{icon}</span>
      {badge && <span className="icon-btn__badge" aria-hidden="true" />}
    </button>
  );
}
```

`src/components/BottomSheet.tsx`:
```tsx
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import './sheet.css';

export function BottomSheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="sheet__backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="sheet__grip" aria-hidden="true" />
            <h2 className="sheet__title">{title}</h2>
            <div className="sheet__body">{children}</div>
            <button type="button" className="btn btn--ghost sheet__close" onClick={onClose}>Đóng</button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

`src/components/SpeechBubble.tsx`:
```tsx
import { AnimatePresence, motion } from 'motion/react';

export function SpeechBubble({ text }: { text: string | null }) {
  return (
    <AnimatePresence>
      {text && (
        <motion.div
          className="bubble"
          data-testid="speech-bubble"
          role="status"
          initial={{ opacity: 0, scale: 0.6, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        >
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

`src/components/WateringCan.tsx`:
```tsx
import { motion } from 'motion/react';
import { INK } from '../content/Face';

/** Bình tưới nghiêng + giọt nước; render lại mỗi khi playKey tăng. */
export function WateringCan({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;
  return (
    <g key={playKey} data-testid="watering-can">
      <motion.g
        initial={{ opacity: 0, x: 60, rotate: 0 }}
        animate={{ opacity: [0, 1, 1, 1, 0], x: [60, 20, 20, 20, 40], rotate: [0, 0, -28, -28, 0] }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.35, 0.8, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <g transform="translate(110 40)">
          <path d="M8 10 q14 -14 28 0" fill="none" stroke={INK} strokeWidth={3} />
          <path d="M44 16 q14 4 0 22" fill="none" stroke={INK} strokeWidth={3} />
          <path d="M0 18 L-22 6 L-24 10 L-4 28 Z" fill="#BDE3FF" stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <rect x={0} y={10} width={44} height={32} rx={10} fill="#BDE3FF" stroke={INK} strokeWidth={2} />
          <circle cx={22} cy={26} r={5} fill="#FFFFFF" opacity={0.7} />
        </g>
      </motion.g>
      {[0, 1, 2, 3].map((i) => (
        <motion.circle
          key={i}
          cx={88 + i * 4}
          cy={62}
          r={3}
          fill="#7CC8FF"
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], y: [0, 30, 60, 80] }}
          transition={{ delay: 0.7 + i * 0.12, duration: 0.7, repeat: 1 }}
        />
      ))}
    </g>
  );
}
```

`src/components/StageBurst.tsx`:
```tsx
import { motion } from 'motion/react';

export function StageBurst({ playKey }: { playKey: number }) {
  if (playKey === 0) return null;
  return (
    <g key={playKey} data-testid="stage-burst">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.text
            key={i}
            x={100}
            y={100}
            fontSize={14}
            textAnchor="middle"
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: 0, x: Math.cos(a) * 70, y: Math.sin(a) * 70, scale: 1.3 }}
            transition={{ duration: 1.1, ease: 'easeOut', delay: 0.9 }}
          >
            {i % 2 ? '🍃' : '🌸'}
          </motion.text>
        );
      })}
    </g>
  );
}
```

`src/components/TodoList.tsx`:
```tsx
import { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls } from 'motion/react';
import type { Todo } from '../domain/types';
import './todo.css';

export interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}

export function TodoList({ todos, onToggle, onAdd, onEdit, onDelete, onReorder }: TodoListProps) {
  const [items, setItems] = useState(todos);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => setItems(todos), [todos]);
  const [draft, setDraft] = useState('');

  return (
    <div className="todo">
      <form
        className="todo__add"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onAdd(text);
          setDraft('');
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Thêm việc cần làm…"
          aria-label="Thêm việc cần làm"
          maxLength={200}
          enterKeyHint="done"
        />
        <button className="btn btn--primary btn--round" type="submit" aria-label="Thêm">＋</button>
      </form>
      {items.length === 0 ? (
        <p className="todo__empty muted">Chưa có việc nào. Thêm một việc nhỏ để tưới cây nhé 💧</p>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="todo__list" as="ul">
          {items.map((t) => (
            <TodoRow
              key={t.id}
              todo={t}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragEnd={() => onReorder(itemsRef.current.map((i) => i.id))}
            />
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}

function TodoRow({
  todo, onToggle, onEdit, onDelete, onDragEnd,
}: { todo: Todo; onToggle: (id: string) => void; onEdit: (id: string, text: string) => void; onDelete: (id: string) => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== todo.text) onEdit(todo.id, clean);
    setEditing(false);
  };
  return (
    <Reorder.Item
      value={todo}
      as="li"
      className={`todo__row${todo.done ? ' is-done' : ''}`}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
    >
      <button
        type="button"
        className="todo__check"
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.done ? `Bỏ hoàn thành: ${todo.text}` : `Hoàn thành: ${todo.text}`}
        onClick={() => onToggle(todo.id)}
      >
        {todo.done ? '✓' : ''}
      </button>
      {editing ? (
        <form className="todo__edit" onSubmit={(e) => { e.preventDefault(); commit(); }}>
          <input className="input" autoFocus value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} aria-label="Sửa việc" maxLength={200} />
        </form>
      ) : (
        <span className="todo__text" onClick={() => { setText(todo.text); setEditing(true); }}>{todo.text}</span>
      )}
      <button type="button" className="todo__delete" aria-label={`Xoá: ${todo.text}`} onClick={() => onDelete(todo.id)}>×</button>
      <span className="todo__handle" aria-hidden="true" onPointerDown={(e) => controls.start(e)}>⋮⋮</span>
    </Reorder.Item>
  );
}
```

`src/components/PlantPickerSheet.tsx`:
```tsx
import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { PLANTS } from '../content/plants/registry';

export function PlantPickerSheet({ open, currentId, onClose, onPick }: { open: boolean; currentId: string; onClose: () => void; onPick: (id: string) => void }) {
  return (
    <BottomSheet open={open} title="Chọn cây hôm nay" onClose={onClose}>
      <div className="picker">
        {PLANTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`picker__item${p.id === currentId ? ' is-selected' : ''}`}
            aria-label={p.name}
            aria-pressed={p.id === currentId}
            onClick={() => onPick(p.id)}
          >
            <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
```

`src/components/PotPickerSheet.tsx`:
```tsx
import { BottomSheet } from './BottomSheet';
import { PlantScene } from './PlantScene';
import { POTS } from '../content/pots/registry';
import type { DayRecord } from '../domain/types';

export function PotPickerSheet({ open, day, onClose, onPick }: { open: boolean; day: DayRecord; onClose: () => void; onPick: (id: string) => void }) {
  return (
    <BottomSheet open={open} title="Chọn chậu" onClose={onClose}>
      <div className="picker">
        {POTS.map((pot) => (
          <button
            key={pot.id}
            type="button"
            className={`picker__item${pot.id === day.potId ? ' is-selected' : ''}`}
            aria-label={pot.name}
            aria-pressed={pot.id === day.potId}
            onClick={() => onPick(pot.id)}
          >
            <PlantScene className="picker__scene" testId="picker-scene" plantId={day.plantId} potId={pot.id} stage={day.finalStage} specialId={null} mood="normal" />
            <span>{pot.name}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
```

`src/components/NoteSheet.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';

export function NoteSheet({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (note: string) => void }) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (open) setText(initial);
  }, [open, initial]);
  return (
    <BottomSheet open={open} title="Ghi chú hôm nay" onClose={onClose}>
      <textarea className="textarea" aria-label="Nội dung ghi chú" value={text} onChange={(e) => setText(e.target.value)} placeholder="Hôm nay thế nào nè?" />
      <button type="button" className="btn btn--primary sheet__save" onClick={() => onSave(text)}>Lưu</button>
    </BottomSheet>
  );
}
```

`src/components/sheet.css`:
```css
.sheet__backdrop { position: fixed; inset: 0; background: rgba(91, 70, 54, 0.25); z-index: 40; }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 41; max-height: 85dvh; overflow-y: auto;
  background: var(--white); border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 10px 16px calc(16px + env(safe-area-inset-bottom)); box-shadow: 0 -8px 24px rgba(91, 70, 54, 0.15);
}
.sheet__grip { width: 44px; height: 5px; border-radius: 3px; background: var(--lavender); margin: 0 auto 10px; }
.sheet__title { font-family: var(--font-display); font-size: 1.3rem; margin: 0 0 12px; text-align: center; }
.sheet__body { display: flex; flex-direction: column; gap: 12px; }
.sheet__close { display: block; margin: 8px auto 0; }
.sheet__save { align-self: flex-end; }
.picker { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.picker__item {
  display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px;
  border: 2px solid transparent; border-radius: var(--radius-md); background: var(--cream);
  font-weight: 700; font-size: 0.85rem; cursor: pointer;
}
.picker__item.is-selected { border-color: var(--berry); background: var(--peach); }
.picker__scene { width: 80px; height: 96px; }
```

`src/components/todo.css`:
```css
.todo { display: flex; flex-direction: column; gap: 12px; }
.todo__add { display: flex; gap: 8px; }
.todo__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.todo__row {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--cream);
  border-radius: var(--radius-md); box-shadow: var(--shadow-pop);
}
.todo__check {
  flex: none; width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid var(--cocoa);
  background: #fff; font-weight: 700; color: #fff; cursor: pointer;
}
.todo__row.is-done .todo__check { background: var(--leaf); }
.todo__text { flex: 1; overflow-wrap: anywhere; cursor: text; }
.todo__row.is-done .todo__text { text-decoration: line-through; color: var(--cocoa-soft); }
.todo__edit { flex: 1; }
.todo__delete { flex: none; border: none; background: none; font-size: 1.4rem; color: var(--cocoa-soft); cursor: pointer; width: 32px; height: 32px; }
.todo__handle { flex: none; touch-action: none; cursor: grab; color: var(--cocoa-soft); letter-spacing: -3px; padding: 6px 2px; }
.todo__empty { text-align: center; margin: 12px 0; }
```

- [ ] **Step 4: Implement TodayScreen**

`src/screens/TodayScreen.tsx` (replace the whole file):
```tsx
import { useEffect, useRef, useState } from 'react';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { IconButton } from '../components/IconButton';
import { NoteSheet } from '../components/NoteSheet';
import { PlantPickerSheet } from '../components/PlantPickerSheet';
import { PlantScene } from '../components/PlantScene';
import { PotPickerSheet } from '../components/PotPickerSheet';
import { SkyBackground } from '../components/SkyBackground';
import { SpeechBubble } from '../components/SpeechBubble';
import { StageBurst } from '../components/StageBurst';
import { TodoList } from '../components/TodoList';
import { WateringCan } from '../components/WateringCan';
import type { Mood } from '../content/Face';
import { pickGreeting } from '../content/greetings';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import {
  addTodo, changePlant, changePot, deleteTodo, editTodo, markGreeted, reorderTodos, setNote, setRestDay, toggleTodo,
} from '../domain/dayService';
import { stageIndex } from '../domain/growth';
import { timeOfDay } from '../domain/timeOfDay';
import { useBackupReminder } from '../hooks/useBackupReminder';
import { useToday } from '../hooks/useToday';
import './today.css';

type Sheet = null | 'plant' | 'pot' | 'note';

export function TodayScreen() {
  const deps = useDeps();
  const nav = useNav();
  const { day, now, error: loadError } = useToday();
  const showReminder = useBackupReminder();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [waterKey, setWaterKey] = useState(0);
  const [burstKey, setBurstKey] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [error, setError] = useState<string | null>(null);
  const greetedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!day || day.greetedAt !== null || greetedFor.current === day.date) return;
    greetedFor.current = day.date;
    setGreeting(pickGreeting(getSpecies(day.plantId), deps.rng));
    markGreeted(deps, day.date).catch((e: Error) => setError(e.message));
  }, [day, deps]);

  useEffect(() => {
    if (!greeting) return;
    const t = setTimeout(() => setGreeting(null), 5000);
    return () => clearTimeout(t);
  }, [greeting]);

  useEffect(() => {
    if (!celebrating) return;
    const t = setTimeout(() => setCelebrating(false), 1800);
    return () => clearTimeout(t);
  }, [celebrating, waterKey]);

  if (loadError) {
    return <section className="screen"><p role="alert" className="error">Không tải được dữ liệu: {loadError.message}</p></section>;
  }
  if (!day) {
    return <section className="screen" aria-busy="true"><p className="muted">Đang tưới cây…</p></section>;
  }

  const run = (p: Promise<unknown>) => {
    p.catch((e: Error) => setError(e.message));
  };
  const mood: Mood = day.isRestDay ? 'sleep' : greeting ? 'talk' : celebrating ? 'smile' : 'normal';
  const doneCount = day.todos.filter((t) => t.done).length;
  const special = day.isRestDay ? null : getSpecial(day.specialId);

  async function handleToggle(id: string) {
    try {
      const r = await toggleTodo(deps, day!.date, id);
      if (r.completed) {
        setWaterKey((k) => k + 1);
        setCelebrating(true);
        if (stageIndex(r.day.finalStage) > stageIndex(r.prevStage)) setBurstKey((k) => k + 1);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen screen--today">
      <SkyBackground time={timeOfDay(now)}>
        <div className="today__stage">
          <SpeechBubble text={greeting} />
          <PlantScene
            className="today__plant"
            plantId={day.plantId}
            potId={day.potId}
            stage={day.finalStage}
            specialId={day.specialId}
            mood={mood}
            mode={day.isRestDay ? 'sleeping' : 'plant'}
            bounceKey={waterKey}
          >
            {!day.isRestDay && <WateringCan playKey={waterKey} />}
            <StageBurst playKey={burstKey} />
          </PlantScene>
          {special && <span className="today__badge">✨ Cây đặc biệt: {special.name}</span>}
        </div>
        <div className="today__actions">
          <IconButton label="Đổi cây" icon="🔄" onClick={() => setSheet('plant')} disabled={day.isRestDay} />
          <IconButton label="Đổi chậu" icon="🪴" onClick={() => setSheet('pot')} />
          <IconButton label="Ghi chú" icon="📝" onClick={() => setSheet('note')} badge={day.note.length > 0} />
          <IconButton
            label={day.isRestDay ? 'Thức dậy' : 'Ngày tiết kiệm năng lượng'}
            icon={day.isRestDay ? '🌞' : '😴'}
            pressed={day.isRestDay}
            onClick={() => run(setRestDay(deps, day.date, !day.isRestDay))}
          />
        </div>
      </SkyBackground>

      <div className="today__list card">
        {showReminder && (
          <button type="button" className="reminder" onClick={() => nav('settings')}>
            🌱 Lâu rồi bạn chưa sao lưu dữ liệu — chạm để sao lưu nhé!
          </button>
        )}
        {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
        {day.isRestDay ? (
          <div className="rest" data-testid="rest-message">
            <p className="rest__title">💤 Hôm nay là ngày tiết kiệm năng lượng</p>
            <p className="muted">Nghỉ ngơi thật ngon nhé, việc để mai tính!</p>
          </div>
        ) : (
          <>
            <header className="today__head">
              <h1 className="screen__title">Hôm nay</h1>
              <span className="pill">{doneCount}/{day.todos.length} việc</span>
            </header>
            <TodoList
              todos={day.todos}
              onToggle={handleToggle}
              onAdd={(t) => run(addTodo(deps, day.date, t))}
              onEdit={(id, t) => run(editTodo(deps, day.date, id, t))}
              onDelete={(id) => run(deleteTodo(deps, day.date, id))}
              onReorder={(ids) => run(reorderTodos(deps, day.date, ids))}
            />
          </>
        )}
      </div>

      <PlantPickerSheet
        open={sheet === 'plant'}
        currentId={day.plantId}
        onClose={() => setSheet(null)}
        onPick={(id) => { run(changePlant(deps, day.date, id)); setSheet(null); }}
      />
      <PotPickerSheet
        open={sheet === 'pot'}
        day={day}
        onClose={() => setSheet(null)}
        onPick={(id) => { run(changePot(deps, day.date, id)); setSheet(null); }}
      />
      <NoteSheet
        open={sheet === 'note'}
        initial={day.note}
        onClose={() => setSheet(null)}
        onSave={(note) => { run(setNote(deps, day.date, note)); setSheet(null); }}
      />
    </section>
  );
}
```

`src/screens/today.css`:
```css
.screen--today { padding: 0 0 calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px); }
.screen--today .sky { height: 46dvh; min-height: 300px; display: flex; flex-direction: column; }
.today__stage { position: relative; flex: 1; display: flex; align-items: flex-end; justify-content: center; padding-top: 12px; }
.today__plant { width: auto; height: 100%; max-height: 300px; }
.today__badge {
  position: absolute; top: 12px; left: 12px; padding: 4px 10px; border-radius: 999px;
  background: rgba(255, 253, 251, 0.85); font-weight: 700; font-size: 0.8rem; color: var(--cocoa);
}
.today__actions { display: flex; justify-content: center; gap: 10px; padding: 8px 0 14px; }
.icon-btn {
  position: relative; width: 48px; height: 48px; border-radius: 50%; border: 2px solid var(--cocoa);
  background: var(--white); box-shadow: var(--shadow-pop); font-size: 1.3rem; cursor: pointer;
}
.icon-btn:active { transform: translateY(2px) scale(0.95); box-shadow: none; }
.icon-btn:disabled { opacity: 0.4; }
.icon-btn.is-pressed { background: var(--lavender); }
.icon-btn__badge { position: absolute; top: 4px; right: 4px; width: 9px; height: 9px; border-radius: 50%; background: var(--berry); }
.today__list { margin: -18px 12px 0; position: relative; display: flex; flex-direction: column; gap: 12px; }
.today__head { display: flex; align-items: center; justify-content: space-between; }
.reminder { border: 2px dashed var(--leaf); background: var(--mint); border-radius: var(--radius-md); padding: 10px 12px; text-align: left; font-weight: 600; cursor: pointer; }
.rest { text-align: center; padding: 16px 0; }
.rest__title { font-family: var(--font-display); font-size: 1.2rem; margin: 0 0 4px; }
.bubble {
  position: absolute; top: 10px; left: 50%; translate: -50% 0; max-width: 80%; z-index: 2;
  padding: 10px 14px; background: var(--white); border: 2px solid var(--cocoa); border-radius: 18px;
  box-shadow: var(--shadow-soft); font-weight: 600; text-align: center; color: var(--cocoa);
}
.bubble::after {
  content: ''; position: absolute; bottom: -10px; left: 50%; translate: -50% 0; width: 16px; height: 16px;
  background: var(--white); border-right: 2px solid var(--cocoa); border-bottom: 2px solid var(--cocoa); rotate: 45deg;
}
```

- [ ] **Step 5: Make App open Today when the plant has not greeted yet**

Replace `src/app/App.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useDeps } from './deps';
import { NavContext, type Tab } from './nav';
import { TabBar } from './TabBar';
import { ensureToday } from '../domain/dayService';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export function App() {
  const deps = useDeps();
  const [tab, setTab] = useState<Tab>('calendar');

  useEffect(() => {
    let alive = true;
    ensureToday(deps)
      .then((day) => {
        if (alive && day.greetedAt === null) setTab('today');
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [deps]);

  return (
    <NavContext.Provider value={setTab}>
      <div className="app">
        <main className="app__main">
          {tab === 'calendar' && <CalendarScreen />}
          {tab === 'today' && <TodayScreen />}
          {tab === 'templates' && <TemplatesScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
        <TabBar current={tab} onChange={setTab} />
      </div>
    </NavContext.Provider>
  );
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/unit/screens/TodayScreen.test.tsx tests/unit/app`
Expected: all pass.

- [ ] **Step 7: Manual check in the browser**

Run `npm run dev`, then open the app at 390×844. Check:
- the first visit of the day lands on Hôm nay with a speech bubble;
- adding and ticking todos plays the watering can, then the plant bounces and smiles, and moving up a stage plays the burst;
- the rest day shows the sleeping seed with a pillow;
- the plant and pot pickers work;
- the note badge appears after saving a note.

- [ ] **Step 8: Commit**

```bash
git add src tests/unit
git commit -m "feat: add Today screen with watering animation, greeting, rest day and pickers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 13: Calendar screen — month grid, mini plants, day details, custom background

**Before writing CSS:** invoke the `frontend-design` skill (see Global Constraints).

**Files:**
- Create: `src/domain/calendar.ts`, `src/utils/image.ts`, `src/hooks/useCalendarBg.ts`, `src/components/MiniPlant.tsx`, `src/components/DayCell.tsx`, `src/components/DayDetailSheet.tsx`, `src/components/BackgroundPicker.tsx`, `src/screens/calendar.css`
- Modify: `src/screens/CalendarScreen.tsx` (replace stub)
- Test: `tests/unit/domain/calendar.test.ts`, `tests/unit/screens/CalendarScreen.test.tsx`

**Interfaces:**
- Consumes: `formatDate`, `parseDayKey`, `dayKey` (Task 2), `STAGE_LABEL` (Task 2), `DayRecord`, `CalendarBg` (Task 3), `listDaysInRange`, `firstDayKey` (Task 3), `getSetting`, `setSetting`, `deleteSetting` (Task 3), `setNote` (Task 4), `useDeps` (Task 11), `useNow` (Task 11), `useNav` (Task 1), `PlantScene` (Task 10), `BottomSheet` (Task 12), `getSpecies` (Task 9), `getSpecial` (Task 8), `DEFAULT_POT_ID` (Task 8).
- Produces:
  - `src/domain/calendar.ts`: `MonthCell { key: string | null; day: number | null }`, `buildMonthGrid(year, month): MonthCell[]` (Monday-first, length a multiple of 7), `type CellStatus = 'plant' | 'rest' | 'missed' | 'today-pending' | 'future' | 'before-start'`, `dayCellStatus(key, record | undefined, todayKey, firstKey | null): CellStatus`, `WEEKDAY_SHORT`, `monthLabel(year, month)`, `longDateLabel(key)`, `shiftMonth(year, month, delta): { year; month }`
  - `fitWithin(w, h, max): { width; height }`, `compressImage(file: Blob, max?: number): Promise<CalendarBg>`
  - `useCalendarBgUrl(): string | null`
  - `MiniPlant({ status, record })`, `DayCell(...)`, `DayDetailSheet(...)`, `BackgroundPicker()` (reused in Task 15)

- [ ] **Step 1: Write the failing domain test**

`tests/unit/domain/calendar.test.ts`:
```ts
import { buildMonthGrid, dayCellStatus, longDateLabel, monthLabel, shiftMonth } from '../../../src/domain/calendar';
import { fitWithin } from '../../../src/utils/image';
import { makeDay } from '../helpers';

describe('calendar', () => {
  it('tháng 10/2026 bắt đầu thứ Năm → 3 ô trống đầu (tuần bắt đầu thứ Hai)', () => {
    const cells = buildMonthGrid(2026, 9);
    expect(cells).toHaveLength(35);
    expect(cells.slice(0, 3).every((c) => c.key === null)).toBe(true);
    expect(cells[3]).toEqual({ key: '2026-10-01', day: 1 });
    expect(cells[33]).toEqual({ key: '2026-10-31', day: 31 });
  });

  it('tháng 2/2027 bắt đầu thứ Hai và vừa khít 4 tuần', () => {
    const cells = buildMonthGrid(2027, 1);
    expect(cells).toHaveLength(28);
    expect(cells[0].key).toBe('2027-02-01');
  });

  it('dayCellStatus', () => {
    const today = '2026-10-15';
    const first = '2026-10-02';
    expect(dayCellStatus('2026-10-03', makeDay({ date: '2026-10-03' }), today, first)).toBe('plant');
    expect(dayCellStatus('2026-10-04', makeDay({ date: '2026-10-04', isRestDay: true }), today, first)).toBe('rest');
    expect(dayCellStatus('2026-10-05', undefined, today, first)).toBe('missed');
    expect(dayCellStatus('2026-10-01', undefined, today, first)).toBe('before-start');
    expect(dayCellStatus('2026-09-20', undefined, today, null)).toBe('before-start');
    expect(dayCellStatus('2026-10-15', undefined, today, first)).toBe('today-pending');
    expect(dayCellStatus('2026-10-16', undefined, today, first)).toBe('future');
  });

  it('nhãn tiếng Việt', () => {
    expect(monthLabel(2026, 9)).toBe('Tháng 10, 2026');
    expect(longDateLabel('2026-10-01')).toBe('Thứ Năm, 01/10/2026');
    expect(longDateLabel('2026-10-04')).toBe('Chủ Nhật, 04/10/2026');
  });

  it('shiftMonth qua năm', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('fitWithin giữ tỉ lệ và không phóng to', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/domain/calendar.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the domain and image helpers**

`src/domain/calendar.ts`:
```ts
import { formatDate, parseDayKey } from './dayKey';
import type { DayRecord } from './types';

export interface MonthCell {
  key: string | null;
  day: number | null;
}

/** Lưới tháng, tuần bắt đầu từ thứ Hai; ô đệm có key = null. */
export function buildMonthGrid(year: number, month: number): MonthCell[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: MonthCell[] = Array.from({ length: lead }, () => ({ key: null, day: null }));
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: formatDate(new Date(year, month, d)), day: d });
  while (cells.length % 7 !== 0) cells.push({ key: null, day: null });
  return cells;
}

export type CellStatus = 'plant' | 'rest' | 'missed' | 'today-pending' | 'future' | 'before-start';

export function dayCellStatus(key: string, record: DayRecord | undefined, todayKey: string, firstKey: string | null): CellStatus {
  if (record) return record.isRestDay ? 'rest' : 'plant';
  if (key > todayKey) return 'future';
  if (key === todayKey) return 'today-pending';
  if (firstKey === null || key < firstKey) return 'before-start';
  return 'missed';
}

export const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const WEEKDAY_LONG = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = (n: number) => String(n).padStart(2, '0');

export function monthLabel(year: number, month: number): string {
  return `Tháng ${month + 1}, ${year}`;
}

export function longDateLabel(key: string): string {
  const d = parseDayKey(key);
  return `${WEEKDAY_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}
```

`src/utils/image.ts`:
```ts
import type { CalendarBg } from '../domain/types';

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Thu nhỏ ảnh còn tối đa `max` px rồi nén JPEG để lưu nhẹ trong IndexedDB. */
export async function compressImage(file: Blob, max = 1600): Promise<CalendarBg> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không xử lý được ảnh');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không nén được ảnh'))), 'image/jpeg', 0.85),
  );
  return { mime: 'image/jpeg', data: await blob.arrayBuffer() };
}
```

- [ ] **Step 4: Run domain test to verify it passes**

Run: `npx vitest run tests/unit/domain/calendar.test.ts`
Expected: all pass.

- [ ] **Step 5: Write the failing screen test**

`tests/unit/screens/CalendarScreen.test.tsx`:
```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

async function setup() {
  const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
  await deps.db.days.bulkPut([
    makeDay({ date: '2026-10-02', plantId: 'cherry', potId: 'polka', finalStage: 'bloom', specialId: 'glow', note: 'vui',
      todos: [{ id: 'a', text: 'Tập yoga', done: true, doneAt: 1, order: 0 }] }),
    makeDay({ date: '2026-10-03', isRestDay: true }),
  ]);
  const nav = vi.fn();
  const user = userEvent.setup();
  renderWithDeps(<CalendarScreen />, deps, nav);
  return { deps, nav, user };
}

describe('CalendarScreen', () => {
  it('hiển thị trạng thái từng ngày', async () => {
    await setup();
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    expect(screen.getByTestId('day-2026-10-03')).toHaveAttribute('data-status', 'rest');
    expect(screen.getByTestId('day-2026-10-04')).toHaveAttribute('data-status', 'missed');
    expect(screen.getByTestId('day-2026-10-01')).toHaveAttribute('data-status', 'before-start');
    expect(screen.getByTestId('day-2026-10-15')).toHaveAttribute('data-status', 'today-pending');
    expect(screen.getByTestId('day-2026-10-20')).toHaveAttribute('data-status', 'future');
    expect(within(screen.getByTestId('day-2026-10-03')).getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(within(screen.getByTestId('day-2026-10-04')).getByTestId('wilted-plant')).toBeInTheDocument();
  });

  it('chuyển sang tháng trước; không đi quá tháng hiện tại', async () => {
    const { user } = await setup();
    expect(screen.getByRole('heading', { name: 'Tháng 10, 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tháng trước' }));
    expect(screen.getByRole('heading', { name: 'Tháng 9, 2026' })).toBeInTheDocument();
  });

  it('xem chi tiết ngày cũ: việc chỉ đọc, ghi chú sửa được', async () => {
    const { deps, user } = await setup();
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).getByText('Tập yoga')).toBeInTheDocument();
    expect(within(dialog).getByText(/Cherry · Ra hoa/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Phát sáng/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    const note = within(dialog).getByLabelText('Ghi chú ngày này');
    await user.clear(note);
    await user.type(note, 'vui lắm');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu ghi chú' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('vui lắm'));
  });

  it('chạm vào hôm nay thì có nút đi tới màn Hôm nay', async () => {
    const { nav, user } = await setup();
    await user.click(await screen.findByTestId('day-2026-10-15'));
    await user.click(await screen.findByRole('button', { name: 'Đi tới Hôm nay 🌱' }));
    expect(nav).toHaveBeenCalledWith('today');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run tests/unit/screens/CalendarScreen.test.tsx`
Expected: FAIL — the stub screen has no grid.

- [ ] **Step 7: Implement hooks and components**

`src/hooks/useCalendarBg.ts`:
```ts
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting } from '../db/settings';

export function useCalendarBgUrl(): string | null {
  const deps = useDeps();
  const bg = useLiveQuery(() => getSetting(deps.db, 'calendarBg'), [deps.db]);
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!bg) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(new Blob([bg.data], { type: bg.mime }));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [bg]);
  return url;
}
```

`src/components/MiniPlant.tsx`:
```tsx
import { PlantScene } from './PlantScene';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import type { CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';

export function MiniPlant({ status, record }: { status: CellStatus; record?: DayRecord }) {
  if (status === 'plant' && record) {
    return (
      <PlantScene
        className="mini-plant"
        testId="mini-plant"
        plantId={record.plantId}
        potId={record.potId}
        stage={record.finalStage}
        specialId={record.specialId}
        mood={record.finalStage === 'bloom' ? 'smile' : 'normal'}
      />
    );
  }
  if (status === 'rest' && record) {
    return <PlantScene className="mini-plant" testId="mini-plant" plantId={record.plantId} potId={record.potId} stage="seed" specialId={null} mood="sleep" mode="sleeping" title="Ngủ ngon" />;
  }
  if (status === 'missed') {
    return <PlantScene className="mini-plant" testId="mini-plant" plantId="" potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sad" mode="wilted" title="Cây héo" />;
  }
  return null;
}
```

`src/components/DayCell.tsx`:
```tsx
import { MiniPlant } from './MiniPlant';
import { longDateLabel, type CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';

const STATUS_LABEL: Record<CellStatus, string> = {
  plant: '',
  rest: 'ngày tiết kiệm năng lượng',
  missed: 'cây héo',
  'today-pending': 'hôm nay',
  future: 'chưa tới',
  'before-start': '',
};

export function DayCell({ dateKey, day, status, record, isToday, onSelect }: {
  dateKey: string; day: number; status: CellStatus; record?: DayRecord; isToday: boolean; onSelect: () => void;
}) {
  const disabled = status === 'future' || status === 'before-start';
  const extra = STATUS_LABEL[status];
  return (
    <button
      type="button"
      className={`cal__cell cal__cell--${status}${isToday ? ' is-today' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      data-testid={`day-${dateKey}`}
      data-status={status}
      aria-label={extra ? `${longDateLabel(dateKey)}, ${extra}` : longDateLabel(dateKey)}
    >
      <span className="cal__num">{day}</span>
      <span className="cal__art"><MiniPlant status={status} record={record} /></span>
      {record?.specialId && !record.isRestDay && <span className="cal__spark" aria-hidden="true">✨</span>}
      {record?.note && <span className="cal__note-dot" aria-hidden="true" />}
    </button>
  );
}
```

`src/components/DayDetailSheet.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { MiniPlant } from './MiniPlant';
import { useDeps } from '../app/deps';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import { longDateLabel, type CellStatus } from '../domain/calendar';
import { setNote } from '../domain/dayService';
import { STAGE_LABEL } from '../domain/growth';
import type { DayRecord } from '../domain/types';

export function DayDetailSheet({ dateKey, todayKey, status, record, onClose, onGoToday }: {
  dateKey: string | null; todayKey: string; status: CellStatus | null; record?: DayRecord; onClose: () => void; onGoToday: () => void;
}) {
  const deps = useDeps();
  const [note, setNoteText] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setNoteText(record?.note ?? '');
    setSaved(false);
    setError(null);
  }, [dateKey, record?.note]);

  const open = dateKey !== null && status !== null;
  const special = record && !record.isRestDay ? getSpecial(record.specialId) : null;

  async function saveNote() {
    if (!dateKey) return;
    try {
      await setNote(deps, dateKey, note);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <BottomSheet open={open} title={dateKey ? longDateLabel(dateKey) : ''} onClose={onClose}>
      {open && (
        <div className="detail">
          <div className="detail__scene"><MiniPlant status={status!} record={record} /></div>
          {status === 'plant' && record && (
            <p className="detail__line">{getSpecies(record.plantId).name} · {STAGE_LABEL[record.finalStage]}</p>
          )}
          {special && <p className="detail__line">✨ Cây đặc biệt: {special.name}</p>}
          {status === 'rest' && <p className="detail__line">💤 Ngày tiết kiệm năng lượng</p>}
          {status === 'missed' && <p className="detail__line muted">Hôm đó cây chưa được chăm sóc 🥀</p>}
          {status === 'today-pending' && <p className="detail__line muted">Cây hôm nay đang chờ bạn đó!</p>}
          {record && !record.isRestDay && record.todos.length > 0 && (
            <ul className="detail__todos">
              {record.todos.map((t) => (
                <li key={t.id} className={t.done ? 'is-done' : ''}>
                  <span aria-hidden="true">{t.done ? '✅' : '⬜'}</span> {t.text}
                </li>
              ))}
            </ul>
          )}
          {record && (
            <>
              <label className="detail__label" htmlFor="day-note">Ghi chú ngày này</label>
              <textarea id="day-note" className="textarea" value={note} onChange={(e) => { setNoteText(e.target.value); setSaved(false); }} />
              <div className="detail__row">
                {saved && <span className="muted">Đã lưu ✓</span>}
                <button type="button" className="btn btn--primary" onClick={saveNote}>Lưu ghi chú</button>
              </div>
            </>
          )}
          {error && <p role="alert" className="error">{error}</p>}
          {dateKey === todayKey && (
            <button type="button" className="btn" onClick={onGoToday}>Đi tới Hôm nay 🌱</button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
```

`src/components/BackgroundPicker.tsx`:
```tsx
import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { deleteSetting, getSetting, setSetting } from '../db/settings';
import { compressImage } from '../utils/image';

export function BackgroundPicker() {
  const deps = useDeps();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasBg = useLiveQuery(async () => (await getSetting(deps.db, 'calendarBg')) !== undefined, [deps.db]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setSetting(deps.db, 'calendarBg', await compressImage(file));
    } catch {
      setError('Không đọc được ảnh này, thử ảnh khác nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-picker">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} data-testid="bg-input" />
      <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Đang xử lý…' : '🖼️ Đổi ảnh nền lịch'}
      </button>
      {hasBg && (
        <button type="button" className="btn btn--ghost" onClick={() => deleteSetting(deps.db, 'calendarBg')}>Dùng nền mặc định</button>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 8: Implement CalendarScreen**

`src/screens/CalendarScreen.tsx` (replace the whole file):
```tsx
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { DayCell } from '../components/DayCell';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { WEEKDAY_SHORT, buildMonthGrid, dayCellStatus, monthLabel, shiftMonth } from '../domain/calendar';
import { dayKey, formatDate, parseDayKey } from '../domain/dayKey';
import { useCalendarBgUrl } from '../hooks/useCalendarBg';
import { useNow } from '../hooks/useNow';
import './calendar.css';

export function CalendarScreen() {
  const deps = useDeps();
  const nav = useNav();
  const now = useNow();
  const todayKey = dayKey(now);
  const today = parseDayKey(todayKey);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const from = formatDate(new Date(view.year, view.month, 1));
  const to = formatDate(new Date(view.year, view.month + 1, 0));
  const days = useLiveQuery(() => listDaysInRange(deps.db, from, to), [deps.db, from, to]) ?? [];
  const firstKey = useLiveQuery(() => firstDayKey(deps.db), [deps.db]) ?? null;
  const bgUrl = useCalendarBgUrl();

  const byKey = new Map(days.map((d) => [d.date, d]));
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const go = (delta: number) => {
    if (delta > 0 && isCurrentMonth) return;
    setView((v) => shiftMonth(v.year, v.month, delta));
  };
  const selectedStatus = selected ? dayCellStatus(selected, byKey.get(selected), todayKey, firstKey) : null;

  return (
    <section
      className="screen screen--calendar"
      style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
      data-has-bg={bgUrl ? 'true' : 'false'}
    >
      <header className="cal__head card">
        <button type="button" className="btn btn--round" aria-label="Tháng trước" onClick={() => go(-1)}>‹</button>
        <h1 className="screen__title" aria-live="polite">{monthLabel(view.year, view.month)}</h1>
        <button type="button" className="btn btn--round" aria-label="Tháng sau" onClick={() => go(1)} disabled={isCurrentMonth}>›</button>
      </header>

      <motion.div
        className="cal card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 60) go(-1);
          else if (info.offset.x < -60) go(1);
        }}
      >
        <div className="cal__weekdays" aria-hidden="true">
          {WEEKDAY_SHORT.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="cal__grid">
          {cells.map((c, i) =>
            c.key && c.day ? (
              <DayCell
                key={c.key}
                dateKey={c.key}
                day={c.day}
                status={dayCellStatus(c.key, byKey.get(c.key), todayKey, firstKey)}
                record={byKey.get(c.key)}
                isToday={c.key === todayKey}
                onSelect={() => setSelected(c.key)}
              />
            ) : (
              <span key={`pad-${i}`} className="cal__pad" />
            ),
          )}
        </div>
      </motion.div>

      <div className="cal__footer">
        <BackgroundPicker />
      </div>

      <DayDetailSheet
        dateKey={selected}
        todayKey={todayKey}
        status={selectedStatus}
        record={selected ? byKey.get(selected) : undefined}
        onClose={() => setSelected(null)}
        onGoToday={() => {
          setSelected(null);
          nav('today');
        }}
      />
    </section>
  );
}
```

`src/screens/calendar.css`:
```css
.screen--calendar {
  display: flex; flex-direction: column; gap: 12px;
  background: linear-gradient(180deg, var(--peach) 0%, var(--butter) 50%, var(--mint) 100%);
  background-size: cover; background-position: center;
}
.cal__head { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; }
.cal { padding: 10px 8px; touch-action: pan-y; background: rgba(255, 253, 251, 0.9); }
.cal__weekdays, .cal__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.cal__weekdays span { text-align: center; font-weight: 700; font-size: 0.8rem; color: var(--cocoa-soft); padding-bottom: 4px; }
.cal__cell {
  position: relative; aspect-ratio: 0.78; display: flex; flex-direction: column; align-items: center;
  padding: 2px 0 0; border: 2px solid transparent; border-radius: 14px; background: var(--cream); cursor: pointer;
}
.cal__cell:disabled { background: transparent; cursor: default; }
.cal__cell.is-today { border-color: var(--berry); background: var(--peach); }
.cal__cell--missed { background: #F4EFE6; }
.cal__cell--rest { background: var(--lavender); }
.cal__num { font-size: 0.72rem; font-weight: 700; line-height: 1; }
.cal__cell--future .cal__num, .cal__cell--before-start .cal__num { color: var(--cocoa-soft); opacity: 0.6; }
.cal__art { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; }
.mini-plant { width: 92%; height: auto; }
.cal__spark { position: absolute; top: 0; right: 2px; font-size: 0.7rem; }
.cal__note-dot { position: absolute; bottom: 4px; right: 5px; width: 6px; height: 6px; border-radius: 50%; background: var(--berry); }
.cal__pad { aspect-ratio: 0.78; }
.cal__footer { display: flex; justify-content: center; }
.bg-picker { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; }
.detail { display: flex; flex-direction: column; gap: 10px; }
.detail__scene { width: 120px; margin: 0 auto; }
.detail__line { margin: 0; text-align: center; font-weight: 600; }
.detail__todos { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.detail__todos li.is-done { color: var(--cocoa-soft); }
.detail__label { font-weight: 700; }
.detail__row { display: flex; justify-content: flex-end; align-items: center; gap: 10px; }
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx vitest run tests/unit/domain/calendar.test.ts tests/unit/screens/CalendarScreen.test.tsx`
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add src tests/unit
git commit -m "feat: add cute calendar with plant history, day details and custom background

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Templates screen

**Before writing CSS:** invoke the `frontend-design` skill (see Global Constraints).

**Files:**
- Create: `src/components/TemplateForm.tsx`, `src/components/ConfirmButton.tsx`, `src/screens/templates.css`
- Modify: `src/screens/TemplatesScreen.tsx` (replace stub)
- Test: `tests/unit/screens/TemplatesScreen.test.tsx`

**Interfaces:**
- Consumes: template service (Task 5), `ensureToday`, `addTodos` (Task 4), `useDeps` (Task 11), `useNav` (Task 1).
- Produces: `TemplatesScreen()`; `TemplateForm({ initialName?, initialItems?, onSave(name, items), onCancel })`; `ConfirmButton({ label, confirmLabel, onConfirm })` (reused in Task 15).

- [ ] **Step 1: Write the failing test**

`tests/unit/screens/TemplatesScreen.test.tsx`:
```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatesScreen } from '../../../src/screens/TemplatesScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';

async function createViaForm(user: ReturnType<typeof userEvent.setup>, name: string, items: string) {
  await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
  await user.type(screen.getByLabelText('Tên mẫu'), name);
  await user.type(screen.getByLabelText('Các việc (mỗi dòng một việc)'), items);
  await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
}

describe('TemplatesScreen', () => {
  it('tạo mẫu, đặt mặc định, chuyển mặc định sang mẫu khác', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await createViaForm(user, 'Buổi sáng', 'Tập thể dục{Enter}Ăn sáng');
    await createViaForm(user, 'Cuối tuần', 'Dọn nhà');
    expect(await screen.findByRole('heading', { name: 'Buổi sáng' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đặt làm mặc định: Buổi sáng' }));
    await waitFor(async () => expect((await deps.db.templates.toArray()).find((t) => t.isDefault)?.name).toBe('Buổi sáng'));
    await user.click(await screen.findByRole('button', { name: 'Đặt làm mặc định: Cuối tuần' }));
    await waitFor(async () => {
      const defaults = (await deps.db.templates.toArray()).filter((t) => t.isDefault);
      expect(defaults.map((t) => t.name)).toEqual(['Cuối tuần']);
    });
  });

  it('tên trống thì báo lỗi', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
    await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tên mẫu không được để trống');
  });

  it('thêm mẫu vào hôm nay', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await createViaForm(user, 'Buổi sáng', 'Tập thể dục{Enter}Ăn sáng');
    const card = (await screen.findByRole('heading', { name: 'Buổi sáng' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Thêm vào hôm nay' }));
    expect(await screen.findByText(/Đã thêm 2 việc vào hôm nay/)).toBeInTheDocument();
    expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => t.text)).toEqual(['Tập thể dục', 'Ăn sáng']);
  });

  it('xoá mẫu cần xác nhận', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await createViaForm(user, 'Tạm', 'x');
    const card = (await screen.findByRole('heading', { name: 'Tạm' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Xoá' }));
    await user.click(within(card).getByRole('button', { name: 'Chắc chắn xoá' }));
    await waitFor(async () => expect(await deps.db.templates.count()).toBe(0));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/screens/TemplatesScreen.test.tsx`
Expected: FAIL — no "＋ Mẫu mới" button in the stub.

- [ ] **Step 3: Implement**

`src/components/ConfirmButton.tsx`:
```tsx
import { useState } from 'react';

export function ConfirmButton({ label, confirmLabel, onConfirm, className = 'btn btn--ghost' }: {
  label: string; confirmLabel: string; onConfirm: () => void; className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  }
  return (
    <span className="confirm">
      <button type="button" className="btn btn--danger" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
      <button type="button" className="btn btn--ghost" onClick={() => setAsking(false)}>Thôi</button>
    </span>
  );
}
```

`src/components/TemplateForm.tsx`:
```tsx
import { useId, useState } from 'react';
import { parseItems } from '../domain/templateService';

export function TemplateForm({ initialName = '', initialItems = [], onSave, onCancel }: {
  initialName?: string; initialItems?: string[]; onSave: (name: string, items: string[]) => Promise<void>; onCancel: () => void;
}) {
  const id = useId();
  const [name, setName] = useState(initialName);
  const [itemsText, setItemsText] = useState(initialItems.join('\n'));
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="tpl-form card"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await onSave(name, parseItems(itemsText));
        } catch (err) {
          setError((err as Error).message);
        }
      }}
    >
      <label htmlFor={`${id}-name`}>Tên mẫu</label>
      <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      <label htmlFor={`${id}-items`}>Các việc (mỗi dòng một việc)</label>
      <textarea id={`${id}-items`} className="textarea" value={itemsText} onChange={(e) => setItemsText(e.target.value)} />
      {error && <p role="alert" className="error">{error}</p>}
      <div className="tpl-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Huỷ</button>
        <button type="submit" className="btn btn--primary">Lưu mẫu</button>
      </div>
    </form>
  );
}
```

`src/screens/TemplatesScreen.tsx` (replace the whole file):
```tsx
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { ConfirmButton } from '../components/ConfirmButton';
import { TemplateForm } from '../components/TemplateForm';
import { addTodos, ensureToday } from '../domain/dayService';
import { createTemplate, deleteTemplate, listTemplates, setDefaultTemplate, updateTemplate } from '../domain/templateService';
import type { Template } from '../domain/types';
import './templates.css';

export function TemplatesScreen() {
  const deps = useDeps();
  const nav = useNav();
  const templates = useLiveQuery(() => listTemplates(deps.db), [deps.db]) ?? [];
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nowMs = () => deps.now().getTime();

  async function applyToToday(t: Template) {
    try {
      const day = await ensureToday(deps);
      await addTodos(deps, day.date, t.items);
      setMessage(`Đã thêm ${t.items.length} việc vào hôm nay 🌱`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section className="screen screen--templates">
      <header className="screen__head">
        <h1 className="screen__title">Mẫu việc cần làm</h1>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>＋ Mẫu mới</button>
      </header>
      <p className="muted">Mẫu có ⭐ sẽ tự động lên danh sách mỗi sáng (từ 4 giờ).</p>
      {message && (
        <p role="status" className="toast">
          {message} <button type="button" className="link" onClick={() => nav('today')}>Xem</button>
        </p>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {editing === 'new' && (
        <TemplateForm
          onCancel={() => setEditing(null)}
          onSave={async (name, items) => {
            await createTemplate(deps.db, name, items, nowMs());
            setEditing(null);
          }}
        />
      )}
      {templates.length === 0 && editing !== 'new' && (
        <p className="empty card">Chưa có mẫu nào. Tạo một mẫu cho buổi sáng nhé ☀️</p>
      )}
      <ul className="tpl__list">
        {templates.map((t) => (
          <li key={t.id} className="card tpl">
            {editing === t.id ? (
              <TemplateForm
                initialName={t.name}
                initialItems={t.items}
                onCancel={() => setEditing(null)}
                onSave={async (name, items) => {
                  await updateTemplate(deps.db, t.id, { name, items }, nowMs());
                  setEditing(null);
                }}
              />
            ) : (
              <>
                <div className="tpl__head">
                  <button
                    type="button"
                    className={`tpl__star${t.isDefault ? ' is-on' : ''}`}
                    aria-pressed={t.isDefault}
                    aria-label={t.isDefault ? `Bỏ mặc định: ${t.name}` : `Đặt làm mặc định: ${t.name}`}
                    onClick={() => setDefaultTemplate(deps.db, t.isDefault ? null : t.id, nowMs())}
                  >
                    {t.isDefault ? '⭐' : '☆'}
                  </button>
                  <h2 className="tpl__name">{t.name}</h2>
                </div>
                <ul className="tpl__items">
                  {t.items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
                <div className="tpl__actions">
                  <button type="button" className="btn" onClick={() => applyToToday(t)}>Thêm vào hôm nay</button>
                  <button type="button" className="btn btn--ghost" onClick={() => setEditing(t.id)}>Sửa</button>
                  <ConfirmButton label="Xoá" confirmLabel="Chắc chắn xoá" onConfirm={() => deleteTemplate(deps.db, t.id)} />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

`src/screens/templates.css`:
```css
.screen--templates { display: flex; flex-direction: column; gap: 12px; }
.tpl__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.tpl__head { display: flex; align-items: center; gap: 8px; }
.tpl__name { font-family: var(--font-display); font-size: 1.2rem; margin: 0; }
.tpl__star { width: 40px; height: 40px; border: none; border-radius: 50%; background: var(--butter); font-size: 1.3rem; cursor: pointer; }
.tpl__star.is-on { background: #FFE58A; }
.tpl__items { margin: 8px 0; padding-left: 22px; }
.tpl__actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.tpl-form { display: flex; flex-direction: column; gap: 8px; }
.tpl-form label { font-weight: 700; }
.tpl-form__actions { display: flex; justify-content: flex-end; gap: 8px; }
.confirm { display: inline-flex; gap: 6px; }
.btn--danger { background: #FFC9D0; border-color: #C2415B; color: #8E2238; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/screens/TemplatesScreen.test.tsx`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit
git commit -m "feat: add todo templates screen with default template and apply-to-today

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Settings screen — backup, restore, background, install guide

**Before writing CSS:** invoke the `frontend-design` skill (see Global Constraints).

**Files:**
- Create: `src/screens/settings.css`
- Modify: `src/screens/SettingsScreen.tsx` (replace stub)
- Test: `tests/unit/screens/SettingsScreen.test.tsx`

**Interfaces:**
- Consumes: `createBackup`, `serializeBackup`, `backupFileName`, `parseBackup`, `restoreBackup`, `BackupFile`, `RestoreMode` (Task 6), `shareOrDownload` (Task 6), `getSetting`, `setSetting` (Task 3), `BackgroundPicker` (Task 13), `ConfirmButton` (Task 14), `useDeps` (Task 11).
- Produces: `SettingsScreen()`.

- [ ] **Step 1: Write the failing test**

`tests/unit/screens/SettingsScreen.test.tsx`:
```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SettingsScreen } from '../../../src/screens/SettingsScreen';
import { createBackup, serializeBackup } from '../../../src/db/backup';
import { getSetting } from '../../../src/db/settings';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDb, makeDeps, renderWithDeps } from '../helpers';

vi.mock('../../../src/db/share', () => ({ shareOrDownload: vi.fn().mockResolvedValue(undefined) }));

const jsonFile = (text: string) => new File([text], 'backup.json', { type: 'application/json' });

describe('SettingsScreen', () => {
  it('sao lưu thì ghi lại thời điểm sao lưu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(screen.getByRole('button', { name: '💾 Sao lưu dữ liệu' }));
    expect(await screen.findByText(/Đã tạo file chau-cay-backup-2026-10-02.json/)).toBeInTheDocument();
    expect(await getSetting(deps.db, 'lastBackupAt')).toBe(deps.now().getTime());
  });

  it('file hỏng: báo lỗi, dữ liệu giữ nguyên', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01', note: 'giữ' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile('not json'));
    expect(await screen.findByRole('alert')).toHaveTextContent('File không phải JSON hợp lệ.');
    expect((await deps.db.days.get('2026-10-01'))!.note).toBe('giữ');
  });

  it('khôi phục gộp từ file hợp lệ', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-09-01', note: 'từ file', updatedAt: 5 }));
    const text = serializeBackup(await createBackup(src, 1));
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01', note: 'ở máy' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile(text));
    expect(await screen.findByText(/1 ngày · 0 mẫu/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gộp với dữ liệu hiện tại' }));
    expect(await screen.findByText(/Đã khôi phục 1 ngày và 0 mẫu/)).toBeInTheDocument();
    await waitFor(async () => expect(await deps.db.days.count()).toBe(2));
  });

  it('thay thế cần xác nhận', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-09-01' }));
    const text = serializeBackup(await createBackup(src, 1));
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile(text));
    await user.click(await screen.findByRole('button', { name: 'Thay thế toàn bộ' }));
    await user.click(screen.getByRole('button', { name: 'Chắc chắn thay thế' }));
    await waitFor(async () => expect((await deps.db.days.toArray()).map((d) => d.date)).toEqual(['2026-09-01']));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/screens/SettingsScreen.test.tsx`
Expected: FAIL — the stub has no backup button.

- [ ] **Step 3: Implement**

`src/screens/SettingsScreen.tsx` (replace the whole file):
```tsx
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { ConfirmButton } from '../components/ConfirmButton';
import {
  backupFileName, createBackup, parseBackup, restoreBackup, serializeBackup, type BackupFile, type RestoreMode,
} from '../db/backup';
import { getSetting, setSetting } from '../db/settings';
import { shareOrDownload } from '../db/share';
import './settings.css';

const formatDateTime = (ms: number) =>
  new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function SettingsScreen() {
  const deps = useDeps();
  const lastBackupAt = useLiveQuery(() => getSetting(deps.db, 'lastBackupAt'), [deps.db]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  async function doBackup() {
    setError(null);
    setStatus(null);
    try {
      const now = deps.now();
      const name = backupFileName(now);
      const file = new File([serializeBackup(await createBackup(deps.db, now.getTime()))], name, { type: 'application/json' });
      await shareOrDownload(file);
      await setSetting(deps.db, 'lastBackupAt', now.getTime());
      setStatus(`Đã tạo file ${name} ✓ Nhớ lưu vào Tệp hoặc iCloud Drive nhé.`);
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setError(`Không sao lưu được: ${(e as Error).message}`);
    }
  }

  async function onRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus(null);
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setPending(null);
      setError(result.error);
      return;
    }
    setError(null);
    setPending(result.backup);
  }

  async function doRestore(mode: RestoreMode) {
    if (!pending) return;
    try {
      const res = await restoreBackup(deps.db, pending, mode);
      setPending(null);
      setStatus(`Đã khôi phục ${res.days} ngày và ${res.templates} mẫu ✓`);
    } catch (e) {
      setError(`Khôi phục thất bại, dữ liệu hiện tại vẫn được giữ nguyên. ${(e as Error).message}`);
    }
  }

  return (
    <section className="screen screen--settings">
      <h1 className="screen__title">Cài đặt</h1>
      {status && <p role="status" className="toast">{status}</p>}
      {error && <p role="alert" className="error">{error}</p>}

      <div className="card settings__section">
        <h2>Sao lưu & khôi phục</h2>
        <p className="muted">
          {lastBackupAt ? `Lần sao lưu gần nhất: ${formatDateTime(lastBackupAt)}` : 'Bạn chưa sao lưu lần nào.'}
        </p>
        <button type="button" className="btn btn--primary" onClick={doBackup}>💾 Sao lưu dữ liệu</button>
        <label className="btn">
          📂 Khôi phục từ file
          <input type="file" accept="application/json,.json" hidden onChange={onRestoreFile} data-testid="restore-input" />
        </label>
        {pending && (
          <div className="settings__preview">
            <p>
              File sao lưu ngày {formatDateTime(pending.exportedAt)}: {pending.days.length} ngày · {pending.templates.length} mẫu
              {pending.calendarBg ? ' · có ảnh nền' : ''}
            </p>
            <div className="settings__row">
              <button type="button" className="btn btn--primary" onClick={() => doRestore('merge')}>Gộp với dữ liệu hiện tại</button>
              <ConfirmButton
                label="Thay thế toàn bộ"
                confirmLabel="Chắc chắn thay thế"
                className="btn"
                onConfirm={() => doRestore('replace')}
              />
              <button type="button" className="btn btn--ghost" onClick={() => setPending(null)}>Huỷ</button>
            </div>
          </div>
        )}
      </div>

      <div className="card settings__section">
        <h2>Ảnh nền lịch</h2>
        <BackgroundPicker />
      </div>

      <div className="card settings__section">
        <h2>Cài app lên màn hình chính</h2>
        <ol className="settings__steps">
          <li>Mở trang này bằng <b>Safari</b> trên iPhone.</li>
          <li>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên).</li>
          <li>Chọn <b>Thêm vào MH chính</b> → <b>Thêm</b>.</li>
          <li>Từ giờ mở app bằng biểu tượng chậu cây — dùng được cả khi không có mạng.</li>
        </ol>
        <p className="muted">
          {persisted === true && 'Dữ liệu đang được lưu bền vững trên máy 🌱'}
          {persisted === false && 'Hãy cài app lên màn hình chính để dữ liệu không bị Safari tự xoá.'}
        </p>
      </div>
    </section>
  );
}
```

`src/screens/settings.css`:
```css
.screen--settings { display: flex; flex-direction: column; gap: 12px; }
.settings__section { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.settings__section h2 { font-family: var(--font-display); font-size: 1.2rem; margin: 0; }
.settings__preview { width: 100%; background: var(--butter); border-radius: var(--radius-md); padding: 12px; }
.settings__preview p { margin: 0 0 8px; font-weight: 600; }
.settings__row { display: flex; flex-wrap: wrap; gap: 8px; }
.settings__steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 4px; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/screens/SettingsScreen.test.tsx`
Expected: all pass.

- [ ] **Step 5: Run the full unit suite and type-check**

Run: `npm test && npx tsc --noEmit`
Expected: all unit tests pass, with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src tests/unit
git commit -m "feat: add settings with backup, validated restore, background and install guide

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: End-to-end tests on iPhone 13, offline check, deploy pipeline

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/app.spec.ts`, `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Consumes: the whole app; relies on the `data-testid`s and labels defined above (`plant-scene`, `speech-bubble`, `rest-message`, `day-YYYY-MM-DD` + `data-status`, `Thêm việc cần làm`, `Hoàn thành: …`, `Ngày tiết kiệm năng lượng`, `＋ Mẫu mới`, `Tên mẫu`, `Các việc (mỗi dòng một việc)`, `Lưu mẫu`, `Đặt làm mặc định: …`).
- Produces: `npm run e2e`; a GitHub Pages deploy workflow.

- [ ] **Step 1: Install browsers and write the config**

Run: `npx playwright install webkit chromium`

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
});
```

- [ ] **Step 2: Write the E2E tests**

`tests/e2e/app.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

async function openToday(page: Page) {
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  await expect(page.getByTestId('plant-scene')).toBeVisible();
}

async function addTodo(page: Page, text: string) {
  await page.getByLabel('Thêm việc cần làm').fill(text);
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: `Hoàn thành: ${text}` })).toBeVisible();
}

test('tick việc làm cây lớn và dữ liệu còn sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Uống nước');
  await addTodo(page, 'Đọc sách');
  const scene = page.getByTestId('plant-scene');
  await expect(scene).toHaveAttribute('data-stage', 'seed');
  await page.getByRole('checkbox', { name: 'Hoàn thành: Uống nước' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'bud');
  await page.getByRole('checkbox', { name: 'Hoàn thành: Đọc sách' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'bloom');
  await page.reload();
  await openToday(page);
  await expect(page.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom');
});

test('sang ngày mới: mẫu mặc định tự lên và cây chào', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mẫu', exact: true }).click();
  await page.getByRole('button', { name: '＋ Mẫu mới' }).click();
  await page.getByLabel('Tên mẫu').fill('Buổi sáng');
  await page.getByLabel('Các việc (mỗi dòng một việc)').fill('Tập thể dục\nĂn sáng');
  await page.getByRole('button', { name: 'Lưu mẫu' }).click();
  await page.getByRole('button', { name: 'Đặt làm mặc định: Buổi sáng' }).click();
  await expect(page.getByRole('button', { name: 'Bỏ mặc định: Buổi sáng' })).toBeVisible();

  await page.clock.setFixedTime(at('2026-10-03T03:30:00'));
  await page.reload();
  // trước 4:00 vẫn là ngày 02 → không tự mở màn Hôm nay vì đã chào
  await expect(page.getByRole('button', { name: 'Lịch', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.clock.setFixedTime(at('2026-10-03T08:00:00'));
  await page.reload();
  await expect(page.getByTestId('speech-bubble')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Tập thể dục' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Ăn sáng' })).toBeVisible();
});

test('ngày tiết kiệm năng lượng hiện hạt ngủ trên lịch', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }).click();
  await expect(page.getByTestId('rest-message')).toBeVisible();
  await page.getByRole('button', { name: 'Lịch', exact: true }).click();
  await expect(page.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'rest');
});

test('ngày bỏ trống hiện cây héo, trước ngày đầu tiên để trống', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.clock.setFixedTime(at('2026-10-04T10:00:00'));
  await page.reload();
  await page.getByRole('button', { name: 'Lịch', exact: true }).click();
  await expect(page.getByTestId('day-2026-10-03')).toHaveAttribute('data-status', 'missed');
  await expect(page.getByTestId('day-2026-10-01')).toHaveAttribute('data-status', 'before-start');
});

test('mở được khi không có mạng', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker offline chỉ kiểm tra trên Chromium');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Điều hướng' })).toBeVisible();
  await context.setOffline(false);
});
```

- [ ] **Step 3: Run E2E**

Run: `npm run e2e`
Expected: all tests pass on `iphone-13` (WebKit) and `chromium-mobile`, with the offline test skipped on WebKit. If a selector fails because an element is covered by the fixed tab bar, add `await locator.scrollIntoViewIfNeeded()` before clicking. Do not change the app's labels.

- [ ] **Step 4: Write the deploy workflow and README**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: /${{ github.event.repository.name }}/
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`README.md`:
```markdown
# Chậu Cây Chibi 🌱

App todo nuôi cây chibi cho iPhone — chạy offline, không cần tài khoản, không cần App Store.

## Phát triển
- `npm install`
- `npm run dev`: chạy thử trên máy
- `npm test`: unit test
- `npm run e2e`: test giả lập iPhone 13

## Đưa lên iPhone
1. Đẩy code lên một repo GitHub, vào **Settings → Pages → Source: GitHub Actions**.
2. Mỗi lần push lên `main`, app được build và đăng tại `https://<tên-github>.github.io/<tên-repo>/`.
3. Trên iPhone: mở link bằng **Safari** → **Chia sẻ** → **Thêm vào MH chính**.
4. Nhớ thỉnh thoảng vào **Cài đặt → Sao lưu dữ liệu** và lưu file vào Tệp/iCloud.

## Thêm nội dung
- **Cây mới:** tạo `src/content/plants/<id>.tsx` (export `PlantSpecies`), rồi thêm vào `src/content/plants/registry.ts`.
- **Chậu mới:** thêm component vào `src/content/pots/pots.tsx` (hoặc dùng `{ image }`), rồi thêm 1 dòng vào `src/content/pots/registry.ts`.
- **Hiệu ứng đặc biệt mới:** thêm overlay vào `src/content/specials/specials.tsx`, rồi thêm 1 dòng vào `src/content/specials/registry.ts`.
- **Ảnh PNG thay cho SVG:** đặt file vào `public/plants/<id>/<stage>.png` (khung 200×240, mặt đất ở 2/3 chiều cao) và dùng `{ image: \`${import.meta.env.BASE_URL}plants/<id>/<stage>.png\` }`.
- Xem trước toàn bộ hình: render `src/dev/ArtGallery.tsx`.
```

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e .github README.md
git commit -m "test: add iPhone 13 E2E suite, offline check and GitHub Pages deploy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Hand off publishing to the user**

Creating the GitHub repo and pushing are outward-facing actions, so **ask the user before doing either**. Tell them the steps from the README: create the repo, push, enable Pages with the GitHub Actions source, then open the URL in Safari on the iPhone 13 and choose "Thêm vào MH chính". After that, do a final manual check on the real phone:
- turn on airplane mode and confirm the app still opens and works;
- pick a calendar background photo from the Photos library;
- make a backup to Files, then restore it with "Gộp".
