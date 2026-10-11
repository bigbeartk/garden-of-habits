# 4 loài cây khoá (mở bằng ngày đạt) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa Cà chua, Việt quất, Cúc hoạ mi, Dâu tây vào app ở trạng thái khoá; cứ 90 ngày đạt (xong hết việc HOẶC xong hết thói quen) người dùng được chọn mở một cây.

**Architecture:** Logic thuần trong `src/domain/plantUnlocks.ts` (đếm ngày đạt từ `days` + `perfectHabitDays`, lượt = floor/90, danh sách cây đã mở ở setting `unlockedPlants`). `ensureToday` / `changePlant` chỉ dùng `availablePlants`. Nội dung mới chép từ sổ phác thảo; 4 kiểu mặt mới vào `Face.tsx`; chậu Giỏ đan mới. Giao diện: mục "Cây mới" trong `PlantPicker`, chấm đỏ + khung mừng ở Hôm nay, Khu vườn ẩn loài khoá.

**Tech Stack:** React + TypeScript, Dexie (IndexedDB), Vitest + Testing Library + fake-indexeddb, Playwright (WebKit iPhone 13).

**Spec:** `docs/superpowers/specs/2026-10-11-locked-plants-design.md`

## Global Constraints

- Mốc: `PLANT_UNLOCK_EVERY = 90`; lượt = `min(số loài khoá, floor(goodDays / 90))`.
- Ngày đạt: không phải ngày nghỉ, và (`finalStage === 'bloom'` HOẶC thuộc `perfectHabitDays`); đạt cả hai tính 1; tính cả lịch sử và hôm nay.
- Cây đã mở giữ mãi (setting `unlockedPlants: string[]`, sao lưu tuỳ chọn, gộp = hợp); **không** tăng `SCHEMA_VERSION`.
- Khi chưa mở loài khoá nào, `ensureToday` phải cho **đúng chuỗi random cũ** (danh sách loài = 9 loài cũ, cùng thứ tự).
- Dexie: đọc trước / ghi sau transaction rw, không lồng hàm async trong transaction (`PrematureCommitError`).
- Mọi chữ mới vào **cả** `src/i18n/vi.ts` và `src/i18n/en.ts`; không viết cứng chữ Việt có dấu trong `src/{app,components,screens,domain,db,hooks,platform,utils}`.
- Màn hình không gọi thẳng `db`/`Math.random`/`new Date()`: dùng `useDeps()`.
- Toggle/nút đọc từ DB dùng state cục bộ khi cần (xem CLAUDE.md `useOptimisticToggle`).
- Đổi màu cây chỉ bằng `<filter>` SVG; nút tròn `padding: 0`; safe-area qua `var(--safe-area-inset-x, env(...))`.
- Commit chỉ khi mọi test pass; nối lệnh bằng `&&`; Playwright ghi ra file, không pipe vào `head`.
- Test giống CI trước khi push: `TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run`.

## Review Focus

1. **Người dùng có thói quen nhưng không dùng todo** (ngày không có bản ghi `days` mà vẫn làm đủ thói quen) phải được tính → test ở Task 1 (`ngày chỉ có thói quen, không có bản ghi days`).
2. **Bỏ tick sau khi mở cây** (lượt tụt xuống dưới số cây đã mở) không được khoá lại cây, `freeSlots` không âm → test ở Task 1.
3. **File sao lưu cũ / id loài lạ trong `unlockedPlants`** (loài đã xoá, loài thường) bị lọc, không crash → test ở Task 1 và Task 3.
4. **Ngày đã lưu `plantId` của loài khoá** (vd. khôi phục sao lưu từ máy đã mở rồi gộp vào máy chưa mở) vẫn vẽ được ở Lịch / chi tiết ngày; chỉ bốc mới và đổi tay bị chặn → test ở Task 2.
5. **Bấm `Mở khoá` hai lần nhanh** chỉ mở 1 cây, lần hai báo lỗi nhẹ, không trừ 2 lượt → test ở Task 10 (nút bị vô hiệu khi đang lưu) và Task 1 (`unlockPlant` khi hết lượt).

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/domain/plantUnlocks.ts` (mới) | đếm ngày đạt, lượt, trạng thái, mở cây, danh sách loài chọn được |
| `src/domain/types.ts` | `Catalog.plants[i].locked?: boolean` |
| `src/db/settings.ts` | `unlockedPlants: string[]` |
| `src/domain/errors.ts` + `i18n` | mã lỗi `plantLocked`, `plantUnlockUnavailable` |
| `src/domain/dayService.ts` | `ensureToday` / `changePlant` dùng `availablePlants` |
| `src/db/backup.ts` | `unlockedPlants` trong sao lưu |
| `src/content/Face.tsx` | 4 kiểu mặt `doll`, `sparkle`, `happy`, `cheeky` |
| `src/content/pots/pots.tsx`, `registry.ts` | chậu `basket` |
| `src/content/plants/{tomato,blueberry,daisy,strawberry}.tsx` (mới) | 4 loài |
| `src/content/types.ts`, `catalog.ts`, `plants/registry.ts` | `locked`, đăng ký loài |
| `src/components/NewPlants.tsx` (mới) | mục "Cây mới" trong tab Cây |
| `src/components/PlantPicker.tsx` | lưới loài chỉ hiện loài không khoá; gắn `NewPlants` |
| `src/screens/TodayScreen.tsx` | chấm đỏ nút Đổi cây, khung mừng `plant-unlock-ready` |
| `src/screens/GardenScreen.tsx` | bỏ luống loài khoá chưa mở |
| `tests/...` | xem từng task |

---

### Task 1: Domain `plantUnlocks`

**Files:**
- Create: `src/domain/plantUnlocks.ts`
- Modify: `src/domain/types.ts:126-130`, `src/db/settings.ts` (SettingsShape), `src/i18n/vi.ts` + `src/i18n/en.ts` (mục `errors`)
- Test: `tests/unit/domain/plantUnlocks.test.ts`, `tests/unit/helpers.tsx` (TEST_CATALOG)

**Interfaces:**
- Produces:
  - `PLANT_UNLOCK_EVERY = 90`
  - `goodDayCount(deps: DayDeps): Promise<number>`
  - `earnedSlots(goodDays: number, lockedTotal: number): number`
  - `interface PlantUnlockState { locked: string[]; unlocked: string[]; freeSlots: number; goodDays: number; nextAt: number | null }`
  - `plantUnlockState(deps: DayDeps): Promise<PlantUnlockState>`
  - `unlockPlant(deps: DayDeps, plantId: string): Promise<void>`
  - `availablePlants(deps: DayDeps): Promise<Catalog['plants']>`
  - `Catalog['plants'][number].locked?: boolean`; setting `unlockedPlants: string[]`; `ErrorCode` thêm `'plantLocked' | 'plantUnlockUnavailable'`

- [ ] **Step 1: Thêm loài khoá vào TEST_CATALOG** (`tests/unit/helpers.tsx`)

```ts
export const TEST_CATALOG: Catalog = {
  plants: [
    { id: 'sunflower', defaultPotId: 'terracotta', styles: [{ id: 'mini', unlockAt: 10 }, { id: 'giant', unlockAt: 20 }] },
    { id: 'corn', defaultPotId: 'rattan' },
    { id: 'tomato', defaultPotId: 'pink-cup', locked: true },
    { id: 'daisy', defaultPotId: 'glass-bowl', locked: true },
  ],
  potIds: ['terracotta', 'rattan', 'pink-cup', 'glass-bowl'],
  specials: [{ id: 'glow', weight: 1 }],
};
```

Thêm `locked?: boolean` vào `Catalog` trong `src/domain/types.ts`:

```ts
export interface Catalog {
  plants: { id: string; defaultPotId: string; styles?: { id: string; unlockAt: number }[]; locked?: boolean }[];
  potIds: string[];
  specials: { id: string; weight: number }[];
}
```

- [ ] **Step 2: Viết test đỏ** `tests/unit/domain/plantUnlocks.test.ts`

```ts
import { availablePlants, earnedSlots, goodDayCount, plantUnlockState, unlockPlant } from '../../../src/domain/plantUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
import { addDays } from '../../../src/domain/dayKey';
import { makeDay, makeDeps } from '../helpers';

/** n ngày ra hoa liên tiếp kết thúc trước hôm nay (makeDeps bắt đầu 2026-10-02 09:00) */
const blooms = (n: number, end = '2026-10-01') =>
  Array.from({ length: n }, (_, i) => makeDay({ date: addDays(end, -i), finalStage: 'bloom' }));

