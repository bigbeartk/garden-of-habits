# Dáng cây mở khoá — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi loài cây có thêm 2 dáng (biến hình hẳn ở `bud`/`bloom`), khoá cho tới khi loài đó ra hoa đủ 10 / 20 ngày; chọn dáng trong bảng Đổi cây; dáng khoá không cho xem trước.

**Architecture:** Nội dung thêm `PlantSpecies.styles`, `getStageArt` chọn hình theo dáng (fallback về Gốc). Domain mới `styleUnlocks.ts` đếm ngày ra hoa theo loài, hợp với setting `unlockedStyles` (mở rồi giữ). `mutateDay` ghi mở khoá khi hôm nay ra hoa; `ensureToday` random dáng trong các dáng đã mở (chỉ gọi RNG khi có ≥ 2 lựa chọn). `DayRecord.styleId` lưu dáng của từng ngày; `PlantScene` vẽ theo nó. Bảng Đổi cây có màn dáng thay nội dung.

**Tech Stack:** React 18 + TS, Dexie (IndexedDB), zod, Vitest + jsdom + fake-indexeddb, Playwright (WebKit iPhone 13).

**Spec:** `docs/superpowers/specs/2026-10-05-plant-styles-design.md`

## Global Constraints

- Toàn bộ chữ giao diện tiếng Việt. Id dáng Gốc là `'base'`, tên hiển thị `Gốc`.
- Mốc mở khoá: dáng 2 = **10** ngày ra hoa, dáng 3 = **20** ngày ra hoa (đếm `finalStage === 'bloom'` và **không** phải ngày nghỉ).
- Không tăng phiên bản Dexie (`SCHEMA_VERSION` vẫn 4); sao lưu `schemaVersion` vẫn 4.
- `ensureToday` **không được** gọi `rng` thêm lần nào khi loài chỉ có dáng Gốc khả dụng (giữ chuỗi random cũ).
- Màn hình không gọi `db`/`Math.random`/`new Date()` trực tiếp, lấy qua `useDeps()`.
- Không bao giờ crash với id lạ: dáng lạ/đã xoá → Gốc.
- Dáng khoá: **không render `PlantScene` hay bất kỳ hình cây nào của dáng đó** trong DOM.
- Mọi hình vẽ: `viewBox 0 0 200 240`, mặt đất y = 160, tâm x = 100. Dáng mới phải khác dáng mọi loài khác và hai dáng còn lại của chính loài (bảng *Dáng* trong CLAUDE.md).
- TDD; WebKit E2E cho thay đổi giao diện; trước khi push chạy `TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run`. Nối lệnh bằng `&&`. Không pipe Playwright vào `head`.
- Commit kết thúc bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Ngày nghỉ có việc đã tick đủ** (`isRestDay` nhưng `finalStage === 'bloom'`): không được tính là ngày ra hoa, không mở khoá. Test ở Task 2 và Task 3.
2. **Hôm nay vừa chạm mốc rồi bỏ tick**: dáng vẫn mở, cây đang dùng dáng đó không bị đổi. Test ở Task 3.
3. **Dáng đã đủ mốc từ lịch sử cũ**: lần ra hoa tiếp theo ghi setting nhưng **không** bật khung mừng. Test ở Task 8.
4. **Bản ghi / file sao lưu có `styleId` lạ hoặc của loài khác** (vd. `corn` + `giant`): vẽ Gốc, không crash. Test ở Task 1 + Task 5.
5. **Chọn cặp cây đặc biệt** khi hôm nay đang dùng dáng khác Gốc: cùng loài thì giữ dáng, khác loài thì về Gốc. Test ở Task 7.

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/content/types.ts` (sửa) | `PlantStyle`, `StyleStage`, `PlantSpecies.styles` |
| `src/content/plants/styles.ts` (mới) | `getStyle`, `getStageArt`: chọn hình + mặt theo dáng |
| `src/content/catalog.ts` (sửa) | `CATALOG.plants[].styles` |
| `src/domain/types.ts` (sửa) | `BASE_STYLE_ID`, `DayRecord.styleId?`, `Catalog.plants[].styles?` |
| `src/domain/styleUnlocks.ts` (mới) | đếm ngày ra hoa, danh sách dáng đã mở, tiến độ, ghi mở khoá |
| `src/db/settings.ts` (sửa) | key `unlockedStyles` |
| `src/domain/dayService.ts` (sửa) | `mutateDay` mở khoá, `ensureToday` random dáng, `changePlant` nhận `styleId` |
| `src/db/backup.ts` (sửa) | `styleId` trong ngày, `unlockedStyles` trong file |
| `src/components/PlantScene.tsx` (sửa) | prop `styleId`, `data-style` |
| `src/components/MiniPlant.tsx`, `src/screens/TodayScreen.tsx` (sửa) | truyền `styleId` |
| `src/content/plants/sunflower.tsx` (+ 8 loài) | 2 dáng mỗi loài |
| `src/components/icons.tsx` (sửa) | `StylesIcon`, `LockIcon` |
| `src/components/LockedStyleArt.tsx` (mới) | ô dáng bí ẩn (chậu trống + `?` + ổ khoá) |
| `src/components/PlantPickerSheet.tsx` + `sheet.css` (sửa) | nút dáng, màn dáng |
| `src/screens/TodayScreen.tsx` + `today.css` (sửa) | khung mừng `style-unlock` |
| `src/dev/ArtGallery.tsx` (sửa) | ô cố định, có cả dáng |

---

### Task 1: Kiểu nội dung, `getStageArt`, catalog

**Files:**
- Modify: `src/content/types.ts`, `src/domain/types.ts`, `src/content/catalog.ts`
- Create: `src/content/plants/styles.ts`
- Test: `tests/unit/content/styles.test.tsx` (mới), `tests/unit/content/plants.test.tsx`, `tests/unit/helpers.tsx`

**Interfaces:**
- Produces:
  - `src/domain/types.ts`: `export const BASE_STYLE_ID = 'base';` · `DayRecord.styleId?: string` · `Catalog.plants: { id: string; defaultPotId: string; styles?: { id: string; unlockAt: number }[] }[]`
  - `src/content/types.ts`: `type StyleStage = 'bud' | 'bloom'` · `interface PlantStyle { id; name; unlockAt: number; stages: Record<StyleStage, Art>; faceAnchor: Record<StyleStage, FaceAnchor>; faceStyle?: FaceStyle }` · `PlantSpecies.styles?: PlantStyle[]`
  - `src/content/plants/styles.ts`: `BASE_STYLE_NAME = 'Gốc'` · `getStyle(species, styleId?: string | null): PlantStyle | null` · `getStageArt(species, styleId: string | null | undefined, stage: GrowthStage): { art: Art; faceAnchor: FaceAnchor; faceStyle?: FaceStyle }`
  - `tests/unit/helpers.tsx`: `TEST_CATALOG` sunflower có `styles: [{ id: 'mini', unlockAt: 10 }, { id: 'giant', unlockAt: 20 }]`

- [ ] **Step 1: Viết test đỏ** `tests/unit/content/styles.test.tsx`

```tsx
import type { PlantSpecies } from '../../../src/content/types';
import { getStageArt, getStyle } from '../../../src/content/plants/styles';

const art = (name: string) => ({ image: name });
const anchor = (y: number) => ({ x: 100, y, scale: 1 });
const SPECIES: PlantSpecies = {
  id: 'x', name: 'X', defaultPotId: 'terracotta', faceStyle: 'cool',
  stages: { seed: art('seed'), sprout: art('sprout'), bud: art('bud'), bloom: art('bloom') },
  faceAnchor: { seed: anchor(1), sprout: anchor(2), bud: anchor(3), bloom: anchor(4) },
  styles: [
    { id: 'tall', name: 'Cao', unlockAt: 10, stages: { bud: art('tall-bud'), bloom: art('tall-bloom') }, faceAnchor: { bud: anchor(30), bloom: anchor(40) } },
    { id: 'lady', name: 'Quý cô', unlockAt: 20, faceStyle: 'lady', stages: { bud: art('lady-bud'), bloom: art('lady-bloom') }, faceAnchor: { bud: anchor(31), bloom: anchor(41) } },
  ],
};