describe('mở khoá loài cây mới', () => {
  it('earnedSlots: 89 → 0, 90 → 1, 400 → tối đa số loài khoá', () => {
    expect(earnedSlots(89, 4)).toBe(0);
    expect(earnedSlots(90, 4)).toBe(1);
    expect(earnedSlots(179, 4)).toBe(1);
    expect(earnedSlots(400, 4)).toBe(4);
    expect(earnedSlots(400, 2)).toBe(2);
  });

  it('ngày đạt: ra hoa tính, ngày nghỉ / chưa ra hoa không tính', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut([
      makeDay({ date: '2026-09-01', finalStage: 'bloom' }),
      makeDay({ date: '2026-09-02', finalStage: 'bud' }),
      makeDay({ date: '2026-09-03', finalStage: 'bloom', isRestDay: true }),
    ]);
    expect(await goodDayCount(deps)).toBe(1);
  });

  it('ngày trọn vẹn thói quen tính; đạt cả hai chỉ tính 1; ngày chỉ có thói quen, không có bản ghi days vẫn tính', async () => {
    const { deps } = makeDeps();
    await deps.db.habits.add({ id: 'h', name: 'Đọc', icon: 'book', color: 'mint', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: '2026-09-01', createdAt: 0, updatedAt: 0 });
    await deps.db.habitChecks.bulkPut([
      { habitId: 'h', date: '2026-09-01', at: 0 }, // cũng ra hoa → tính 1
      { habitId: 'h', date: '2026-09-02', at: 0 }, // không có bản ghi days → vẫn tính
    ]);
    await deps.db.days.put(makeDay({ date: '2026-09-01', finalStage: 'bloom' }));
    expect(await goodDayCount(deps)).toBe(2);
  });

  it('hôm nay đang ra hoa thì tính', async () => {
    const { deps } = makeDeps();
    await deps.db.days.put(makeDay({ date: '2026-10-02', finalStage: 'bloom' }));
    expect(await goodDayCount(deps)).toBe(1);
  });

  it('trạng thái: lượt trừ cây đã mở, nextAt, lọc id lạ / loài thường', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms(185));
    await setSetting(deps.db, 'unlockedPlants', ['tomato', 'sunflower', 'gone']);
    expect(await plantUnlockState(deps)).toEqual({ locked: ['daisy'], unlocked: ['tomato'], freeSlots: 1, goodDays: 185, nextAt: null });
  });

  it('bỏ tick làm lượt tụt: cây đã mở vẫn mở, freeSlots không âm', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms(10));
    await setSetting(deps.db, 'unlockedPlants', ['tomato']);
    const s = await plantUnlockState(deps);
    expect(s.unlocked).toEqual(['tomato']);
    expect(s.freeSlots).toBe(0);
    expect(s.nextAt).toBe(180);
  });

  it('unlockPlant: mở khi còn lượt; từ chối khi hết lượt, loài thường, loài đã mở', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut(blooms(90));
    await expect(unlockPlant(deps, 'sunflower')).rejects.toMatchObject({ code: 'plantUnlockUnavailable' });
    await unlockPlant(deps, 'daisy');
    expect(await getSetting(deps.db, 'unlockedPlants')).toEqual(['daisy']);
    await expect(unlockPlant(deps, 'daisy')).rejects.toMatchObject({ code: 'plantUnlockUnavailable' });
    await expect(unlockPlant(deps, 'tomato')).rejects.toMatchObject({ code: 'plantUnlockUnavailable' });
  });

  it('availablePlants: loài thường + loài khoá đã mở, đúng thứ tự nội dung', async () => {
    const { deps } = makeDeps();
    expect((await availablePlants(deps)).map((p) => p.id)).toEqual(['sunflower', 'corn']);
    await setSetting(deps.db, 'unlockedPlants', ['daisy']);
    expect((await availablePlants(deps)).map((p) => p.id)).toEqual(['sunflower', 'corn', 'daisy']);
  });
});
```

(Kiểm tra field `Habit` thật trong `src/domain/types.ts`; `color` phải là một `HabitColor` hợp lệ, xem `src/content/habits.ts`. Nếu `makeDeps` bắt đầu ở ngày khác 2026-10-02 thì đổi các ngày theo `helpers.tsx`.)

- [ ] **Step 3: Chạy, xác nhận đỏ**

Run: `npx vitest run tests/unit/domain/plantUnlocks.test.ts`
Expected: FAIL (`Cannot find module .../plantUnlocks`)

- [ ] **Step 4: Thêm setting + mã lỗi**

`src/db/settings.ts` (trong `SettingsShape`, sau `unlockedStyles`):

```ts
  /** loài cây khoá đã được người dùng chọn mở (mỗi 90 ngày đạt một lượt); mở rồi giữ luôn */
  unlockedPlants: string[];
```

`src/i18n/vi.ts`, mục `errors` (cạnh `styleLocked`):

```ts
    plantLocked: (_p: ErrorParams) => 'Cây này chưa mở khoá',
    plantUnlockUnavailable: (_p: ErrorParams) => 'Chưa mở được cây này',
```

`src/i18n/en.ts`, mục `errors`:

```ts
    plantLocked: (_p: ErrorParams) => 'This plant is still locked',
    plantUnlockUnavailable: (_p: ErrorParams) => "This plant can't be unlocked yet",
```

- [ ] **Step 5: Viết `src/domain/plantUnlocks.ts`**

```ts
import { getSetting } from '../db/settings';
import { dayKey } from './dayKey';
import type { DayDeps } from './dayService';
import { AppError } from './errors';
import { perfectHabitDays } from './habitService';
import type { Catalog } from './types';

/** Số ngày đạt cho mỗi lượt mở cây mới (dùng đều thì khoảng 3 tháng). */
export const PLANT_UNLOCK_EVERY = 90;

/**
 * Số ngày đạt tới hết hôm nay: không phải ngày nghỉ, và cây ra hoa HOẶC làm đủ thói quen ("Ngày trọn vẹn").
 * Tính cả lịch sử; ngày đạt cả hai chỉ tính 1; ngày không có bản ghi `days` mà làm đủ thói quen vẫn tính.
 */
export async function goodDayCount(deps: DayDeps): Promise<number> {
  const { db } = deps;
  const today = dayKey(deps.now());
  const good = new Set<string>();
  const rest = new Set<string>();
  await db.days.each((d) => {
    if (d.isRestDay) rest.add(d.date);
    else if (d.finalStage === 'bloom' && d.date <= today) good.add(d.date);
  });
  const firstDay = (await db.days.orderBy('date').first())?.date;
  const firstHabit = (await db.habits.toArray()).reduce<string | undefined>((m, h) => (!m || h.startDate < m ? h.startDate : m), undefined);
  const from = [firstDay, firstHabit].filter((x): x is string => !!x).sort()[0];
  if (from && from <= today) {
    for (const date of await perfectHabitDays(deps, from, today)) if (!rest.has(date)) good.add(date);
  }
  return good.size;
}

/** Lượt mở đã kiếm được, tối đa bằng số loài khoá. */
export function earnedSlots(goodDays: number, lockedTotal: number): number {
  return Math.min(lockedTotal, Math.floor(goodDays / PLANT_UNLOCK_EVERY));
}

export interface PlantUnlockState {
  /** loài khoá chưa mở, theo thứ tự nội dung */
  locked: string[];
  /** loài khoá đã mở, theo thứ tự nội dung */
  unlocked: string[];
  freeSlots: number;
  goodDays: number;
  /** mốc ngày đạt cho lượt kế tiếp; null khi đã kiếm đủ lượt cho mọi loài khoá */
  nextAt: number | null;
}

const lockedIds = (catalog: Catalog) => catalog.plants.filter((p) => p.locked).map((p) => p.id);

/** Danh sách đã mở (setting), bỏ id lạ / loài không khoá, theo thứ tự nội dung. */
async function savedUnlocked(deps: DayDeps): Promise<string[]> {
  const saved = new Set((await getSetting(deps.db, 'unlockedPlants')) ?? []);
  return lockedIds(deps.catalog).filter((id) => saved.has(id));
}

export async function plantUnlockState(deps: DayDeps): Promise<PlantUnlockState> {
  const all = lockedIds(deps.catalog);
  const unlocked = await savedUnlocked(deps);
  const goodDays = await goodDayCount(deps);
  const earned = earnedSlots(goodDays, all.length);
  // lượt đã "dùng tới": cây đã mở có thể nhiều hơn lượt đang có (bỏ tick làm tụt) → mốc kế tiếp tính từ số lớn hơn
  const used = Math.max(earned, unlocked.length);
  return {
    locked: all.filter((id) => !unlocked.includes(id)),
    unlocked,
    freeSlots: Math.max(0, earned - unlocked.length),
    goodDays,
    nextAt: used < all.length ? (used + 1) * PLANT_UNLOCK_EVERY : null,
  };
}

/** Mở một loài khoá: phải còn lượt, là loài khoá và chưa mở. Ghi setting bằng lệnh Dexie trực tiếp trong transaction riêng. */
export async function unlockPlant(deps: DayDeps, plantId: string): Promise<void> {
  const state = await plantUnlockState(deps);
  if (state.freeSlots < 1 || !state.locked.includes(plantId)) throw new AppError('plantUnlockUnavailable', { id: plantId });
  const { db } = deps;
  await db.transaction('rw', db.settings, async () => {
    const row = await db.settings.get('unlockedPlants');
    const saved = (row?.value as string[] | undefined) ?? [];
    if (!saved.includes(plantId)) await db.settings.put({ key: 'unlockedPlants', value: [...saved, plantId] });
  });
}