describe('getStageArt', () => {
  it('Gốc, null, undefined hay id lạ đều dùng hình gốc', () => {
    for (const id of ['base', null, undefined, 'khong-co']) {
      expect(getStageArt(SPECIES, id, 'bloom')).toEqual({ art: art('bloom'), faceAnchor: anchor(4), faceStyle: 'cool' });
    }
  });
  it('dáng mới chỉ đổi bud/bloom; seed/sprout luôn là gốc', () => {
    expect(getStageArt(SPECIES, 'tall', 'bud')).toEqual({ art: art('tall-bud'), faceAnchor: anchor(30), faceStyle: 'cool' });
    expect(getStageArt(SPECIES, 'tall', 'bloom').art).toEqual(art('tall-bloom'));
    expect(getStageArt(SPECIES, 'tall', 'seed').art).toEqual(art('seed'));
    expect(getStageArt(SPECIES, 'tall', 'sprout').faceAnchor).toEqual(anchor(2));
  });
  it('faceStyle riêng của dáng thắng faceStyle của loài', () => {
    expect(getStageArt(SPECIES, 'lady', 'bloom').faceStyle).toBe('lady');
  });
  it('getStyle trả null cho Gốc và id lạ', () => {
    expect(getStyle(SPECIES, 'base')).toBeNull();
    expect(getStyle(SPECIES, 'nope')).toBeNull();
    expect(getStyle(SPECIES, 'tall')?.name).toBe('Cao');
  });
});
```

Sửa test `CATALOG khớp với registry` trong `tests/unit/content/plants.test.tsx`:

```tsx
    expect(CATALOG.plants).toEqual(PLANTS.map((p) => ({
      id: p.id, defaultPotId: p.defaultPotId,
      styles: (p.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt })),
    })));
```

Và thêm vào `plants.test.tsx` (kiểm cho mọi loài đã có dáng):

```tsx
  it('loài có dáng thì đúng 2 dáng: id duy nhất, khác "base", mốc 10 rồi 20, đủ bud/bloom', () => {
    for (const p of PLANTS.filter((s) => s.styles)) {
      const styles = p.styles!;
      expect(styles.map((s) => s.unlockAt)).toEqual([10, 20]);
      expect(new Set(styles.map((s) => s.id)).size).toBe(2);
      for (const s of styles) {
        expect(s.id).not.toBe('base');
        expect(s.name.length).toBeGreaterThan(0);
        for (const stage of ['bud', 'bloom'] as const) {
          expect(s.faceAnchor[stage].scale).toBeGreaterThan(0);
          const { unmount } = render(<svg><ArtView art={s.stages[stage]} /></svg>);
          unmount();
        }
      }
    }
  });
```

- [ ] **Step 2: Chạy, thấy đỏ** — `npx vitest run tests/unit/content` → FAIL (`styles.ts` chưa có).

- [ ] **Step 3: Cài đặt**

`src/domain/types.ts`: thêm `export const BASE_STYLE_ID = 'base';`, trong `DayRecord` thêm `styleId?: string; // dáng cây của ngày; không có = 'base'`, và đổi `Catalog.plants` thành `{ id: string; defaultPotId: string; styles?: { id: string; unlockAt: number }[] }[]`.

`src/content/types.ts`:

```ts
/** Giai đoạn mà dáng mới vẽ lại; seed/sprout dùng chung bản Gốc. */
export type StyleStage = 'bud' | 'bloom';

/** Một dáng mở khoá của loài (biến hình hẳn ở bud/bloom). */
export interface PlantStyle {
  id: string;
  name: string;
  /** số ngày loài này ra hoa cần có để mở */
  unlockAt: number;
  stages: Record<StyleStage, Art>;
  faceAnchor: Record<StyleStage, FaceAnchor>;
  /** không có = theo loài */
  faceStyle?: FaceStyle;
}
```
và trong `PlantSpecies` thêm `/** 2 dáng mở khoá, theo thứ tự unlockAt (10, 20) */ styles?: PlantStyle[];`.

`src/content/plants/styles.ts`:

```ts
import type { FaceStyle } from '../Face';
import type { Art, FaceAnchor, PlantSpecies, PlantStyle } from '../types';
import type { GrowthStage } from '../../domain/growth';

export const BASE_STYLE_NAME = 'Gốc';

/** Dáng có id này của loài; Gốc hoặc id lạ → null. */
export function getStyle(species: PlantSpecies, styleId?: string | null): PlantStyle | null {
  return species.styles?.find((s) => s.id === styleId) ?? null;
}

/** Hình + vị trí mặt + kiểu mặt cho một giai đoạn theo dáng; seed/sprout và dáng lạ dùng bản Gốc. */
export function getStageArt(species: PlantSpecies, styleId: string | null | undefined, stage: GrowthStage): { art: Art; faceAnchor: FaceAnchor; faceStyle?: FaceStyle } {
  const style = stage === 'bud' || stage === 'bloom' ? getStyle(species, styleId) : null;
  if (!style || (stage !== 'bud' && stage !== 'bloom')) {
    return { art: species.stages[stage], faceAnchor: species.faceAnchor[stage], faceStyle: species.faceStyle };
  }
  return { art: style.stages[stage], faceAnchor: style.faceAnchor[stage], faceStyle: style.faceStyle ?? species.faceStyle };
}
```

`src/content/catalog.ts`: `plants: PLANTS.map((p) => ({ id: p.id, defaultPotId: p.defaultPotId, styles: (p.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt })) })),`

`tests/unit/helpers.tsx`: sunflower trong `TEST_CATALOG` thành `{ id: 'sunflower', defaultPotId: 'terracotta', styles: [{ id: 'mini', unlockAt: 10 }, { id: 'giant', unlockAt: 20 }] }`.

- [ ] **Step 4: Chạy** `npx vitest run && npx tsc --noEmit` → PASS (toàn bộ, vì chưa ai dùng `styles`).

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat(styles): content types and getStageArt for unlockable plant styles"` (kèm dòng Co-Authored-By).

---

### Task 2: Domain `styleUnlocks`

**Files:**
- Create: `src/domain/styleUnlocks.ts`
- Modify: `src/db/settings.ts`
- Test: `tests/unit/domain/styleUnlocks.test.ts` (mới)

**Interfaces:**
- Consumes: `BASE_STYLE_ID`, `Catalog.plants[].styles` (Task 1)
- Produces:
  - `interface StylePair { plantId: string; styleId: string }` · `styleKey(p: StylePair): string` (`'plantId|styleId'`)
  - `bloomCounts(db: PlantDB): Promise<Map<string, number>>`
  - `listUnlockedStyles(deps: { db; catalog }): Promise<Set<string>>` (tập khoá, không chứa Gốc)
  - `availableStyles(deps, plantId): Promise<string[]>` (`['base', ...đã mở theo thứ tự nội dung]`)
  - `interface StyleProgress { bloomDays: number; styles: { id: string; unlockAt: number; unlocked: boolean }[] }` · `styleProgress(deps, plantId): Promise<StyleProgress>`
  - `unlockStylesFor(deps, plantId): Promise<string[]>` (khoá vừa ghi thêm; gọi trong transaction có `days` + `settings`)
  - `SettingsShape.unlockedStyles: string[]`

- [ ] **Step 1: Test đỏ** `tests/unit/domain/styleUnlocks.test.ts`

```ts
import { availableStyles, bloomCounts, listUnlockedStyles, styleProgress, unlockStylesFor } from '../../../src/domain/styleUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps } from '../helpers';

/** n ngày ra hoa của một loài, bắt đầu từ 2026-08-01 */
const blooms = (plantId: string, n: number, extra: Partial<Parameters<typeof makeDay>[0]> = {}) =>
  Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom', ...extra }));

describe('dáng cây mở khoá', () => {
  it('đếm ngày ra hoa theo loài, bỏ ngày chưa ra hoa và ngày nghỉ', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut([
      makeDay({ date: '2026-09-01', plantId: 'sunflower', finalStage: 'bloom' }),
      makeDay({ date: '2026-09-02', plantId: 'sunflower', finalStage: 'bud' }),
      makeDay({ date: '2026-09-03', plantId: 'sunflower', finalStage: 'bloom', isRestDay: true }),
      makeDay({ date: '2026-09-04', plantId: 'corn', finalStage: 'bloom', specialId: 'glow' }),
    ]);
    expect(Object.fromEntries(await bloomCounts(deps.db))).toEqual({ sunflower: 1, corn: 1 });
  });

  it('suy từ lịch sử: 10 ngày mở dáng 2, 20 ngày mở cả dáng 3', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms('sunflower', 9));
    expect([...(await listUnlockedStyles(deps))]).toEqual([]);
    expect(await availableStyles(deps, 'sunflower')).toEqual(['base']);
    await deps.db.days.put(makeDay({ date: '2026-09-10', plantId: 'sunflower', finalStage: 'bloom' }));
    expect([...(await listUnlockedStyles(deps))]).toEqual(['sunflower|mini']);
    await deps.db.days.bulkPut(blooms('sunflower', 20));
    expect(await availableStyles(deps, 'sunflower')).toEqual(['base', 'mini', 'giant']);
  });

  it('khoá trong setting vẫn tính dù số ngày tụt; bỏ khoá lạ', async () => {
    const { deps } = makeDeps();
    await setSetting(deps.db, 'unlockedStyles', ['sunflower|giant', 'corn|mini', 'banana|x', 'rác']);
    expect([...(await listUnlockedStyles(deps))]).toEqual(['sunflower|giant']);
    expect(await availableStyles(deps, 'sunflower')).toEqual(['base', 'giant']);
    expect(await availableStyles(deps, 'corn')).toEqual(['base']);
  });

  it('tiến độ của một loài', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    expect(await styleProgress(deps, 'sunflower')).toEqual({
      bloomDays: 12,
      styles: [{ id: 'mini', unlockAt: 10, unlocked: true }, { id: 'giant', unlockAt: 20, unlocked: false }],
    });
    expect(await styleProgress(deps, 'corn')).toEqual({ bloomDays: 0, styles: [] });
  });

  it('unlockStylesFor ghi khoá vừa đủ mốc, không trùng, trả về khoá mới', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms('sunflower', 10));
    expect(await unlockStylesFor(deps, 'sunflower')).toEqual(['sunflower|mini']);
    expect(await unlockStylesFor(deps, 'sunflower')).toEqual([]);
    expect(await getSetting(deps.db, 'unlockedStyles')).toEqual(['sunflower|mini']);
    expect(await unlockStylesFor(deps, 'corn')).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/domain/styleUnlocks.test.ts` → FAIL (module chưa có).

- [ ] **Step 3: Cài đặt**

`src/db/settings.ts`, trong `SettingsShape` thêm:
```ts
  /** dáng cây đã mở khoá (đủ ngày ra hoa), dạng 'plantId|styleId'; mở rồi giữ luôn */
  unlockedStyles: string[];
```

`src/domain/styleUnlocks.ts`:

```ts
import type { PlantDB } from '../db/db';
import { getSetting, setSetting } from '../db/settings';
import { BASE_STYLE_ID, type Catalog } from './types';

type Deps = { db: PlantDB; catalog: Catalog };

/** Một dáng cụ thể của một loài (vd. Hướng dương · Khổng lồ). */
export interface StylePair {
  plantId: string;
  styleId: string;
}

export const styleKey = (p: StylePair) => `${p.plantId}|${p.styleId}`;

/** Số ngày ra hoa của từng loài (ngày nghỉ không tính, kể cả khi đã tick đủ việc). */
export async function bloomCounts(db: PlantDB): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  await db.days.each((d) => {
    if (d.finalStage === 'bloom' && !d.isRestDay) counts.set(d.plantId, (counts.get(d.plantId) ?? 0) + 1);
  });
  return counts;
}

/**
 * Các dáng đã mở (không gồm Gốc): khoá đã lưu (`unlockedStyles`, mở rồi giữ)
 * cộng các dáng mà số ngày ra hoa hiện có đã đủ mốc (dữ liệu từ trước khi có tính năng).
 * Bỏ khoá của loài/dáng không còn trong nội dung; xếp theo thứ tự nội dung.
 */
export async function listUnlockedStyles({ db, catalog }: Deps): Promise<Set<string>> {
  const saved = new Set((await getSetting(db, 'unlockedStyles')) ?? []);
  const counts = await bloomCounts(db);
  const out = new Set<string>();
  for (const plant of catalog.plants) {
    for (const s of plant.styles ?? []) {
      const key = styleKey({ plantId: plant.id, styleId: s.id });
      if (saved.has(key) || (counts.get(plant.id) ?? 0) >= s.unlockAt) out.add(key);
    }
  }
  return out;
}

/** Dáng chọn được của một loài: Gốc trước, rồi các dáng đã mở theo thứ tự nội dung. */
export async function availableStyles(deps: Deps, plantId: string): Promise<string[]> {
  const unlocked = await listUnlockedStyles(deps);
  const plant = deps.catalog.plants.find((p) => p.id === plantId);
  return [BASE_STYLE_ID, ...(plant?.styles ?? []).map((s) => s.id).filter((id) => unlocked.has(styleKey({ plantId, styleId: id })))];
}

export interface StyleProgress {
  bloomDays: number;
  styles: { id: string; unlockAt: number; unlocked: boolean }[];
}

export async function styleProgress(deps: Deps, plantId: string): Promise<StyleProgress> {
  const unlocked = await listUnlockedStyles(deps);
  const plant = deps.catalog.plants.find((p) => p.id === plantId);
  return {
    bloomDays: (await bloomCounts(deps.db)).get(plantId) ?? 0,
    styles: (plant?.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt, unlocked: unlocked.has(styleKey({ plantId, styleId: s.id })) })),
  };
}

/** Lưu các dáng của loài vừa đủ mốc; gọi trong transaction có `days` + `settings`. Trả về khoá mới ghi. */
export async function unlockStylesFor({ db, catalog }: Deps, plantId: string): Promise<string[]> {
  const plant = catalog.plants.find((p) => p.id === plantId);
  if (!plant?.styles?.length) return [];
  const count = (await bloomCounts(db)).get(plantId) ?? 0;
  const saved = (await getSetting(db, 'unlockedStyles')) ?? [];
  const added = plant.styles
    .filter((s) => count >= s.unlockAt)
    .map((s) => styleKey({ plantId, styleId: s.id }))
    .filter((k) => !saved.includes(k));
  if (added.length) await setSetting(db, 'unlockedStyles', [...saved, ...added]);
  return added;
}
```

- [ ] **Step 4: Chạy** `npx vitest run tests/unit/domain && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit** `feat(styles): count bloom days and track unlocked plant styles`.

---

### Task 3: `dayService`: mở khoá khi ra hoa, random dáng ngày mới, `changePlant` nhận dáng

**Files:**
- Modify: `src/domain/dayService.ts`
- Test: `tests/unit/domain/styleUnlocks.test.ts` (thêm `describe`)

**Interfaces:**
- Consumes: `availableStyles`, `listUnlockedStyles`, `styleKey`, `unlockStylesFor` (Task 2); `BASE_STYLE_ID` (Task 1)
- Produces: `changePlant(deps, date, plantId, specialId: string | null = null, styleId: string = BASE_STYLE_ID): Promise<DayRecord>`. `ensureToday` ghi `styleId` vào mọi ngày mới. `mutateDay` chạy transaction trên `[db.days, db.settings]`.

- [ ] **Step 1: Test đỏ.** Thêm vào cuối `tests/unit/domain/styleUnlocks.test.ts` (gộp 2 dòng import này lên đầu file):

```ts
import { addTodo, changePlant, ensureToday, toggleTodo } from '../../../src/domain/dayService';
import { mulberry32 } from '../../../src/domain/random';