/** Loài chọn được (bốc ngày mới, đổi tay): loài không khoá + loài khoá đã mở, theo thứ tự nội dung. */
export async function availablePlants(deps: DayDeps): Promise<Catalog['plants']> {
  const unlocked = new Set(await savedUnlocked(deps));
  return deps.catalog.plants.filter((p) => !p.locked || unlocked.has(p.id));
}
```

Nếu import `DayDeps` từ `dayService` gây vòng import (Task 2 làm `dayService` import file này), đổi thành `import type` (đã là `import type`, vòng chỉ ở kiểu nên an toàn).

- [ ] **Step 6: Chạy test, xác nhận xanh; chạy cả bộ + tsc**

Run: `npx vitest run tests/unit/domain/plantUnlocks.test.ts && npx tsc --noEmit && npm test`
Expected: PASS hết (TEST_CATALOG mới có thể làm đỏ test cũ đếm loài/bốc ngẫu nhiên: Task 2 xử lý `ensureToday`; nếu test cũ đỏ vì bốc trúng `tomato`/`daisy` thì đó là hành vi Task 2 sửa — chạy tiếp Task 2 trước khi commit, hoặc gộp commit Task 1 + 2).

- [ ] **Step 7: Commit** (sau khi Task 2 xanh nếu bị chặn như trên)

```bash
git add src/domain/plantUnlocks.ts src/domain/types.ts src/db/settings.ts src/i18n/vi.ts src/i18n/en.ts tests/unit/domain/plantUnlocks.test.ts tests/unit/helpers.tsx
git commit -m "feat(unlock): count good days and plant unlock slots"
```

---

### Task 2: `ensureToday` và `changePlant` bỏ qua loài khoá

**Files:**
- Modify: `src/domain/dayService.ts:30-75` (ensureToday), `:208-230` (changePlant)
- Test: `tests/unit/domain/dayService.test.ts`

**Interfaces:**
- Consumes: `availablePlants(deps)` (Task 1)

- [ ] **Step 1: Test đỏ** (thêm vào `dayService.test.ts`)

```ts
import { availablePlants } from '../../../src/domain/plantUnlocks';
import { setSetting } from '../../../src/db/settings';