describe('dayService với dáng cây', () => {
  // makeDeps mặc định: hôm nay 2026-10-02 10:00
  const TODAY = '2026-10-02';

  it('ngày mới khi chưa mở dáng nào: styleId = base và RNG không bị gọi thêm', async () => {
    const { deps } = makeDeps();
    const day = await ensureToday(deps);
    expect(day.styleId).toBe('base');
    // RNG chỉ bị gọi 2 lần (loài + 10%), 3 lần nếu trúng đặc biệt: lần gọi kế tiếp phải trùng chuỗi chuẩn
    const used = day.specialId ? 3 : 2;
    const ref = mulberry32(42);
    for (let i = 0; i < used; i++) ref();
    expect(deps.rng()).toBe(ref());
  });

  it('ngày mới random trong các dáng đã mở của loài', async () => {
    const { deps } = makeDeps();
    await setSetting(deps.db, 'unlockedStyles', ['sunflower|mini', 'sunflower|giant']);
    const seq = [0, 0.5, 0.99]; // loài đầu (sunflower), không trúng 10%, dáng cuối
    deps.rng = () => seq.shift()!;
    const day = await ensureToday(deps);
    expect([day.plantId, day.specialId, day.styleId]).toEqual(['sunflower', null, 'giant']);
  });

  it('hôm nay ra hoa lần thứ 10 thì mở dáng 2; bỏ tick vẫn giữ', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms('sunflower', 9));
    deps.rng = () => 0; // sunflower + trúng đặc biệt cũng không sao
    await ensureToday(deps);
    const day = await addTodo(deps, TODAY, 'Uống nước');
    await toggleTodo(deps, TODAY, day.todos[0].id);
    expect(await getSetting(deps.db, 'unlockedStyles')).toEqual(['sunflower|mini']);
    await toggleTodo(deps, TODAY, day.todos[0].id);
    expect(await availableStyles(deps, 'sunflower')).toEqual(['base', 'mini']);
  });

  it('ngày nghỉ tick đủ việc không mở khoá', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms('sunflower', 9));
    deps.rng = () => 0;
    await ensureToday(deps);
    const day = await addTodo(deps, TODAY, 'Uống nước');
    await deps.db.days.update(TODAY, { isRestDay: true });
    await toggleTodo(deps, TODAY, day.todos[0].id);
    expect(await getSetting(deps.db, 'unlockedStyles')).toBeUndefined();
  });

  it('changePlant ghi dáng đã mở; từ chối dáng khoá hoặc không có', async () => {
    const { deps } = makeDeps();
    await ensureToday(deps);
    await expect(changePlant(deps, TODAY, 'sunflower', null, 'mini')).rejects.toThrow('Dáng cây này chưa mở khoá');
    await expect(changePlant(deps, TODAY, 'corn', null, 'mini')).rejects.toThrow();
    await setSetting(deps.db, 'unlockedStyles', ['sunflower|mini']);
    expect((await changePlant(deps, TODAY, 'sunflower', null, 'mini')).styleId).toBe('mini');
    expect((await changePlant(deps, TODAY, 'corn')).styleId).toBe('base');
  });
});
```

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/domain/styleUnlocks.test.ts` → FAIL (`styleId` undefined, không có mở khoá).

- [ ] **Step 3: Cài đặt** trong `src/domain/dayService.ts`:
  - import `pickUniform` (đã có), `BASE_STYLE_ID` từ `./types`, và `availableStyles, listUnlockedStyles, styleKey, unlockStylesFor` từ `./styleUnlocks`.
  - `ensureToday`: sau khi tạo `record` (sau `rollSpecial`, giữ đúng thứ tự gọi RNG cũ) và trước `db.days.add(record)`:
    ```ts
    // dáng: random trong các dáng đã mở; chỉ gọi RNG khi thật sự có lựa chọn để không lệch chuỗi random cũ
    const styles = await availableStyles(deps, record.plantId);
    record.styleId = styles.length > 1 ? pickUniform(styles, deps.rng) : BASE_STYLE_ID;
    ```
  - `mutateDay`: đổi `db.transaction('rw', db.days, …)` thành `db.transaction('rw', [db.days, db.settings], …)`; sau `await db.days.put(day);` thêm:
    ```ts
    // hôm nay vừa ra hoa: mở các dáng của loài vừa đủ mốc (lưu lại, bỏ tick sau đó vẫn giữ)
    if (date === today && !day.isRestDay && day.finalStage === 'bloom') await unlockStylesFor(deps, day.plantId);
    ```
  - `changePlant`: thêm tham số `styleId: string = BASE_STYLE_ID`; trước `mutateDay`:
    ```ts
    if (styleId !== BASE_STYLE_ID) {
      if (!next.styles?.some((s) => s.id === styleId)) throw new Error(`Không có dáng "${styleId}"`);
      if (!(await listUnlockedStyles(deps)).has(styleKey({ plantId, styleId }))) throw new Error('Dáng cây này chưa mở khoá');
    }
    ```
    và trong callback thêm `d.styleId = styleId;`.

- [ ] **Step 4: Chạy toàn bộ** `npx vitest run && npx tsc --noEmit` → PASS. Nếu test cũ nào so sánh nguyên bản ghi ngày mới bằng `toEqual` thì thêm `styleId: 'base'` vào giá trị mong đợi (không đổi logic test).

- [ ] **Step 5: Commit** `feat(styles): unlock styles on bloom, roll today's style, changePlant takes a style`.

---

### Task 4: Sao lưu `styleId` + `unlockedStyles`

**Files:**
- Modify: `src/db/backup.ts`
- Test: `tests/unit/db/backup.test.ts`

**Interfaces:**
- Consumes: `SettingsShape.unlockedStyles` (Task 2), `DayRecord.styleId` (Task 1)
- Produces: `BackupFile.unlockedStyles?: string[]`; `DaySchema.styleId` optional.

- [ ] **Step 1: Test đỏ.** Thêm cuối `tests/unit/db/backup.test.ts` (dùng các import đã có trong file: `makeDb`, `makeDay`, `setSetting`, `getSetting`, `createBackup`, `serializeBackup`, `parseBackup`, `restoreBackup`, `BACKUP_FORMAT`):

```ts
describe('sao lưu dáng cây', () => {
  it('khứ hồi styleId của ngày', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-09-01', styleId: 'giant' }));
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect((await dst.days.get('2026-09-01'))?.styleId).toBe('giant');
  });

  async function backupWith(keys: string[]) {
    const src = makeDb();
    await setSetting(src, 'unlockedStyles', keys);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    return r.backup;
  }

  it('thay thế: lấy đúng danh sách trong file (file không có thì xoá)', async () => {
    const dst = makeDb();
    await setSetting(dst, 'unlockedStyles', ['rose|dome']);
    await restoreBackup(dst, await backupWith(['sunflower|mini']), 'replace');
    expect(await getSetting(dst, 'unlockedStyles')).toEqual(['sunflower|mini']);
    await restoreBackup(dst, await createBackup(makeDb(), 1), 'replace');
    expect(await getSetting(dst, 'unlockedStyles')).toBeUndefined();
  });

  it('gộp: hợp hai danh sách, không trùng', async () => {
    const dst = makeDb();
    await setSetting(dst, 'unlockedStyles', ['rose|dome', 'sunflower|mini']);
    await restoreBackup(dst, await backupWith(['sunflower|mini', 'corn|popcorn']), 'merge');
    expect(await getSetting(dst, 'unlockedStyles')).toEqual(['rose|dome', 'sunflower|mini', 'corn|popcorn']);
  });

  it('file cũ không có styleId / unlockedStyles vẫn đọc được', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 4, exportedAt: 1, days: [makeDay({ date: '2026-09-01' })], templates: [], calendarBg: null }));
    expect(r.ok).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/db/backup.test.ts` → FAIL (zod bỏ `styleId`, setting không được sao lưu).

- [ ] **Step 3: Cài đặt** trong `src/db/backup.ts`, làm y như `unlockedSpecials`:
  - `DaySchema`: thêm `styleId: z.string().optional(), // dáng cây; file cũ chưa có`
  - `BackupSchema`: thêm `unlockedStyles: z.array(z.string()).optional(), // dáng cây đã mở khoá; file cũ chưa có`
  - `createBackup`: `const unlockedStyles = await getSetting(db, 'unlockedStyles');` và `...(unlockedStyles ? { unlockedStyles } : {}),`
  - `replace`: `if (backup.unlockedStyles) await setSetting(db, 'unlockedStyles', backup.unlockedStyles); else await deleteSetting(db, 'unlockedStyles');`
  - `merge`:
    ```ts
    if (backup.unlockedStyles) {
      const mine = (await getSetting(db, 'unlockedStyles')) ?? [];
      await setSetting(db, 'unlockedStyles', [...new Set([...mine, ...backup.unlockedStyles])]);
    }
    ```

- [ ] **Step 4: Chạy** `npx vitest run && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit** `feat(backup): include plant styles and unlocked styles`.

---

### Task 5: `PlantScene` vẽ theo dáng; truyền `styleId` từ bản ghi ngày

**Files:**
- Modify: `src/components/PlantScene.tsx`, `src/components/MiniPlant.tsx`, `src/screens/TodayScreen.tsx`
- Test: `tests/unit/components/PlantScene.test.tsx`

**Interfaces:**
- Consumes: `getStageArt`, `getStyle` (Task 1)
- Produces: `PlantSceneProps.styleId?: string | null`; thuộc tính `data-style` (luôn có, `'base'` khi Gốc hoặc dáng lạ).

- [ ] **Step 1: Test đỏ** trong `tests/unit/components/PlantScene.test.tsx`. Dùng loài giả để test không phụ thuộc hình vẽ thật: mock `getSpecies`.

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { PlantScene } from '../../../src/components/PlantScene';

vi.mock('../../../src/content/plants/registry', async (orig) => {
  const real = await orig<typeof import('../../../src/content/plants/registry')>();
  const Mark = (id: string) => () => <rect data-testid={`art-${id}`} />;
  const fake = {
    ...real.PLANTS[0], id: 'fake',
    stages: { seed: { svg: Mark('seed') }, sprout: { svg: Mark('sprout') }, bud: { svg: Mark('bud') }, bloom: { svg: Mark('bloom') } },
    styles: [{ id: 'tall', name: 'Cao', unlockAt: 10, stages: { bud: { svg: Mark('tall-bud') }, bloom: { svg: Mark('tall-bloom') } }, faceAnchor: { bud: { x: 1, y: 1, scale: 1 }, bloom: { x: 1, y: 1, scale: 1 } } }],
  };
  return { ...real, getSpecies: (id: string) => (id === 'fake' ? fake : real.getSpecies(id)) };
});

describe('PlantScene với dáng', () => {
  it('vẽ hình của dáng và ghi data-style', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="bloom" specialId={null} styleId="tall" mood="smile" />);
    expect(screen.getByTestId('art-tall-bloom')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-style', 'tall');
  });
  it('dáng lạ hoặc không có → Gốc', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="bloom" specialId={null} styleId="nope" mood="smile" />);
    expect(screen.getByTestId('art-bloom')).toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-style', 'base');
  });
  it('seed/sprout luôn hình Gốc', () => {
    render(<PlantScene plantId="fake" potId="terracotta" stage="sprout" specialId={null} styleId="tall" mood="smile" />);
    expect(screen.getByTestId('art-sprout')).toBeInTheDocument();
  });
});
```
(Nếu file test hiện có đã import khác, đặt khối này vào file mới `tests/unit/components/PlantSceneStyle.test.tsx` để `vi.mock` không ảnh hưởng test cũ.)

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/components` → FAIL.

- [ ] **Step 3: Cài đặt**
  - `PlantScene.tsx`: thêm `styleId?: string | null;` vào props; import `getStageArt, getStyle` từ `../content/plants/styles` và `BASE_STYLE_ID` từ `../domain/types`. Trong thân:
    ```tsx
    const look = getStageArt(species, styleId, stage);
    ```
    thêm `data-style={getStyle(species, styleId)?.id ?? BASE_STYLE_ID}` lên `<svg>`, và thay
    ```tsx
    <ArtView art={look.art} />
    <Face mood={mood} faceStyle={look.faceStyle} {...look.faceAnchor} />
    ```
  - `MiniPlant.tsx`: nhánh `status === 'plant'` thêm `styleId={record.styleId}`.
  - `TodayScreen.tsx`: `<PlantScene … styleId={day.styleId} …>`.

- [ ] **Step 4: Chạy** `npx vitest run && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit** `feat(styles): PlantScene draws the day's style`.

---

### Task 6: Hai dáng Hướng dương (Mini, Khổng lồ) + ArtGallery

**Files:**
- Modify: `src/content/plants/sunflower.tsx`, `src/dev/ArtGallery.tsx`
- Test: `tests/unit/screens/TodayScreen.test.tsx` (test ở Task 5 đã ghi chú)

**Interfaces:**
- Consumes: `PlantStyle` (Task 1)
- Produces: `sunflower.styles = [mini (10), giant (20)]` — id đúng như `TEST_CATALOG`.

- [ ] **Step 1: Test đỏ:** thêm vào `tests/unit/screens/TodayScreen.test.tsx`:

```tsx
  it('cây hôm nay vẽ theo dáng đã lưu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', plantId: 'sunflower', finalStage: 'bloom', styleId: 'giant', greetedAt: 1, speech: '' }));
    renderWithDeps(<TodayScreen />, deps);
    expect(await screen.findByTestId('plant-scene')).toHaveAttribute('data-style', 'giant');
  });
```
Chạy `npx vitest run tests/unit/screens/TodayScreen.test.tsx` → FAIL (`data-style` = `base`).

- [ ] **Step 2: Vẽ** trong `sunflower.tsx`, cùng bảng màu (`LEAF`, `STEM`, cánh `#FFD86B`, nhị `#B5835A`, viền `INK` 1.5–2px):
  - `mini` **Mini**: bụi thấp, thân ngắn chia 4–5 nhánh xoè hình quạt, mỗi nhánh một bông nhỏ (r nhị ~9, 10 cánh) màu **cam đỏ** (`#FF9A5C`, nhị `#8A5A3C`); bông giữa to nhất (nhị r ~13) mang mặt. Đỉnh cụm ở y ≈ 70, rộng x 40–160. `bud`: cùng bụi, các bông là nụ xanh tròn nhỏ có viền cánh hé.
  - `giant` **Khổng lồ**: thân rất cao cong như dấu hỏi (đi lên tới y ≈ 22 rồi cong sang phải), bông to (nhị r ~28, 16 cánh) **cúi chào** nghiêng ~25° ở bên phải trên (tâm ≈ (128, 62)), lá to ở gốc và giữa thân. `bud`: thân cong, nụ to xanh cúi xuống.
  - Thêm `styles: [{ id: 'mini', name: 'Mini', unlockAt: 10, … }, { id: 'giant', name: 'Khổng lồ', unlockAt: 20, … }]` với `faceAnchor` đặt lên bông/nụ mang mặt (vd. mini bloom `{ x: 100, y: 84, scale: 0.5 }`, giant bloom `{ x: 128, y: 62, scale: 0.85 }`; chỉnh theo hình).
- `ArtGallery.tsx`: đổi lưới thành ô cố định `gridTemplateColumns: 'repeat(4, 120px)'`, mỗi `<svg>` `width={120} height={144}`. Thêm sau mỗi loài một hàng cho từng dáng (`bud`, `bloom`) bằng `getStageArt(p, s.id, stage)`, chú thích `p.name · s.name`.

- [ ] **Step 3: Chạy** `npx vitest run && npx tsc --noEmit` → PASS (gồm test `plants.test.tsx` kiểm 2 dáng của Hướng dương).

- [ ] **Step 4: Soát hình WebKit.** Tạm cho `main.tsx` render `<ArtGallery />` (theo ghi chú trong CLAUDE.md), `npm run dev`, chụp WebKit 390×844 bằng Playwright script trong scratchpad, xem ảnh: Mini/Khổng lồ khác hẳn Gốc và mọi loài khác, mặt nằm trên bông chính. **Hoàn tác `main.tsx`** trước commit.

- [ ] **Step 5: Commit** `feat(sunflower): Mini and Giant unlockable styles`.

---

### Task 7: Bảng Đổi cây: nút dáng + màn dáng + ô khoá

**Files:**
- Modify: `src/components/icons.tsx`, `src/components/PlantPickerSheet.tsx`, `src/components/sheet.css`, `src/screens/TodayScreen.tsx`
- Create: `src/components/LockedStyleArt.tsx`
- Test: `tests/unit/components/PlantPickerSheet.test.tsx` (mới)

**Interfaces:**
- Consumes: `styleProgress`, `listUnlockedStyles`, `styleKey` (Task 2); `getStyle`, `BASE_STYLE_NAME` (Task 1); `changePlant(…, styleId)` (Task 3); `PlantScene.styleId` (Task 5); sunflower styles (Task 6)
- Produces:
  - `PlantPickerSheet` props: `{ open; currentId; currentSpecialId; currentStyleId: string; onClose; onPick: (plantId: string, specialId: string | null, styleId: string) => void }`
  - `StylesIcon`, `LockIcon` (`data-icon` `styles` / `lock`)
  - `LockedStyleArt` (SVG 200×240, `data-testid="locked-style-art"`)