describe('loài khoá', () => {
  it('ensureToday không bao giờ bốc loài khoá chưa mở', async () => {
    for (let seed = 1; seed <= 40; seed++) {
      const { deps } = makeDeps();
      deps.rng = mulberry32(seed);
      const d = await ensureToday(deps);
      expect(['sunflower', 'corn']).toContain(d.plantId);
    }
  });

  it('ensureToday bốc được loài khoá đã mở', async () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++) {
      const { deps } = makeDeps();
      deps.rng = mulberry32(seed);
      await setSetting(deps.db, 'unlockedPlants', ['daisy']);
      seen.add((await ensureToday(deps)).plantId);
    }
    expect(seen.has('daisy')).toBe(true);
    expect(seen.has('tomato')).toBe(false);
  });

  it('chưa mở gì: cùng seed cho cùng loài như catalog không có loài khoá (chuỗi random cũ)', async () => {
    const plain = { ...TEST_CATALOG, plants: TEST_CATALOG.plants.filter((p) => !p.locked) };
    for (let seed = 1; seed <= 10; seed++) {
      const a = makeDeps(); a.deps.rng = mulberry32(seed);
      const b = makeDeps(undefined, plain); b.deps.rng = mulberry32(seed);
      const [da, db2] = [await ensureToday(a.deps), await ensureToday(b.deps)];
      expect([da.plantId, da.specialId, da.styleId]).toEqual([db2.plantId, db2.specialId, db2.styleId]);
    }
  });

  it('changePlant từ chối loài khoá chưa mở, nhận khi đã mở', async () => {
    const { deps } = makeDeps();
    const day = await ensureToday(deps);
    await expect(changePlant(deps, day.date, 'tomato')).rejects.toMatchObject({ code: 'plantLocked' });
    await setSetting(deps.db, 'unlockedPlants', ['tomato']);
    expect((await changePlant(deps, day.date, 'tomato')).plantId).toBe('tomato');
  });

  it('ngày đã lưu loài khoá vẫn đọc được (khôi phục từ máy đã mở)', async () => {
    const { deps } = makeDeps();
    await deps.db.days.put(makeDay({ date: '2026-09-01', plantId: 'tomato', potId: 'pink-cup', finalStage: 'bloom' }));
    expect((await deps.db.days.get('2026-09-01'))!.plantId).toBe('tomato');
    expect((await availablePlants(deps)).map((p) => p.id)).not.toContain('tomato');
  });
});
```

(Dùng đúng chữ ký `makeDeps(start?, catalog?)` trong `helpers.tsx`; nếu `deps.rng` không gán được thì truyền seed theo cách helper hỗ trợ.)

- [ ] **Step 2: Chạy, xác nhận đỏ**

Run: `npx vitest run tests/unit/domain/dayService.test.ts -t "loài khoá"`
Expected: FAIL (bốc trúng `tomato`/`daisy`; `changePlant` không ném lỗi)

- [ ] **Step 3: Sửa `ensureToday`** — đọc danh sách trước transaction, bốc trong đó:

```ts
  const unlockedStyles = await listUnlockedStyles(deps);
  // loài chọn được: đọc TRƯỚC transaction như listUnlockedStyles; chưa mở loài khoá nào thì = catalog cũ (giữ chuỗi random)
  const plants = await availablePlants(deps);
  return db.transaction('rw', [...], async () => {
    ...
    const plant = pickUniform(plants, deps.rng);
```

và import `import { availablePlants } from './plantUnlocks';`.

- [ ] **Step 4: Sửa `changePlant`** — sau dòng `if (!next) throw new AppError('unknownPlant', ...)`:

```ts
  if (next.locked && !(await availablePlants(deps)).some((p) => p.id === plantId)) throw new AppError('plantLocked', { id: plantId });
```

- [ ] **Step 5: Chạy cả bộ + tsc**

Run: `npx tsc --noEmit && npm test`
Expected: PASS hết.

- [ ] **Step 6: Commit**

```bash
git add src/domain/dayService.ts tests/unit/domain/dayService.test.ts
git commit -m "feat(unlock): new days and plant changes skip locked species"
```

---

### Task 3: Sao lưu `unlockedPlants`

**Files:**
- Modify: `src/db/backup.ts` (schema ~111, export ~158-182, replace ~248, merge ~297)
- Test: `tests/unit/db/backup.test.ts`

- [ ] **Step 1: Test đỏ** (cạnh test `unlockedStyles` hiện có, cùng helper `exportBackup`/`restoreBackup` của file)

```ts
  it('unlockedPlants: xuất, thay thế, gộp = hợp, file cũ không có', async () => {
    const src = makeDb();
    await setSetting(src, 'unlockedPlants', ['tomato']);
    const backup = parseBackup(JSON.stringify(await exportBackup(src)));
    expect(backup.unlockedPlants).toEqual(['tomato']);

    const dst = makeDb();
    await setSetting(dst, 'unlockedPlants', ['daisy']);
    await restoreBackup(dst, backup, 'replace');
    expect(await getSetting(dst, 'unlockedPlants')).toEqual(['tomato']);

    await setSetting(dst, 'unlockedPlants', ['daisy']);
    await restoreBackup(dst, backup, 'merge');
    expect(await getSetting(dst, 'unlockedPlants')).toEqual(['daisy', 'tomato']);

    const old = { ...backup, unlockedPlants: undefined };
    await restoreBackup(dst, old, 'replace');
    expect(await getSetting(dst, 'unlockedPlants')).toBeUndefined();
  });
```

(Theo đúng tên hàm/ cách gọi trong các test `unlockedStyles` ở dòng ~380-396 của file.)

- [ ] **Step 2: Chạy, xác nhận đỏ** — `npx vitest run tests/unit/db/backup.test.ts -t unlockedPlants` → FAIL.

- [ ] **Step 3: Sửa `backup.ts`** theo đúng mẫu của `unlockedStyles`:
  - schema: `unlockedPlants: z.array(z.string()).optional(), // loài cây khoá đã mở; file cũ chưa có`
  - export: `const unlockedPlants = await getSetting(db, 'unlockedPlants');` … `...(unlockedPlants ? { unlockedPlants } : {}),`
  - replace: `if (backup.unlockedPlants) await setSetting(db, 'unlockedPlants', backup.unlockedPlants); else await deleteSetting(db, 'unlockedPlants');`
  - merge: `if (backup.unlockedPlants) { const mine = (await getSetting(db, 'unlockedPlants')) ?? []; await setSetting(db, 'unlockedPlants', [...new Set([...mine, ...backup.unlockedPlants])]); }`

- [ ] **Step 4: Chạy** `npx tsc --noEmit && npm test` → PASS.

- [ ] **Step 5: Commit** — `git add src/db/backup.ts tests/unit/db/backup.test.ts && git commit -m "feat(backup): keep unlocked plants"`

---

### Task 4: 4 kiểu mặt mới trong `Face.tsx`

**Files:**
- Modify: `src/content/Face.tsx`
- Test: `tests/unit/content/face.test.tsx` (mới)

**Interfaces:**
- Produces: `type FaceStyle = 'cute' | 'cool' | 'lady' | 'doll' | 'sparkle' | 'happy' | 'cheeky'`

Bảng ghép (nguồn: `src/dev/sketch/faces.tsx`, mảng `EYES` / `MOUTHS`):

| FaceStyle | Mắt | Miệng | Ghi chú |
|---|---|---|---|
| `doll` | E6 | M3 | buồn có giọt nước mắt |
| `sparkle` | E4 | M0 (= miệng cute hiện tại) | cười = `> <` |
| `happy` | E5 | M3 | cười có sao vàng |
| `cheeky` | E7 | M4 | — |

- [ ] **Step 1: Test đỏ** `tests/unit/content/face.test.tsx`

```tsx
import { render } from '@testing-library/react';
import { Face, type FaceStyle, type Mood } from '../../../src/content/Face';

const NEW: FaceStyle[] = ['doll', 'sparkle', 'happy', 'cheeky'];
const MOODS: Mood[] = ['normal', 'smile', 'talk', 'sleep', 'sad'];

describe('kiểu mặt mới', () => {
  it.each(NEW)('%s vẽ đủ 5 nét mặt, có data-style và có mắt', (style) => {
    for (const mood of MOODS) {
      const { container, unmount } = render(<svg><Face faceStyle={style} mood={mood} x={0} y={0} scale={1} /></svg>);
      const face = container.querySelector('[data-testid="face"]')!;
      expect(face.getAttribute('data-style')).toBe(style);
      expect(face.getAttribute('data-mood')).toBe(mood);
      expect(face.querySelector('[data-part="eyes"]'), `${style}/${mood}`).not.toBeNull();
      unmount();
    }
  });

  it('các kiểu khác nhau ở nét Thường', () => {
    const html = (s: FaceStyle) => render(<svg><Face faceStyle={s} mood="normal" x={0} y={0} scale={1} /></svg>).container.innerHTML;
    const all = ['cute', ...NEW].map((s) => html(s as FaceStyle));
    expect(new Set(all.map((h) => h.replace(/data-style="[^"]+"/, ''))).size).toBe(all.length);
  });
});
```

- [ ] **Step 2: Chạy, xác nhận đỏ** — `npx vitest run tests/unit/content/face.test.tsx` → FAIL (`data-part="eyes"` không có / kiểu lạ).

- [ ] **Step 3: Sửa `Face.tsx`**
  1. Mở rộng `FaceStyle`.
  2. Bọc phần mắt của mọi kiểu trong `<g data-part="eyes">` (kể cả `Eyes` và `Shades` hiện có) để test bám vào.
  3. Thêm component `SketchEyes({ kind, mood })` và `SketchMouth({ kind, mood })` chép **nguyên văn** nội dung `open`/`smile`/`sleep` của E4–E7 và `draw` của M3, M4 từ `src/dev/sketch/faces.tsx` (kèm `ClosedEyes`, `SadBrows`). Miệng của `sparkle` dùng `Mouth` hiện có (M0).
  4. Trong `Face`: nếu `faceStyle` thuộc 4 kiểu mới thì vẽ má hồng (giống cute) + `SketchEyes` + `SketchMouth`, giữ nguyên nhánh `cute/cool/lady`.
- [ ] **Step 4: Chạy** `npx vitest run tests/unit/content/face.test.tsx && npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5: Đổi sổ phác thảo dùng mặt thật**: `src/dev/sketch/faces.tsx` thêm hàng `✅ ĐANG DÙNG` cho 4 kiểu (dùng `BigReal`), ghi chú đầu file "E4–E7/M3–M4 đã vào Face.tsx".
- [ ] **Step 6: Commit** — `git add src/content/Face.tsx tests/unit/content/face.test.tsx src/dev/sketch/faces.tsx && git commit -m "feat(face): doll, sparkle, happy and cheeky faces"`

---

### Task 5: Chậu Giỏ đan (`basket`) — có điểm dừng chờ duyệt

**Files:**
- Create: `src/dev/sketch/pots.tsx`
- Modify: `src/dev/sketch/main.tsx` (SHEETS, nhóm mới `pots: 'Chậu'`), `src/content/pots/pots.tsx`, `src/content/pots/registry.ts`
- Test: `tests/unit/content/registries.test.tsx` (danh sách chậu)

- [ ] **Step 1: Phác thảo 3 bản giỏ đan** trong `src/dev/sketch/pots.tsx` (vẽ trong toạ độ 200×240, vành y 152–170, thân y 166–232; dùng `BasicPot` nếu hợp):
  - P1 giỏ mây đan ô chéo, quai cong phía trên;
  - P2 giỏ tre đan ngang, nơ đỏ;
  - P3 giỏ picnic kẻ ca-rô đỏ trắng phủ mép.
  Mỗi bản đặt Dâu tây S3 (`STRAWBERRY_LOOKS[2]`) vào để xem cùng cây; thêm `rattan` thật bên cạnh để chắc **khác** Giỏ mây hiện có.
- [ ] **Step 2: Chụp** `npm run sketch:shot -- pots "$TEMP/pots.png"` rồi xem ảnh.
- [ ] **Step 3: DỪNG — hỏi chủ repo chọn P1/P2/P3.** Không làm tiếp khi chưa có câu trả lời.
- [ ] **Step 4: Test đỏ** — thêm `'basket'` vào cuối danh sách id chậu kỳ vọng trong `registries.test.tsx` (tìm test liệt kê `POTS.map((p) => p.id)`); chạy → FAIL.
- [ ] **Step 5: Thêm chậu**: chép component đã chọn vào `pots.tsx` (`export function BasketPot()`), thêm dòng `{ id: 'basket', name: { vi: 'Giỏ đan', en: 'Woven basket' }, art: { svg: BasketPot } }` cuối `POTS`. Ghi bản đã chọn vào đầu `src/dev/sketch/pots.tsx`.
- [ ] **Step 6: Chạy** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 7: Commit** — `git add src/content/pots src/dev/sketch/pots.tsx src/dev/sketch/main.tsx tests/unit/content/registries.test.tsx && git commit -m "feat(pots): woven basket pot"`

---

### Task 6: Hạ tầng loài khoá + Cà chua

**Files:**
- Modify: `src/content/types.ts` (`PlantSpecies.locked?: true`), `src/content/catalog.ts`, `src/content/plants/registry.ts`
- Create: `src/content/plants/tomato.tsx`
- Modify: `src/dev/sketch/tomato.tsx` (ghi "đã vào app")
- Test: `tests/unit/content/plants.test.tsx`, `sayings.test.ts`/`praises.test.ts`/`taps.test.ts` (tự chạy theo `PLANTS`)

- [ ] **Step 1: Test đỏ** — trong `plants.test.tsx`:
  - đổi test "có 9 loài theo thứ tự" thành danh sách 10 loài (thêm `'tomato'`, tên `'Cà chua'` / `'Tomato'`);
  - map dáng thêm `tomato: ['arch', 'staked']`;
  - test `CATALOG khớp với registry` thêm `...(p.locked ? { locked: true } : {})` vào object kỳ vọng;
  - test mới:

```ts
  it('loài khoá: đúng 4 loài mới, nằm sau 9 loài cũ', () => {
    expect(PLANTS.filter((p) => p.locked).map((p) => p.id)).toEqual(['tomato']); // Task 7–9 mở rộng danh sách
    expect(PLANTS.slice(0, 9).every((p) => !p.locked)).toBe(true);
  });
```

Chạy `npx vitest run tests/unit/content` → FAIL.

- [ ] **Step 2: Kiểu + catalog**

`src/content/types.ts` trong `PlantSpecies`:

```ts
  /** loài mở khoá bằng ngày đạt (mỗi 90 ngày một lượt, người dùng tự chọn); không có = có sẵn */
  locked?: true;
```

`src/content/catalog.ts`:

```ts
  plants: PLANTS.map((p) => ({
    id: p.id, defaultPotId: p.defaultPotId,
    styles: (p.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt })),
    ...(p.locked ? { locked: true } : {}),
  })),