- [ ] **Step 1: Test đỏ** `tests/unit/components/PlantPickerSheet.test.tsx`:

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PlantPickerSheet } from '../../../src/components/PlantPickerSheet';
import { CATALOG } from '../../../src/content/catalog';
import { handleBack } from '../../../src/app/back';
import { setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

const blooms = (plantId: string, n: number) =>
  Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom' }));

function setup(current = { id: 'sunflower', special: null as string | null, style: 'base' }) {
  const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const onPick = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  const ui = () => renderWithDeps(
    <PlantPickerSheet open currentId={current.id} currentSpecialId={current.special} currentStyleId={current.style} onClose={onClose} onPick={onPick} />, deps);
  return { deps, onPick, onClose, user, ui };
}

describe('PlantPickerSheet: dáng cây', () => {
  it('chỉ loài có dáng mới có nút dáng, ghi số dáng đã mở', async () => {
    const { deps, ui } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    expect(await screen.findByRole('button', { name: 'Dáng cây: Hướng dương (2/3)' })).toBeInTheDocument();
    // loài chưa có dáng (chưa vẽ) thì không có nút: số nút = số loài có styles
    expect(screen.getAllByRole('button', { name: /^Dáng cây:/ })).toHaveLength(CATALOG.plants.filter((p) => p.styles?.length).length);
  });

  it('màn dáng: dáng đã mở có hình và chọn được; dáng khoá không có hình cây', async () => {
    const { deps, ui, user, onPick } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    expect(await screen.findByRole('heading', { name: 'Dáng của Hướng dương' })).toBeInTheDocument();
    expect(screen.getByText('Đã ra hoa 12 ngày')).toBeInTheDocument();
    expect(screen.getByText('12/20')).toBeInTheDocument();
    const locked = screen.getByTestId('style-giant');
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(within(locked).queryByTestId('picker-scene')).toBeNull();
    expect(within(locked).getByTestId('locked-style-art')).toBeInTheDocument();
    expect(locked).toHaveTextContent('Dáng bí ẩn');
    expect(locked).toHaveTextContent('Ra hoa 20 ngày để mở');
    expect(locked).not.toHaveTextContent('Khổng lồ');
    await user.click(locked);
    expect(onPick).not.toHaveBeenCalled();
    const mini = screen.getByTestId('style-mini');
    expect(within(mini).getByTestId('picker-scene')).toHaveAttribute('data-style', 'mini');
    await user.click(mini);
    expect(onPick).toHaveBeenCalledWith('sunflower', null, 'mini');
  });

  it('nút Quay lại chọn cây và nút Back của Android về lưới loài', async () => {
    const { ui, user, onClose } = setup();
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    await user.click(screen.getByRole('button', { name: 'Quay lại chọn cây' }));
    expect(await screen.findByRole('button', { name: 'Hướng dương' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    await screen.findByRole('heading', { name: 'Dáng của Hướng dương' });
    handleBack();
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Dáng của Hướng dương' })).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('chọn loài ở lưới = dáng Gốc; chọn cặp đặc biệt giữ dáng nếu cùng loài', async () => {
    const { deps, ui, user, onPick } = setup({ id: 'sunflower', special: null, style: 'mini' });
    await setSetting(deps.db, 'unlockedSpecials', ['sunflower|glow', 'corn|glow']);
    ui();
    await user.click(await screen.findByRole('button', { name: 'Ngô' }));
    expect(onPick).toHaveBeenLastCalledWith('corn', null, 'base');
    await user.click(await screen.findByRole('button', { name: 'Hướng dương · Phát sáng' }));
    expect(onPick).toHaveBeenLastCalledWith('sunflower', 'glow', 'mini');
    await user.click(screen.getByRole('button', { name: 'Ngô · Phát sáng' }));
    expect(onPick).toHaveBeenLastCalledWith('corn', 'glow', 'base');
  });

  it('đang dùng dáng khác Gốc thì nút dáng của loài đó có chấm', async () => {
    const { ui } = setup({ id: 'sunflower', special: null, style: 'mini' });
    ui();
    const btn = await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ });
    expect(btn.querySelector('.icon-btn__badge')).not.toBeNull();
  });
});
```
Ghi chú: trong test thứ nhất bỏ vòng `for` nếu mọi loài đều đã có dáng (sau đợt 2); thay bằng kiểm `screen.getAllByRole('button', { name: /^Dáng cây:/ })` có độ dài bằng số loài có `styles`.

- [ ] **Step 2: Chạy** `npx vitest run tests/unit/components/PlantPickerSheet.test.tsx` → FAIL.

- [ ] **Step 3: Cài đặt**

`icons.tsx`: thêm theo đúng phong cách (khung 32, `STROKE`, pastel):
```tsx
/** Ba chiếc lá xoè quạt: đổi dáng cây */
export function StylesIcon({ size }: { size?: number }) {
  return (
    <Svg name="styles" size={size}>
      <path d="M16 27 C10 22 7 15 9 7 C14 10 17 17 16 27 Z" fill="#CDEFE3" {...STROKE} />
      <path d="M16 27 C22 22 25 15 23 7 C18 10 15 17 16 27 Z" fill="#FFD6DE" {...STROKE} />
      <path d="M16 27 C14 19 14 11 16 4 C18 11 18 19 16 27 Z" fill="#FFF1C1" {...STROKE} />
    </Svg>
  );
}

/** Ổ khoá: dáng chưa mở */
export function LockIcon({ size }: { size?: number }) {
  return (
    <Svg name="lock" size={size}>
      <path d="M10 14 V10 a6 6 0 0 1 12 0 V14" fill="none" {...STROKE} />
      <rect x={7} y={14} width={18} height={14} rx={4} fill="#FFF1C1" {...STROKE} />
      <circle cx={16} cy={21} r={2} fill={INK} />
    </Svg>
  );
}
```

`LockedStyleArt.tsx`:
```tsx
import { ArtView } from '../content/ArtView';
import { getPot } from '../content/pots/registry';
import { LockIcon } from './icons';

/** Ô dáng chưa mở: chậu đất nung trống + dấu ? lớn + ổ khoá. Cố ý không vẽ gì của cây để giữ bí mật. */
export function LockedStyleArt() {
  return (
    <svg viewBox="0 0 200 240" className="picker__scene" data-testid="locked-style-art" aria-hidden="true">
      <ArtView art={getPot('terracotta').art} />
      <text x={100} y={120} textAnchor="middle" fontSize={96} fontWeight={800} fill="#E3D9FF" stroke="#5B4636" strokeWidth={3} fontFamily="'Baloo 2', sans-serif">?</text>
      <g transform="translate(128 118) scale(1.6)"><LockIcon size={32} /></g>
    </svg>
  );
}
```
(`LockIcon` trả `<svg>` lồng trong `<svg>` hợp lệ; nếu WebKit hiển thị sai thì vẽ khoá trực tiếp bằng `path`/`rect` như trên.)

`PlantPickerSheet.tsx` — viết lại:
  - state `const [styleFor, setStyleFor] = useState<string | null>(null);` reset về `null` khi `open` thành `false` (`useEffect`).
  - `useBackHandler(open && styleFor !== null, () => setStyleFor(null), 'sheet');` (đăng ký sau bảng nên thắng cùng lớp).
  - `unlocked = useLiveQuery(() => listUnlockedStyles(deps), [deps])`, `progress = useLiveQuery(() => styleFor ? styleProgress(deps, styleFor) : undefined, [deps, styleFor])`.
  - Tiêu đề bảng: `styleFor ? \`Dáng của ${getSpecies(styleFor).name}\` : 'Chọn cây hôm nay'`.
  - **Lưới loài**: mỗi loài `<div className="picker__cell">` gồm nút chọn loài cũ (`onPick(p.id, null, 'base')`, `selected = p.id === currentId && !currentSpecialId && currentStyleId === 'base'`) và nếu `p.styles?.length`:
    ```tsx
    <button type="button" className="picker__style-btn" aria-label={`Dáng cây: ${p.name} (${count}/3)`} onClick={() => setStyleFor(p.id)}>
      <StylesIcon size={20} />
      <span className="picker__style-count">{count}/3</span>
      {p.id === currentId && currentStyleId !== 'base' && <span className="icon-btn__badge" />}
    </button>
    ```
    với `count = 1 + p.styles.filter((s) => unlocked?.has(styleKey({ plantId: p.id, styleId: s.id }))).length`.
  - **Cặp đặc biệt**: `onPick(plantId, specialId, plantId === currentId ? currentStyleId : 'base')`.
  - **Màn dáng** (khi `styleFor`): `<BackButton inline label="Quay lại chọn cây" onClick={() => setStyleFor(null)} />`, rồi:
    ```tsx
    <p className="picker__progress">🌸 <span>Đã ra hoa {progress.bloomDays} ngày</span></p>
    {next ? (
      <div className="picker__bar" role="progressbar" aria-valuemin={0} aria-valuemax={next.unlockAt} aria-valuenow={Math.min(progress.bloomDays, next.unlockAt)}>
        <div className="picker__bar-fill" style={{ width: `${Math.min(100, (progress.bloomDays / next.unlockAt) * 100)}%` }} />
        <span className="picker__bar-label">{progress.bloomDays}/{next.unlockAt}</span>
      </div>
    ) : <p className="picker__progress">Đã mở hết dáng!</p>}
    ```
    (`next = progress.styles.find((s) => !s.unlocked)`), và lưới `.picker` gồm ô Gốc (`data-testid="style-base"`, `PlantScene` bloom `styleId="base"`, tên `Gốc`) + mỗi dáng:
    - mở: `<button data-testid={\`style-${s.id}\`} className="picker__item" aria-pressed={plantId === currentId && currentStyleId === s.id} onClick={() => onPick(styleFor, null, s.id)}>` + `PlantScene` (`testId="picker-scene"`, `styleId={s.id}`, `stage="bloom"`, chậu mặc định) + tên dáng.
    - khoá: `<button data-testid={\`style-${s.id}\`} className="picker__item is-locked" aria-disabled="true" aria-label={\`Dáng bí ẩn, ra hoa ${s.unlockAt} ngày để mở\`} onClick={() => {}}>` + `<LockedStyleArt />` + `<span>Dáng bí ẩn</span>` + `<span className="picker__effect">Ra hoa {s.unlockAt} ngày để mở</span>`.
  - Lấy tên dáng từ nội dung: `getStyle(getSpecies(styleFor), s.id)!.name`.

`sheet.css`:
```css
.picker__cell { position: relative; display: flex; }
.picker__cell > .picker__item { flex: 1; }
.picker__style-btn {
  position: absolute; top: 4px; right: 4px; width: 30px; height: 30px; padding: 0;
  display: grid; place-items: center; border: 2px solid var(--cocoa); border-radius: 50%;
  background: var(--butter); box-shadow: var(--shadow-pop); cursor: pointer;
}
.picker__style-count { position: absolute; bottom: -10px; font-size: 0.65rem; font-weight: 800; color: var(--cocoa); background: var(--cream); border-radius: 999px; padding: 0 4px; }
.picker__item.is-locked { background: var(--lavender); cursor: default; }
.picker__progress { margin: 8px 0; text-align: center; font-weight: 700; }
.picker__bar { position: relative; height: 18px; margin: 0 auto 12px; max-width: 260px; border: 2px solid var(--cocoa); border-radius: 999px; background: var(--cream); overflow: hidden; }
.picker__bar-fill { height: 100%; background: var(--peach); }
.picker__bar-label { position: absolute; inset: 0; display: grid; place-items: center; font-size: 0.75rem; font-weight: 800; }
@media (prefers-reduced-motion: no-preference) {
  .picker__item.is-locked:active { animation: picker-shake 0.3s; }
}
@keyframes picker-shake { 25% { translate: -3px 0; } 75% { translate: 3px 0; } }
```
(Nút tròn có `padding: 0` theo quy tắc Safari của CLAUDE.md.)

`TodayScreen.tsx`: `<PlantPickerSheet … currentStyleId={day.styleId ?? 'base'} onPick={(id, specialId, styleId) => { run(changePlant(deps, day.date, id, specialId, styleId)); setSheet(null); }} />`.

- [ ] **Step 4: Chạy** `npx vitest run && npx tsc --noEmit` → PASS (gồm các test cũ `đổi cây qua bảng chọn` trong `TodayScreen.test.tsx`).

- [ ] **Step 5: Commit** `feat(picker): style button, style view with locked mystery tiles`.

---

### Task 8: Khung mừng mở khoá trên màn Hôm nay

**Files:**
- Modify: `src/screens/TodayScreen.tsx`, `src/screens/today.css`
- Test: `tests/unit/screens/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `listUnlockedStyles` (Task 2), `getStyle` (Task 1)
- Produces: `data-testid="style-unlock"` (role `status`).

- [ ] **Step 1: Test đỏ** (thêm vào `TodayScreen.test.tsx`; dùng lại `addTodoInline`):

```tsx
  const blooms = (plantId: string, n: number) =>
    Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom' }));

  it('ra hoa lần thứ 10 thì mừng mở dáng mới', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    void clock;
    await deps.db.days.bulkPut(blooms('sunflower', 9));
    await deps.db.days.put(makeDay({ date: '2026-10-02', plantId: 'sunflower', greetedAt: 1, speech: '' }));
    const user = userEvent.setup();
    renderWithDeps(<TodayScreen />, deps);
    await addTodoInline(user, 'Uống nước');
    await user.click(await screen.findByRole('checkbox', { name: 'Hoàn thành: Uống nước' }));
    expect(await screen.findByTestId('style-unlock')).toHaveTextContent('Mở khoá dáng mới: Hướng dương · Mini!');
  });

  it('dáng đã đủ mốc từ lịch sử thì không mừng', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    await deps.db.days.put(makeDay({ date: '2026-10-02', plantId: 'sunflower', greetedAt: 1, speech: '' }));
    const user = userEvent.setup();
    renderWithDeps(<TodayScreen />, deps);
    await addTodoInline(user, 'Uống nước');
    await user.click(await screen.findByRole('checkbox', { name: 'Hoàn thành: Uống nước' }));
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom'));
    await waitFor(async () => expect(await getSetting(deps.db, 'unlockedStyles')).toEqual(['sunflower|mini']));
    expect(screen.queryByTestId('style-unlock')).toBeNull();
  });
```

- [ ] **Step 2: Chạy** → FAIL.

- [ ] **Step 3: Cài đặt** trong `TodayScreen.tsx`:
```tsx
  /** dáng vừa mở khoá trong lúc màn đang mở (không tính lần nạp đầu, nên mở nhờ lịch sử cũ không mừng) */
  const unlockedStyles = useLiveQuery(() => listUnlockedStyles(deps), [deps]);
  const seenStyles = useRef<Set<string> | null>(null);
  const [newStyles, setNewStyles] = useState<string[]>([]);
  useEffect(() => {
    if (!unlockedStyles) return;
    if (seenStyles.current) {
      const added = [...unlockedStyles].filter((k) => !seenStyles.current!.has(k));
      if (added.length) setNewStyles(added);
    }
    seenStyles.current = unlockedStyles;
  }, [unlockedStyles]);
  useEffect(() => {
    if (!newStyles.length) return;
    const t = setTimeout(() => setNewStyles([]), 5000);
    return () => clearTimeout(t);
  }, [newStyles]);
```
JSX (cạnh `special-intro`):
```tsx
{newStyles.length > 0 && (() => {
  const [plantId, styleId] = newStyles[0].split('|');
  const species = getSpecies(plantId);
  return (
    <div className="special-intro style-unlock" data-testid="style-unlock" role="status">
      <span className="special-intro__sparkles" aria-hidden="true">🔓 ✨ 🔓</span>
      Mở khoá dáng mới: {species.name} · {getStyle(species, styleId)?.name}!{newStyles.length > 1 ? ` +${newStyles.length - 1}` : ''}
      <span className="style-unlock__hint">Vào Đổi cây để thử nha</span>
    </div>
  );
})()}
```
`today.css`: `.style-unlock { white-space: normal; text-align: center; max-width: 92%; } .style-unlock__hint { display: block; font-size: 0.75rem; font-weight: 600; }` (khung kế thừa `pointer-events: none` từ `.special-intro`; nếu cả `special-intro` và `style-unlock` cùng hiện thì `style-unlock` thêm `top: 150px`).

- [ ] **Step 4: Chạy** `npx vitest run && npx tsc --noEmit` → PASS.

- [ ] **Step 5: Commit** `feat(today): celebrate a newly unlocked plant style`.

---

### Task 9: E2E WebKit, tài liệu, phát hành đợt 1

**Files:**
- Modify: `tests/e2e/app.spec.ts`, `CLAUDE.md`

- [ ] **Step 1: Viết E2E** (cuối `app.spec.ts`):

```ts
test('dáng cây: đủ 10 ngày ra hoa mở dáng 2; dáng 3 khoá và không lộ hình', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction(['days'], 'readwrite');
          for (let i = 1; i <= 12; i++) {
            tx.objectStore('days').put({ date: `2026-09-${String(i).padStart(2, '0')}`, plantId: 'sunflower', potId: 'terracotta', specialId: null, isRestDay: false, greetedAt: 1, note: '', todos: [], finalStage: 'bloom', createdAt: 1, updatedAt: 1 });
          }
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Đổi cây' }).click();
  await page.getByRole('button', { name: 'Dáng cây: Hướng dương (2/3)' }).click();
  await expect(page.getByRole('heading', { name: 'Dáng của Hướng dương' })).toBeVisible();
  const locked = page.getByTestId('style-giant');
  await expect(locked).toContainText('Dáng bí ẩn');
  await expect(locked.getByTestId('picker-scene')).toHaveCount(0);
  // nút dáng vẫn tròn trên Safari
  await page.getByRole('button', { name: 'Quay lại chọn cây' }).click();
  const btn = (await page.getByRole('button', { name: /^Dáng cây: Hướng dương/ }).boundingBox())!;
  expect(Math.abs(btn.width - btn.height)).toBeLessThan(2);
  await page.getByRole('button', { name: /^Dáng cây: Hướng dương/ }).click();
  await page.getByTestId('style-mini').click();
  await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-style', 'mini');
  await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-plant', 'sunflower');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
```

- [ ] **Step 2: Chạy** `npm run e2e > pw.log 2>&1; grep -E "passed|failed" pw.log` → mọi test pass trên WebKit. Chụp ảnh bảng dáng (lưới loài + màn dáng) bằng WebKit 390×844 vào scratchpad, xem ảnh: nút dáng không che tên loài, ô khoá rõ là bí ẩn, thanh tiến độ không tràn.

- [ ] **Step 3: Cập nhật `CLAUDE.md`**:
  - **Quy tắc nghiệp vụ** thêm mục *Dáng cây mở khoá*: đếm, mốc 10/20, setting `unlockedStyles`, random ngày mới chỉ gọi RNG khi ≥ 2, `changePlant(…, styleId)`, bảng Đổi cây (nút `Dáng cây: <loài> (n/3)`, màn `Dáng của <loài>`, `Quay lại chọn cây`, ô khoá `Dáng bí ẩn` không render cây), khung `style-unlock`.
  - **Format nội dung** thêm `PlantStyle` + `styles?` vào interface, ghi dáng của từng loài vào bảng (cột *Dáng 2/3*).
  - **DayRecord** thêm `styleId?`; **settings** thêm `unlockedStyles`; **sao lưu** thêm `unlockedStyles`.
  - Icon mới `styles`, `lock`; label/testid mới: `style-<id>`, `locked-style-art`, `style-unlock`, `data-style`.

- [ ] **Step 4: Kiểm tra giống CI rồi push**:
```bash
set -o pipefail && npx tsc --noEmit && npx vitest run && TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run && npm run build && git add -A && git commit -m "test(e2e): plant styles; docs: CLAUDE.md" && git push origin main
```
Sau push: xem `https://api.github.com/repos/bigbeartk/garden-of-habits/actions/runs?per_page=1` tới khi `conclusion: success`.

---

## Đợt 2: 8 loài còn lại (mỗi loài một task, cùng mẫu)

Mỗi task 10–17 làm đúng các bước sau cho một loài; id/tên/ý tưởng theo bảng. **Không đổi** test của Task 1 (nó tự kiểm mọi loài có `styles`).

| Task | File | Dáng 2 (10) | Dáng 3 (20) |
|---|---|---|---|
| 10 | `corn.tsx` | `popcorn` **Bỏng ngô**: thân ngắn, bắp nổ bung thành đám mây bỏng ngô lổn nhổn (mặt ở giữa đám) | `rainbow` **Cầu vồng**: ba bắp bóc vỏ hạt nhiều màu, xoè như bó hoa (mặt ở bắp giữa) |
| 11 | `cactus.tsx` | `bunny` **Tai thỏ**: lá dẹt bầu dục chồng nhau như tai thỏ, chấm gai (giữ `faceStyle: 'cool'`) | `barrel` **Cầu vàng**: khối cầu thấp sống dọc, gai vàng, vương miện hoa |
| 12 | `monstera.tsx` | `pole` **Leo cột**: cột rêu thẳng đứng, lá xẻ thuỳ ôm cột | `trailing` **Rủ**: lá rủ tràn qua mép chậu hai bên |
| 13 | `orange.tsx` | `kumquat` **Quất Tết**: tán tỉa tròn nhiều tầng, quả nhỏ dày, bao lì xì đỏ | `bonsai` **Bonsai**: thân xoắn nghiêng, 2–3 tầng tán mây dẹt, vài quả cam |
| 14 | `cherry.tsx` | `weeping` **Rủ**: cành rủ hình đài phun nước, quả lấp ló | `lantern` **Cần câu**: thân cong một bên, treo một chùm cherry to |
| 15 | `rose.tsx` | `arch` **Cổng vòm**: cổng vòm phủ hồng nhỏ, mặt ở bông giữa đỉnh vòm (giữ `faceStyle: 'lady'`) | `dome` **Chuông kính**: hồng xanh đêm lơ lửng trong chuông kính lấp lánh |
| 16 | `watermelon.tsx` | `square` **Vuông**: quả dưa khối vuông ngồi trên lá | `trellis` **Giàn leo**: giàn thẳng đứng treo nhiều dưa tí hon trong túi lưới |
| 17 | `tulip.tsx` | `parrot` **Vẹt**: cánh xoăn tua rua xoè rộng, sọc đỏ vàng | `bouquet` **Bó hoa**: ba bông cao thấp buộc nơ |

Các bước cho mỗi loài:

- [ ] **Step 1: Test đỏ:** trong `tests/unit/content/plants.test.tsx` thêm id vào danh sách cố định:
  ```ts
  it('dáng của từng loài theo thứ tự', () => {
    expect(Object.fromEntries(PLANTS.filter((p) => p.styles).map((p) => [p.id, p.styles!.map((s) => s.id)]))).toEqual({
      sunflower: ['mini', 'giant'],
      // + dòng của loài đang làm, vd. corn: ['popcorn', 'rainbow'],
    });
  });
  ```
  (Test này tạo ở Task 10 với sunflower + corn; mỗi task sau thêm một dòng.) Chạy `npx vitest run tests/unit/content` → FAIL.
- [ ] **Step 2: Vẽ** `bud` + `bloom` cho 2 dáng trong file loài (giữ bảng màu và kiểu lá/quả của loài, viền `INK`), thêm `styles: [...]` với `unlockAt` 10 và 20, `faceAnchor` đặt trên phần mang mặt. Chỉ thêm phần dùng chung vào `parts.tsx` nếu là chi tiết nhỏ.
- [ ] **Step 3: Chạy** `npx vitest run && npx tsc --noEmit` → PASS.
- [ ] **Step 4: Soát hình WebKit**: ArtGallery (tạm bật trong `main.tsx`, hoàn tác sau), chụp 390×844, đặt cạnh mọi dáng đã có: dáng mới khác hẳn mọi loài khác và 2 dáng còn lại của chính loài, vẫn nhận ra loài; mặt không lệch.
- [ ] **Step 5: Cập nhật bảng loài trong `CLAUDE.md`** (dáng 2/3 của loài) và commit `feat(<id>): <Dáng 2> and <Dáng 3> unlockable styles`.

Sau Task 17: sửa test thứ nhất của Task 7 (mọi loài có nút dáng), chạy lại bước kiểm tra giống CI + E2E WebKit, rồi push như Task 9 Step 4.