```

- [ ] **Step 3: `src/content/plants/tomato.tsx`**
  - Chép các hàm vẽ từ `src/dev/sketch/tomato.tsx` (`leafletPath`, `Leaflet`, `TomatoLeaf`, `Calyx`, `Tomato`, `Flower`, `Hang`, `Hook`, `Arch`, `Staked`, hằng màu). Bỏ `Cell`/`Row`/`Look`.
  - Hạt: `<Seed color="#F6E7C1" stripe="#E8CF95" />`; mầm: `<Sprout leaf="#5DAE5A" stem="#5E9E4F" />`.
  - Mặt mini của quả phụ (`cute` trong `Tomato`) giữ nguyên.
  - Export:

```ts
export const tomato: PlantSpecies = {
  id: 'tomato',
  name: { vi: 'Cà chua', en: 'Tomato' },
  defaultPotId: 'pink-cup',
  locked: true,
  faceStyle: 'doll',
  stages: { seed: { svg: TomatoSeed }, sprout: { svg: TomatoSprout }, bud: { svg: () => <Hook stage="bud" /> }, bloom: { svg: () => <Hook stage="bloom" /> } },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 }, sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 96, y: 94, scale: 0.55 }, bloom: { x: 96, y: 92, scale: 0.75 },
  },
  styles: [
    { id: 'arch', name: { vi: 'Cành cong', en: 'Arched vine' }, unlockAt: 10,
      stages: { bud: { svg: () => <Arch stage="bud" /> }, bloom: { svg: () => <Arch stage="bloom" /> } },
      faceAnchor: { bud: { x: 112, y: 88, scale: 0.55 }, bloom: { x: 112, y: 98, scale: 0.75 } } },
    { id: 'staked', name: { vi: 'Cọc tre', en: 'Bamboo stake' }, unlockAt: 20,
      stages: { bud: { svg: () => <Staked stage="bud" /> }, bloom: { svg: () => <Staked stage="bloom" /> } },
      faceAnchor: { bud: { x: 100, y: 54, scale: 0.52 }, bloom: { x: 100, y: 54, scale: 0.7 } } },
  ],
  sayings: {
    vi: ['Hôm nay mình chín đỏ hết việc nhé! 🍅', 'Cà chua tròn xoe cổ vũ bạn từng việc nhỏ!', 'Ngọt dần lên mỗi khi bạn tick một việc đó.'],
    en: ["Let's get every task ripe and red today! 🍅", 'A round little tomato cheering you on!', 'I get a little sweeter with every tick.'],
  },
  praises: {
    vi: ['Giỏi quá, mình đỏ thêm một chút rồi!', 'Thêm một việc xong, má mình hồng lên nè!'],
    en: ["Yay! I'm a little redder now!", 'One more done, my cheeks are glowing!'],
  },
  taps: {
    vi: ['Ui, đừng bóp mình nha, mình mọng nước lắm!', 'Hihi, nhột quá!', 'Mình là quả, không phải rau đâu nhé!'],
    en: ["Careful, I'm super juicy!", 'Hehe, that tickles!', "I'm a fruit, not a veggie, okay?"],
  },
};
```

(`stages` cần `FC`; nếu `{ svg: () => <Hook .../> }` vi phạm lint `react/display-name` thì khai báo hàm đặt tên `TomatoBud`, `TomatoBloom`, … như `orange.tsx`.)

- [ ] **Step 4: Đăng ký**: `PLANTS = [..., tulip, tomato]` trong `registry.ts`.
- [ ] **Step 5: Chạy** `npx tsc --noEmit && npm test` → PASS (ensureToday không bốc tomato nhờ Task 2; nếu test nào đếm 9 loài trong `PLANTS` ngoài `plants.test` thì cập nhật).
- [ ] **Step 6: Soát hình**: `npm run sketch:shot -- "styles&p=tomato" "$TEMP/tomato-styles.png"` → xem ảnh, mặt nằm đúng quả.
- [ ] **Step 7: Commit** — `git add src/content tests/unit/content src/dev/sketch/tomato.tsx && git commit -m "feat(plants): tomato (locked)"`

---

### Task 7: Việt quất

**Files:** Create `src/content/plants/blueberry.tsx`; Modify `registry.ts`, `tests/unit/content/plants.test.tsx`, `src/dev/sketch/blueberry.tsx`

- [ ] **Step 1: Test đỏ**: `plants.test.tsx` — danh sách thêm `'blueberry'` / `'Việt quất'` / `'Blueberry'`; dáng `blueberry: ['branchy', 'cluster']`; danh sách loài khoá `['tomato', 'blueberry']`. Chạy → FAIL.
- [ ] **Step 2: `blueberry.tsx`**: chép `Crown`, `Berry`, `Leaf`, `Bell`, `Trunk`, `Cluster`, `Twin`, `Branchy`, hằng màu từ `src/dev/sketch/blueberry.tsx` (bỏ `bbFace`/`SketchFace`). Hạt `<Seed color="#5B6FD6" stripe="#8C9BEA" />`; mầm `<Sprout leaf="#5DAE5A" stem="#7A5238" />`.

```ts
export const blueberry: PlantSpecies = {
  id: 'blueberry',
  name: { vi: 'Việt quất', en: 'Blueberry' },
  defaultPotId: 'cat',
  locked: true,
  faceStyle: 'sparkle',
  stages: { seed: { svg: BlueberrySeed }, sprout: { svg: BlueberrySprout }, bud: { svg: TwinBud }, bloom: { svg: TwinBloom } },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 }, sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 80, y: 102, scale: 0.5 }, bloom: { x: 80, y: 102, scale: 0.65 },
  },
  styles: [
    { id: 'branchy', name: { vi: 'Cây nhánh', en: 'Branchy' }, unlockAt: 10,
      stages: { bud: { svg: BranchyBud }, bloom: { svg: BranchyBloom } },
      faceAnchor: { bud: { x: 100, y: 108, scale: 0.42 }, bloom: { x: 100, y: 106, scale: 0.55 } } },
    { id: 'cluster', name: { vi: 'Chùm quả', en: 'Berry bunch' }, unlockAt: 20,
      stages: { bud: { svg: ClusterBud }, bloom: { svg: ClusterBloom } },
      faceAnchor: { bud: { x: 100, y: 98, scale: 0.5 }, bloom: { x: 100, y: 96, scale: 0.62 } } },
  ],
  sayings: {
    vi: ['Mắt mình lấp lánh vì bạn đó! ✨', 'Hai anh em việt quất chúc bạn một ngày ngọt lịm!', 'Nhỏ thôi mà nhiều năng lượng lắm nha!'],
    en: ['My eyes sparkle because of you! ✨', 'The blueberry twins wish you a sweet day!', 'Small but packed with energy!'],
  },
  praises: {
    vi: ['Lấp lánh quá! Thêm một việc rồi!', 'Việt quất chín thêm một quả nè!'],
    en: ['Sparkly! One more done!', 'Another berry just ripened!'],
  },
  taps: {
    vi: ['Ơ, ai chọc mình đó? ✨', 'Mình tròn vo dễ lăn lắm đó nha!', 'Hihi, đừng hái mình vội nha!'],
    en: ['Hey, who poked me? ✨', "I'm round, I might roll away!", "Hehe, don't pick me yet!"],
  },
};
```

  Đặt tên hàm: `TwinBud = () => <Twin stage="bud" />` v.v. (hàm có tên).
- [ ] **Step 3: Đăng ký** sau `tomato`. **Step 4:** `npx tsc --noEmit && npm test` → PASS. **Step 5:** `npm run sketch:shot -- "styles&p=blueberry" "$TEMP/bb-styles.png"` soát. **Step 6:** `git commit -m "feat(plants): blueberry (locked)"` (add các file trên).

---

### Task 8: Cúc hoạ mi

**Files:** Create `src/content/plants/daisy.tsx`; Modify `registry.ts`, `plants.test.tsx`, `src/dev/sketch/daisy.tsx`

- [ ] **Step 1: Test đỏ**: thêm `'daisy'` / `'Cúc hoạ mi'` / `'Daisy'`; dáng `daisy: ['candelabra', 'single']`; khoá `['tomato', 'blueberry', 'daisy']` → FAIL.
- [ ] **Step 2: `daisy.tsx`**: chép `Daisy`, `DaisyBud`, `Leaf`, `Stem`, `Single`, `Bouquet`, `Candelabra`, hằng màu từ `src/dev/sketch/daisy.tsx` (bỏ `PlantScene`/`daisyFace`). Hạt `<Seed color="#F3E3B5" stripe="#E2C98A" />`; mầm `<Sprout leaf="#6FAE5F" stem="#6FAE5F" />`.

```ts
export const daisy: PlantSpecies = {
  id: 'daisy',
  name: { vi: 'Cúc hoạ mi', en: 'Daisy' },
  defaultPotId: 'glass-bowl',
  locked: true,
  faceStyle: 'happy',
  stages: { seed: { svg: DaisySeed }, sprout: { svg: DaisySprout }, bud: { svg: BouquetBud }, bloom: { svg: BouquetBloom } },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 }, sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 102, y: 87, scale: 0.55 }, bloom: { x: 102, y: 79, scale: 0.6 },
  },
  styles: [
    { id: 'candelabra', name: { vi: 'Đèn nến', en: 'Candelabra' }, unlockAt: 10,
      stages: { bud: { svg: CandelabraBud }, bloom: { svg: CandelabraBloom } },
      faceAnchor: { bud: { x: 100, y: 59, scale: 0.5 }, bloom: { x: 100, y: 53, scale: 0.55 } } },
    { id: 'single', name: { vi: 'Một bông', en: 'Single bloom' }, unlockAt: 20,
      stages: { bud: { svg: SingleBud }, bloom: { svg: SingleBloom } },
      faceAnchor: { bud: { x: 100, y: 89, scale: 0.6 }, bloom: { x: 100, y: 67, scale: 0.72 } } },
  ],
  sayings: {
    vi: ['Cười híp mắt chào ngày mới nè! 🌼', 'Cúc nhỏ xinh tin bạn làm được hết!', 'Mỗi cánh hoa là một lời chúc cho bạn.'],
    en: ['Squinty-smiling at the new day! 🌼', 'This little daisy believes in you!', 'Every petal is a little wish for you.'],
  },
  praises: {
    vi: ['Yêu ghê! Thêm một cánh hoa nở rồi!', 'Giỏi quá đi, mình cười tít mắt luôn!'],
    en: ['Love it! Another petal opened!', "So proud, I can't stop smiling!"],
  },
  taps: {
    vi: ['Hihi, mình đang cười sẵn rồi nè!', 'Yêu, không yêu, yêu… yêu bạn!', 'Nhẹ tay nha, cánh mình mỏng lắm!'],
    en: ["Hehe, I'm already smiling!", 'Loves me, loves me not… loves you!', "Gently, my petals are thin!"],
  },
};
```

- [ ] **Step 3: Đăng ký** sau `blueberry`. **Step 4:** tsc + test → PASS. **Step 5:** `npm run sketch:shot -- "styles&p=daisy,sunflower" "$TEMP/daisy-styles.png"` soát (dáng `single` cạnh Hướng dương là ngoại lệ đã chốt). **Step 6:** `git commit -m "feat(plants): daisy (locked)"`.

---

### Task 9: Dâu tây

**Files:** Create `src/content/plants/strawberry.tsx`; Modify `registry.ts`, `plants.test.tsx`, `src/dev/sketch/strawberry.tsx`

- [ ] **Step 1: Test đỏ**: thêm `'strawberry'` / `'Dâu tây'` / `'Strawberry'`; dáng `strawberry: ['patch', 'twig']`; khoá `['tomato', 'blueberry', 'daisy', 'strawberry']` → FAIL. (Test "mỗi loài có chậu mặc định khác nhau" cần `basket` từ Task 5.)
- [ ] **Step 2: `strawberry.tsx`**: chép `Calyx`, `Berry`, `Flower`, `TriLeaf`, `Vine`, `Twig`, `Rosette`, `Giant`, hằng màu từ `src/dev/sketch/strawberry.tsx` (bỏ `strawberryFace`). S2 Bụi thấp: tăng `s` của `TriLeaf` lên ~1.3 cho khóm lá to hơn (đã hứa ở phác thảo). Hạt `<Seed color="#F0433A" stripe="#FFE08A" />`; mầm `<Sprout leaf="#4FA65B" stem="#5DAE5A" />`.

```ts
export const strawberry: PlantSpecies = {
  id: 'strawberry',
  name: { vi: 'Dâu tây', en: 'Strawberry' },
  defaultPotId: 'basket',
  locked: true,
  faceStyle: 'cheeky',
  stages: { seed: { svg: StrawberrySeed }, sprout: { svg: StrawberrySprout }, bud: { svg: GiantBud }, bloom: { svg: GiantBloom } },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 }, sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 120, scale: 0.7 }, bloom: { x: 100, y: 108, scale: 0.95 },
  },
  styles: [
    { id: 'patch', name: { vi: 'Bụi thấp', en: 'Berry patch' }, unlockAt: 10,
      stages: { bud: { svg: RosetteBud }, bloom: { svg: RosetteBloom } },
      faceAnchor: { bud: { x: 100, y: 124, scale: 0.4 }, bloom: { x: 100, y: 122, scale: 0.55 } } },
    { id: 'twig', name: { vi: 'Cành treo quả', en: 'Hanging twig' }, unlockAt: 20,
      stages: { bud: { svg: TwigBud }, bloom: { svg: TwigBloom } },
      faceAnchor: { bud: { x: 86, y: 82, scale: 0.42 }, bloom: { x: 84, y: 88, scale: 0.62 } } },
  ],
  sayings: {
    vi: ['Nháy mắt một cái, làm xong việc liền! 😜', 'Dâu tây tinh nghịch chúc bạn ngày ngọt ngào!', 'Hôm nay mình đỏ mọng, bạn thì sao?'],
    en: ['One wink and the task is done! 😜', 'A cheeky strawberry wishes you a sweet day!', "I'm ripe and red today, how about you?"],
  },
  praises: {
    vi: ['Hehe, giỏi ghê ta!', 'Ngọt như dâu luôn, thêm một việc rồi!'],
    en: ["Hehe, look at you go!", 'Sweet as a berry, one more done!'],
  },
  taps: {
    vi: ['Lêu lêu, không bắt được mình đâu! 😜', 'Ê, hạt mình đếm không hết đâu nha!', 'Chọc nữa là mình lè lưỡi đó!'],
    en: ["Nyeh, can't catch me! 😜", "Hey, you'll never count all my seeds!", "Poke again and I'll stick my tongue out!"],
  },
};
```

- [ ] **Step 3: Đăng ký** sau `daisy`. **Step 4:** tsc + test → PASS. **Step 5:** soát `npm run sketch:shot -- "styles&p=strawberry,tomato" "$TEMP/sb-styles.png"`. **Step 6:** `git commit -m "feat(plants): strawberry (locked)"`.

---

### Task 10: Mục "Cây mới" trong bảng Đổi cây

**Files:**
- Create: `src/components/NewPlants.tsx`
- Modify: `src/components/PlantPicker.tsx` (lưới chỉ loài không khoá; render `NewPlants` sau lưới), `src/app/theme.css` (hoặc file CSS của picker: `.new-plants`, `.picker__item.is-locked`), `src/i18n/vi.ts` + `en.ts` (mục `picker`)
- Test: `tests/unit/components/PlantPotSheet.test.tsx`

**Interfaces:**
- Consumes: `plantUnlockState`, `unlockPlant` (Task 1); `PLANTS` có `locked` (Task 6–9)
- Produces: `<NewPlants currentId currentSpecialId onPick />`; testid `picker-new-plants`, `new-plant-<id>` (`data-locked="true|false"`), `plant-unlock-progress`, `plant-unlocked`

- [ ] **Step 1: Chữ** — `vi.ts` mục `picker`:

```ts
    newPlantsHeading: '🌱 Cây mới',
    goodDayRule: 'Ngày đạt = xong hết việc hoặc xong hết thói quen',
    goodDays: (n: number, at: number) => `${n}/${at} ngày đạt`,
    unlockProgress: 'Tiến độ mở cây mới',
    freeSlots: (n: number) => `Bạn được mở ${n} cây mới, chạm để chọn`,
    lockedPlant: (name: string) => `${name} (đang khoá)`,
    unlock: (name: string) => `Mở khoá: ${name}`,
    cancel: 'Thôi',
    needMore: (n: number) => `Còn ${n} ngày đạt nữa để mở`,
    unlocked: (name: string) => `Đã mở khoá ${name}!`,
    allPlantsUnlocked: 'Đã mở hết cây mới!',
```

`en.ts` mục `picker`:

```ts
    newPlantsHeading: '🌱 New plants',
    goodDayRule: 'A good day = all tasks done or all habits done',
    goodDays: (n: number, at: number) => `${n}/${at} good days`,
    unlockProgress: 'New plant progress',
    freeSlots: (n: number) => `You can unlock ${n} new plant${n === 1 ? '' : 's'}, tap one to choose`,
    lockedPlant: (name: string) => `${name} (locked)`,
    unlock: (name: string) => `Unlock: ${name}`,
    cancel: 'Not now',
    needMore: (n: number) => `${n} more good day${n === 1 ? '' : 's'} to unlock`,
    unlocked: (name: string) => `${name} unlocked!`,
    allPlantsUnlocked: 'All new plants unlocked!',
```

- [ ] **Step 2: Test đỏ** (`PlantPotSheet.test.tsx`, dùng `CATALOG` thật nếu file đang dùng; nếu file dùng `TEST_CATALOG` thì render với `makeDeps(undefined, CATALOG)` vì `PlantPicker` đọc `PLANTS` thật):

```tsx
describe('Cây mới', () => {
  const ninety = () => Array.from({ length: 90 }, (_, i) => makeDay({ date: addDays('2026-10-01', -i), finalStage: 'bloom' }));

  it('loài khoá không nằm trong lưới chính; mục Cây mới có 4 ô khoá và tiến độ', async () => {
    const { deps } = makeDeps(undefined, CATALOG);
    const day = await ensureToday(deps);
    renderSheet(deps, day); // helper sẵn có của file mở PlantPotSheet open
    const grid = await screen.findByTestId('picker-new-plants');
    expect(within(grid).getAllByTestId(/^new-plant-/)).toHaveLength(4);
    expect(within(grid).getByTestId('new-plant-tomato').getAttribute('data-locked')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Cà chua' })).toBeNull();
    expect(await screen.findByTestId('plant-unlock-progress')).toHaveTextContent('0/90 ngày đạt');
  });

  it('chưa có lượt: chạm ô khoá chỉ nhắc còn bao nhiêu ngày', async () => {
    const { deps } = makeDeps(undefined, CATALOG);
    const day = await ensureToday(deps);
    renderSheet(deps, day);
    await userEvent.click(await screen.findByRole('button', { name: 'Cà chua (đang khoá)' }));
    expect(await screen.findByText('Còn 90 ngày đạt nữa để mở')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mở khoá: Cà chua' })).toBeNull();
  });

  it('có lượt: chạm → Mở khoá → mừng, ô thành chọn được; bấm hai lần chỉ mở một cây', async () => {
    const { deps } = makeDeps(undefined, CATALOG);
    await deps.db.days.bulkPut(ninety());
    const day = await ensureToday(deps);
    const onPick = vi.fn();
    renderSheet(deps, day, { onPickPlant: onPick });
    expect(await screen.findByText('Bạn được mở 1 cây mới, chạm để chọn')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cà chua (đang khoá)' }));
    const go = screen.getByRole('button', { name: 'Mở khoá: Cà chua' });
    await userEvent.dblClick(go);
    expect(await screen.findByTestId('plant-unlocked')).toHaveTextContent('Đã mở khoá Cà chua!');
    expect(await getSetting(deps.db, 'unlockedPlants')).toEqual(['tomato']);
    await userEvent.click(await screen.findByRole('button', { name: 'Cà chua' }));
    expect(onPick).toHaveBeenCalledWith('tomato', null, 'base');
  });
});
```

Chạy `npx vitest run tests/unit/components/PlantPotSheet.test.tsx -t "Cây mới"` → FAIL.

- [ ] **Step 3: `src/components/NewPlants.tsx`**

```tsx
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { PlantScene } from './PlantScene';
import { useDeps } from '../app/deps';
import { PLANTS } from '../content/plants/registry';
import { plantUnlockState, unlockPlant } from '../domain/plantUnlocks';
import { BASE_STYLE_ID } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';

interface Props {
  currentId: string;
  currentSpecialId: string | null;
  onPick: (plantId: string, specialId: string | null, styleId: string) => void;
}

/** Mục "Cây mới" của tab Cây: loài khoá (mờ + ổ khoá), tiến độ ngày đạt, mở bằng lượt (mỗi 90 ngày đạt). */
export function NewPlants({ currentId, currentSpecialId, onPick }: Props) {
  const { t, tr } = useI18n();
  const deps = useDeps();
  const state = useLiveQuery(() => plantUnlockState(deps), [deps]);
  const [asking, setAsking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!justUnlocked) return;
    const id = setTimeout(() => setJustUnlocked(null), 5000);
    return () => clearTimeout(id);
  }, [justUnlocked]);
  if (!state) return null;
  const species = PLANTS.filter((p) => p.locked);
  const base = state.nextAt === null ? null : state.nextAt;

  const unlock = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await unlockPlant(deps, id);
      setJustUnlocked(id);
      setAsking(null);
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="new-plants">
      <h3 className="picker__heading">{t.picker.newPlantsHeading}</h3>
      {base !== null && (
        <div data-testid="plant-unlock-progress" className="new-plants__progress">
          <progress aria-label={t.picker.unlockProgress} max={base} value={Math.min(state.goodDays, base)} />
          <span>{t.picker.goodDays(state.goodDays, base)}</span>
        </div>
      )}
      {base === null && <p className="sheet__hint">{t.picker.allPlantsUnlocked}</p>}
      <p className="sheet__hint">{state.freeSlots > 0 ? t.picker.freeSlots(state.freeSlots) : t.picker.goodDayRule}</p>
      {justUnlocked && (
        <p className="new-plants__done" data-testid="plant-unlocked" role="status">{t.picker.unlocked(tr(species.find((p) => p.id === justUnlocked)!.name))}</p>
      )}
      {error && <p className="sheet__hint" role="alert">{error}</p>}
      <div className="picker" data-testid="picker-new-plants">
        {species.map((p) => {
          const open = state.unlocked.includes(p.id);
          const name = tr(p.name);
          const selected = open && p.id === currentId && !currentSpecialId;
          return (
            <div key={p.id} className="picker__cell" data-testid={`new-plant-${p.id}`} data-locked={!open}>
              <button
                type="button"
                className={`picker__item${selected ? ' is-selected' : ''}${open ? '' : ' is-locked'}`}
                aria-label={open ? name : t.picker.lockedPlant(name)}
                aria-pressed={open ? selected : undefined}
                onClick={() => {
                  if (open) return onPick(p.id, null, BASE_STYLE_ID);
                  setError(null);
                  if (state.freeSlots > 0) setAsking(p.id);
                  else setHint(p.id);
                }}
              >
                <PlantScene className="picker__scene" testId="picker-scene" plantId={p.id} potId={p.defaultPotId} stage="bloom" specialId={null} mood="smile" />
                <span>{name}</span>
                {!open && <span className="new-plants__lock" aria-hidden="true">🔒</span>}
              </button>
              {asking === p.id && (
                <div className="new-plants__confirm">
                  <button type="button" className="btn btn--primary" disabled={busy} onClick={() => unlock(p.id)}>{t.picker.unlock(name)}</button>
                  <button type="button" className="btn" onClick={() => setAsking(null)}>{t.picker.cancel}</button>
                </div>
              )}
              {hint === p.id && base !== null && <p className="sheet__hint">{t.picker.needMore(base - state.goodDays)}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

(Ổ khoá: CLAUDE.md cấm emoji cho icon chức năng — nếu `icons.tsx` chưa có `LockIcon`, thêm một icon SVG 32×32 `LockIcon` theo phong cách bộ icon, `data-icon="lock"`, và dùng nó thay `🔒`. Tên class nút: dùng đúng class nút đang có trong dự án — tìm `DeleteWithConfirm` để chép class `Xác nhận` / `Thôi`.)

- [ ] **Step 4: `PlantPicker.tsx`** — lưới chính: `PLANTS.filter((p) => !p.locked).map(...)`; sau lưới chính (trước mục cây đặc biệt) render `<NewPlants currentId={currentId} currentSpecialId={currentSpecialId} onPick={onPick} />`. Nút dáng của loài đã mở: trong `NewPlants`, khi `open && p.styles?.length`, render cùng nút `picker__style-btn` như lưới chính — **tách** nút dáng thành component `StyleButton` dùng chung (đang inline trong `PlantPicker`), truyền `unlockedStyles` và `onStyleFor` xuống `NewPlants`.
- [ ] **Step 5: CSS** — `.picker__item.is-locked .picker__scene { opacity: .35; filter: grayscale(1); }` (filter CSS trên phần tử HTML bọc SVG là được; chỉ cấm trên `<g>` trong SVG), `.new-plants__lock` góc phải trên ô, `.new-plants__confirm { display:flex; gap:6px; margin-top:4px }`, `.new-plants__progress` giống thanh tiến độ dáng (tìm class thanh `Tiến độ mở dáng` và dùng lại).
- [ ] **Step 6: Chạy** `npx tsc --noEmit && npm test` → PASS (kể cả `no-hardcoded-vi`).
- [ ] **Step 7: Commit** — `git add src/components src/app/theme.css src/i18n tests/unit/components/PlantPotSheet.test.tsx && git commit -m "feat(unlock): new plants section in the plant sheet"`

---

### Task 11: Hôm nay — chấm đỏ + khung mừng

**Files:**
- Modify: `src/screens/TodayScreen.tsx` (~140-165 cạnh `newStyles`, ~278 nút Đổi cây, ~241/382 khung), `src/i18n/vi.ts` + `en.ts` (mục `today`)
- Test: `tests/unit/screens/TodayScreen.test.tsx` (tìm file test của TodayScreen hiện có: `grep -rl "style-unlock" tests/unit`)

- [ ] **Step 1: Chữ** — `vi.ts` `today`: `plantUnlockReady: 'Đủ 90 ngày đạt! Mở 1 cây mới trong Đổi cây & chậu 🌱'`; `en.ts`: `plantUnlockReady: '90 good days! Unlock a new plant in Change plant & pot 🌱'`.
- [ ] **Step 2: Test đỏ**

```tsx
it('còn lượt mở cây: nút Đổi cây có chấm', async () => {
  const { deps } = makeDeps(undefined, CATALOG);
  await deps.db.days.bulkPut(Array.from({ length: 90 }, (_, i) => makeDay({ date: addDays('2026-10-01', -i), finalStage: 'bloom' })));
  renderWithDeps(<TodayScreen />, deps);
  const btn = await screen.findByRole('button', { name: 'Đổi cây & chậu' });
  await waitFor(() => expect(btn.querySelector('.icon-btn__badge')).not.toBeNull());
});

it('tick việc cuối làm đủ mốc 90 → khung plant-unlock-ready; mở màn khi đã đủ mốc thì không báo', async () => {
  const { deps } = makeDeps(undefined, CATALOG);
  await deps.db.days.bulkPut(Array.from({ length: 89 }, (_, i) => makeDay({ date: addDays('2026-10-01', -i), finalStage: 'bloom' })));
  const day = await ensureToday(deps);
  await addTodo(deps, day.date, 'Uống nước', 'morning');
  renderWithDeps(<TodayScreen />, deps);
  expect(screen.queryByTestId('plant-unlock-ready')).toBeNull();
  await userEvent.click(await screen.findByRole('checkbox', { name: 'Hoàn thành: Uống nước' }));
  expect(await screen.findByTestId('plant-unlock-ready')).toHaveTextContent('Đủ 90 ngày đạt!');
});
```

(Dùng đúng label checkbox / cách tick đang dùng trong test TodayScreen hiện có; `ensureToday` có thể đã thêm việc từ mẫu mặc định — dọn việc mẫu nếu có để "việc cuối" đúng nghĩa.) Chạy → FAIL.

- [ ] **Step 3: Sửa `TodayScreen`**

```tsx
  // lượt mở cây mới: chấm ở nút Đổi cây; mừng khi số lượt đã kiếm TĂNG lúc màn đang mở (không mừng ở lần đọc đầu)
  const plantUnlock = useLiveQuery(() => plantUnlockState(deps), [deps]);
  const seenEarned = useRef<number | null>(null);
  const [unlockReady, setUnlockReady] = useState(false);
  useEffect(() => {
    if (!plantUnlock) return;
    const earned = plantUnlock.unlocked.length + plantUnlock.freeSlots;
    if (seenEarned.current !== null && earned > seenEarned.current) setUnlockReady(true);
    seenEarned.current = earned;
  }, [plantUnlock]);
  useEffect(() => {
    if (!unlockReady) return;
    const id = setTimeout(() => setUnlockReady(false), 5000);
    return () => clearTimeout(id);
  }, [unlockReady]);
```

  - Nút Đổi cây: `badge={(plantUnlock?.freeSlots ?? 0) > 0}`.
  - Khung (cạnh `StyleUnlock`, cùng vị trí, ưu tiên: `newStyles` → `unlockReady` → `bugVisit`):

```tsx
{unlockReady && !newStyles.length && (
  <div className="special-intro style-unlock" data-testid="plant-unlock-ready" role="status">
    <span>{t.today.plantUnlockReady}</span>
  </div>
)}
```

  và thêm `!unlockReady` vào điều kiện hiện `BugVisit`.
  - `useLiveQuery(plantUnlockState)` phụ thuộc `days`, `habits`, `habitChecks`, `settings` → Dexie tự theo dõi các bảng được đọc, nên tick chip thói quen cũng cập nhật.
- [ ] **Step 4: Chạy** `npx tsc --noEmit && npm test` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "feat(unlock): badge and celebration on Today"` (add file sửa + test).

---

### Task 12: Khu vườn ẩn loài khoá

**Files:** Modify `src/screens/GardenScreen.tsx:26,47`; Test: test GardenScreen hiện có (`grep -rl "garden-plant-" tests/unit`) hoặc `tests/unit/screens/GardenScreen.test.tsx`

- [ ] **Step 1: Test đỏ**

```tsx
it('không có luống cho loài khoá chưa mở; có khi đã mở', async () => {
  const { deps } = makeDeps(undefined, CATALOG);
  renderWithDeps(<GardenScreen />, deps);
  await screen.findByTestId('garden-plant-sunflower');
  expect(screen.queryByTestId('garden-plant-tomato')).toBeNull();
  await setSetting(deps.db, 'unlockedPlants', ['tomato']);
  expect(await screen.findByTestId('garden-plant-tomato')).toBeInTheDocument();
});
```

→ FAIL.
- [ ] **Step 2: Sửa** — bỏ hằng `PLANT_IDS` cấp module, thay bằng:

```tsx
  const plantIds = useLiveQuery(async () => (await availablePlants(deps)).map((p) => p.id), [deps]) ?? PLANTS.filter((p) => !p.locked).map((p) => p.id);
  const report = gardenReport(records ?? [], plantIds, lo, hi, { todayKey, firstKey, separateSpecial });
```

  (dòng 207 dùng `PLANT_IDS[0]` → `PLANTS[0].id`).
- [ ] **Step 3:** `npx tsc --noEmit && npm test` → PASS. **Step 4:** `git commit -m "feat(unlock): garden hides locked plants"`.

---

### Task 13: E2E + bố cục

**Files:** Create `tests/e2e/unlock.spec.ts`; Modify `tests/e2e/layout.spec.ts`, `tests/e2e/i18n.spec.ts`

- [ ] **Step 1: `tests/e2e/unlock.spec.ts`** — dựng file sao lưu (theo mẫu `layout.spec.ts` dòng ~60-75: `format`, `schemaVersion`, `days`, `habits`, `habitChecks`…) có **60 ngày ra hoa + 30 ngày khác chỉ làm đủ một thói quen hằng ngày** (tổng 90 ngày đạt, kết thúc hôm qua), nạp qua Cài đặt → Khôi phục → Gộp (dùng helper nạp đang có trong `layout.spec.ts`; nếu nó là hàm cục bộ thì chuyển ra `tests/e2e/helpers.ts`). Rồi:

```ts
test('đủ 90 ngày đạt: chấm đỏ → mở Cà chua → chọn Cà chua cho hôm nay', async ({ page }) => {
  await restore(page, backupWith90GoodDays());
  await goTab(page, 'Hôm nay');
  const btn = page.getByRole('button', { name: 'Đổi cây & chậu' });
  await expect(btn.locator('.icon-btn__badge')).toBeVisible();
  await btn.click();
  await page.getByRole('button', { name: 'Cà chua (đang khoá)' }).click();
  await page.getByRole('button', { name: 'Mở khoá: Cà chua' }).click();
  await expect(page.getByTestId('plant-unlocked')).toBeVisible();
  await page.getByRole('button', { name: 'Cà chua', exact: true }).click();
  await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-plant', 'tomato');
  await expect(btn.locator('.icon-btn__badge')).toHaveCount(0);
});
```

- [ ] **Step 2: `i18n.spec.ts`** — cùng luồng bằng tiếng Anh: `Change plant & pot` (kiểm đúng nhãn trong `en.ts`), `Tomato (locked)`, `Unlock: Tomato`, `Tomato`.
- [ ] **Step 3: `layout.spec.ts`** — sau khi nạp dữ liệu, mở bảng Đổi cây, cuộn tới `picker-new-plants`, chạm một ô khoá để hiện hai nút xác nhận, gọi `expectFits`, chụp ảnh; cả lượt tiếng Anh.
- [ ] **Step 4: Chạy** (không song song với lượt khác, ghi ra file):
  - `npx playwright test tests/e2e/unlock.spec.ts tests/e2e/i18n.spec.ts > pw.log 2>&1; grep -E "passed|failed" pw.log`
  - `npx playwright test tests/e2e/layout.spec.ts > pw-layout.log 2>&1; grep -E "passed|failed" pw-layout.log`
  - rồi toàn bộ `npm run e2e > pw-all.log 2>&1; grep -E "passed|failed" pw-all.log`
  Expected: mọi test pass; xem ảnh `test-results/layout/iphone-13/` và `android-360x640`.
- [ ] **Step 5: Commit** — `git commit -m "test(e2e): unlock a new plant"`.

---

### Task 14: Tài liệu, soát hình, kiểm tra cuối

**Files:** `CLAUDE.md`, `src/dev/sketch/{tomato,blueberry,daisy,strawberry}.tsx` (ghi đã chọn), `src/dev/sketch/main.tsx` (nhóm `species` → đổi tiêu đề "đã vào app")

- [ ] **Step 1: CLAUDE.md**
  - Bảng loài: thêm 4 dòng (id, tên, chậu, dáng, "khoá").
  - Bảng dáng: thêm 4 dòng; ghi **ngoại lệ do chủ repo chọn**: `tomato|staked` gần xương rồng, `blueberry|cluster` gần cây cam, `daisy|single` trùng dáng Gốc Hướng dương.
  - Mục mới *Cây mới mở khoá* (dưới *Đổi cây & chậu…*): luật 90 ngày đạt, `unlockedPlants`, `availablePlants` đọc trước transaction, chuỗi random giữ nguyên, giao diện `picker-new-plants`, `plant-unlock-ready`, Khu vườn ẩn loài khoá.
  - `FaceStyle` thêm 4 kiểu; chậu (13) thêm `basket`; settings thêm `unlockedPlants`; định dạng sao lưu thêm `"unlockedPlants"`.
- [ ] **Step 2: Soát hình WebKit**: `npm run sketch:shot -- styles "$TEMP/all-styles.png" 1600` (13 loài) và ảnh layout Khu vườn / Lịch; mỗi loài mới nhận ra ngay cạnh loài cũ.
- [ ] **Step 3: Kiểm tra cuối**: `npx tsc --noEmit && npm test && TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run && npm run build` → tất cả pass.
- [ ] **Step 4: Commit** — `git commit -m "docs: locked plants in CLAUDE.md"`; **push chỉ khi chủ repo đồng ý**, rồi theo dõi run CI mới nhất.
