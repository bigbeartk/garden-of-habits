# Nhắc việc (việc dài hạn) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm màn "Nhắc việc" (mở từ Cài đặt). Màn này theo dõi việc dài hạn có hạn; công tắc "Hôm nay" tự đưa việc vào buổi Sáng mỗi ngày cho tới khi xong; tick ở Hôm nay hoặc ở Nhắc việc thì cả hai bên đều đồng bộ.

**Architecture:** Bảng Dexie mới `reminders` (DB v5). `Todo` có thêm `reminderId?`. Mọi thao tác đồng bộ đi qua `mutateDay` trong `dayService`; hàm này nhận thêm tham số `sync`, chạy trong cùng transaction `[days, reminders]`. Logic hiển thị thuần nằm ở `reminderView.ts`, thao tác ở `reminderService.ts`, giao diện ở `RemindersScreen.tsx`.

**Tech Stack:** React 19 + TypeScript, Dexie (`useLiveQuery`), zod (sao lưu), Vitest + jsdom + fake-indexeddb, Playwright (WebKit iPhone 13).

**Spec:** `docs/superpowers/specs/2026-10-05-reminders-design.md`

## Global Constraints

- Mọi chữ trên giao diện bằng tiếng Việt.
- Giữ tên DB `chau-cay-chibi` và mã sao lưu `chau-cay-chibi-backup`. `SCHEMA_VERSION = 5`. Không sửa các `version(1..4)`.
- Màn hình không gọi thẳng `new Date()`/`Math.random`; dùng `useDeps()` (`deps.now()`).
- Mốc sang ngày mới là 04:00; khoá ngày dùng `dayKey(now)`.
- Chỉ hôm nay mới được thêm/sửa/xoá/tick todo (`mutateDay(..., 'today-only', ...)`).
- **Không** gọi hàm async đọc settings bên trong transaction rw (PrematureCommitError). Bên trong transaction chỉ thao tác trên các bảng đã khai báo trong scope.
- Việc rỗng không bao giờ được lưu.
- Nút tròn có `width`/`height` cố định thì đặt `padding: 0`. CSS safe-area viết `var(--safe-area-inset-x, env(safe-area-inset-x))`.
- Thêm màn con/bảng/chế độ sửa thì phải đăng ký `useBackHandler`.
- Commit chỉ khi mọi test pass; nối lệnh bằng `&&`; lọc output qua `| grep` thì bật `set -o pipefail`. Không pipe Playwright vào `| head`.
- Cuối commit message ghi `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Sao lưu làm mất `reminderId` của todo**: `TodoSchema` của zod tự bỏ khoá lạ. Khôi phục xong thì todo phải còn `reminderId` (Task 5 có test).
2. **Bật Hôm nay hai lần / bật lại sau khi tắt khi việc đã có ở hôm nay**: không bao giờ có 2 todo cùng `reminderId` trong một ngày (Task 3 có test).
3. **Bật công tắc khi hôm nay chưa có bản ghi** (mở thẳng Cài đặt từ sáng sớm, trước khi `ensureToday` chạy): chỉ đặt cờ, không lỗi; `ensureToday` thêm việc sau (Task 3 có test).
4. **Tick việc nhắc ở màn Nhắc việc khi việc đang ở Hôm nay**: todo hôm nay cũng xong, cây lớn (`finalStage` đổi) (Task 3 có test).
5. **Ngày cũ còn todo chưa xong mang `reminderId`**: ngày mới vẫn thêm lại đúng một lần, ngày cũ không bị đụng (Task 3 có test `ensureToday` qua 2 ngày).

---

## File Structure

| File | Trách nhiệm |
|---|---|
| `src/domain/types.ts` (sửa) | `Reminder`, `Todo.reminderId?` |
| `src/db/db.ts` (sửa) | `version(5)` thêm bảng `reminders` |
| `src/domain/reminderView.ts` (mới) | logic thuần: `dueStatus`, `activeReminders`, `weekStart`, `doneThisWeek`, `formatDue` |
| `src/domain/dayService.ts` (sửa) | `mutateDay` export + tham số `sync`; `reminderTodo`; `ensureToday` thêm việc nhắc; đồng bộ khi toggle/edit/delete |
| `src/domain/reminderService.ts` (mới) | `addReminder`, `setReminderAutoToday`, `toggleReminderDone`, `editReminder`, `deleteReminder` |
| `src/db/backup.ts` (sửa) | `reminders` trong file sao lưu, `reminderId` trong todo |
| `src/components/icons.tsx` (sửa) | `BellIcon` (`data-icon="bell"`) |
| `src/screens/RemindersScreen.tsx` + `reminders.css` (mới) | màn Nhắc việc |
| `src/screens/SettingsScreen.tsx` (sửa) | thẻ "Nhắc việc" đầu tiên, mở màn, Back Android |
| `src/components/TodoList.tsx` + `todo.css` (sửa) | icon chuông trước chữ của todo có `reminderId` |
| `tests/e2e/app.spec.ts` (sửa) | E2E luồng chính + ảnh chụp |
| `CLAUDE.md` (sửa) | tài liệu |

---

### Task 1: Kiểu dữ liệu + DB v5

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/db/db.ts`
- Test: `tests/unit/db/db.test.ts`

**Interfaces:**
- Produces: `interface Reminder { id; text; dueDate: string | null; autoToday: boolean; doneAt: number | null; createdAt; updatedAt }`, `Todo.reminderId?: string`, `PlantDB.reminders: EntityTable<Reminder, 'id'>`, `SCHEMA_VERSION = 5`.

- [ ] **Step 1: Viết test đỏ** (thêm vào cuối `tests/unit/db/db.test.ts`; nếu file chưa import `makeDb` / `SCHEMA_VERSION` thì thêm import `import { makeDb } from '../helpers';` và `import { SCHEMA_VERSION } from '../../../src/db/db';`)

```ts
describe('DB v5: bảng nhắc việc', () => {
  it('SCHEMA_VERSION là 5 và lưu/đọc được việc nhắc', async () => {
    expect(SCHEMA_VERSION).toBe(5);
    const db = makeDb();
    await db.reminders.put({ id: 'r1', text: 'Mua quà', dueDate: '2026-10-20', autoToday: false, doneAt: null, createdAt: 1, updatedAt: 1 });
    expect((await db.reminders.get('r1'))?.text).toBe('Mua quà');
  });
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/db/db.test.ts`
Expected: FAIL (`SCHEMA_VERSION` là 4 / `db.reminders` undefined).

- [ ] **Step 3: Code**

`src/domain/types.ts`: trong `Todo` thêm sau `period`:

```ts
  /** việc đến từ màn Nhắc việc (id của `Reminder`); không có = việc thường */
  reminderId?: string;
```

Thêm sau `PlannedGoal`:

```ts
/** Việc dài hạn ở màn Nhắc việc; bật `autoToday` thì mỗi ngày tự vào buổi Sáng của hôm nay cho tới khi xong. */
export interface Reminder {
  id: string;
  text: string;
  /** 'YYYY-MM-DD'; null = không hạn */
  dueDate: string | null;
  /** công tắc "Hôm nay" */
  autoToday: boolean;
  /** ms; null = chưa xong */
  doneAt: number | null;
  createdAt: number;
  updatedAt: number;
}
```

`src/db/db.ts`: import thêm `Reminder`; đổi `SCHEMA_VERSION = 5`; thêm field `reminders!: EntityTable<Reminder, 'id'>;`; sau `version(4)` thêm:

```ts
    // v5: bảng việc nhắc (việc dài hạn, màn Nhắc việc).
    this.version(5).stores({ days: 'date', templates: 'id, createdAt', settings: 'key', planned: 'id, date', plannedGoals: 'date', reminders: 'id' });
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/unit/db`
Expected: test mới PASS. `backup.test.ts` có 2 assertion `schemaVersion).toBe(4)`: sửa thành `toBe(5)` và đổi tên test `'file mới ghi schemaVersion hiện tại (3)'` thành `'file mới ghi schemaVersion hiện tại'`. Chạy lại → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/types.ts src/db/db.ts tests/unit/db && git commit -m "feat(reminders): Reminder type and DB v5 table"
```

---

### Task 2: Logic hiển thị thuần `reminderView.ts`

**Files:**
- Create: `src/domain/reminderView.ts`
- Test: `tests/unit/domain/reminderView.test.ts`

**Interfaces:**
- Consumes: `Reminder` (Task 1), `dayKey`, `addDays`, `parseDayKey` (`src/domain/dayKey.ts`).
- Produces: `type DueStatus = 'overdue' | 'soon' | 'normal'`, `SOON_DAYS = 3`, `dueStatus(dueDate: string | null, todayKey: string): DueStatus | null`, `activeReminders(list: Reminder[]): Reminder[]`, `weekStart(todayKey: string): string`, `doneThisWeek(list: Reminder[], todayKey: string): Reminder[]`, `formatDue(dueDate: string): string`.

- [ ] **Step 1: Viết test đỏ** `tests/unit/domain/reminderView.test.ts`

```ts
import { activeReminders, doneThisWeek, dueStatus, formatDue, weekStart } from '../../../src/domain/reminderView';
import type { Reminder } from '../../../src/domain/types';

const rem = (p: Partial<Reminder> & { id: string }): Reminder => ({
  text: p.id, dueDate: null, autoToday: false, doneAt: null, createdAt: 0, updatedAt: 0, ...p,
});

describe('dueStatus', () => {
  it('quá hạn / sắp tới (≤ 3 ngày) / còn xa / không hạn', () => {
    expect(dueStatus('2026-10-04', '2026-10-05')).toBe('overdue');
    expect(dueStatus('2026-10-05', '2026-10-05')).toBe('soon');
    expect(dueStatus('2026-10-08', '2026-10-05')).toBe('soon');
    expect(dueStatus('2026-10-09', '2026-10-05')).toBe('normal');
    expect(dueStatus(null, '2026-10-05')).toBeNull();
  });
});

describe('activeReminders', () => {
  it('chỉ việc chưa xong, hạn gần trước, không hạn cuối, cùng hạn theo createdAt', () => {
    const list = [
      rem({ id: 'none', createdAt: 1 }),
      rem({ id: 'nov', dueDate: '2026-11-14', createdAt: 2 }),
      rem({ id: 'oct20b', dueDate: '2026-10-20', createdAt: 5 }),
      rem({ id: 'oct20a', dueDate: '2026-10-20', createdAt: 3 }),
      rem({ id: 'done', dueDate: '2026-10-01', doneAt: 10 }),
    ];
    expect(activeReminders(list).map((r) => r.id)).toEqual(['oct20a', 'oct20b', 'nov', 'none']);
  });
});

describe('tuần', () => {
  it('weekStart là thứ Hai của tuần (kể cả khi hôm nay là Chủ nhật)', () => {
    expect(weekStart('2026-10-05')).toBe('2026-10-05'); // thứ Hai
    expect(weekStart('2026-10-07')).toBe('2026-10-05');
    expect(weekStart('2026-10-11')).toBe('2026-10-05'); // Chủ nhật
  });

  it('doneThisWeek: xong từ 4:00 thứ Hai trở đi, mới xong lên trên', () => {
    const list = [
      rem({ id: 'sunday-night', doneAt: new Date(2026, 9, 5, 3, 0).getTime() }), // 3:00 sáng thứ Hai = vẫn là Chủ nhật
      rem({ id: 'mon', doneAt: new Date(2026, 9, 5, 9, 0).getTime() }),
      rem({ id: 'wed', doneAt: new Date(2026, 9, 7, 9, 0).getTime() }),
      rem({ id: 'active' }),
    ];
    expect(doneThisWeek(list, '2026-10-07').map((r) => r.id)).toEqual(['wed', 'mon']);
  });
});

it('formatDue ra dd/mm', () => {
  expect(formatDue('2026-10-20')).toBe('20/10');
  expect(formatDue('2026-01-05')).toBe('05/01');
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/domain/reminderView.test.ts`
Expected: FAIL (module chưa có).

- [ ] **Step 3: Code** `src/domain/reminderView.ts`

```ts
import { addDays, dayKey, parseDayKey } from './dayKey';
import type { Reminder } from './types';

export type DueStatus = 'overdue' | 'soon' | 'normal';
/** còn từng này ngày (tính cả hôm nay) thì hạn tô màu "sắp tới" */
export const SOON_DAYS = 3;

export function dueStatus(dueDate: string | null, todayKey: string): DueStatus | null {
  if (!dueDate) return null;
  if (dueDate < todayKey) return 'overdue';
  return dueDate <= addDays(todayKey, SOON_DAYS) ? 'soon' : 'normal';
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Việc chưa xong: hạn gần nhất trước, không hạn ở cuối; cùng hạn thì việc thêm trước đứng trước. */
export function activeReminders(list: Reminder[]): Reminder[] {
  return list
    .filter((r) => r.doneAt === null)
    .sort((a, b) => cmp(a.dueDate ?? '9999', b.dueDate ?? '9999') || a.createdAt - b.createdAt);
}

/** Thứ Hai của tuần chứa `todayKey`. */
export function weekStart(todayKey: string): string {
  const dow = parseDayKey(todayKey).getDay(); // 0 = Chủ nhật
  return addDays(todayKey, -((dow + 6) % 7));
}

/** Việc xong trong tuần này (theo mốc 4:00), mới xong đứng trên. */
export function doneThisWeek(list: Reminder[], todayKey: string): Reminder[] {
  const from = weekStart(todayKey);
  return list
    .filter((r): r is Reminder & { doneAt: number } => r.doneAt !== null && dayKey(new Date(r.doneAt)) >= from)
    .sort((a, b) => b.doneAt - a.doneAt);
}

export function formatDue(dueDate: string): string {
  const [, m, d] = dueDate.split('-');
  return `${d}/${m}`;
}
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/unit/domain/reminderView.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/reminderView.ts tests/unit/domain/reminderView.test.ts && git commit -m "feat(reminders): pure sorting, due status and week helpers"
```

---

### Task 3: Đồng bộ trong `dayService` + `reminderService`

**Files:**
- Modify: `src/domain/dayService.ts` (`ensureToday`, `mutateDay`, `toggleTodo`, `editTodo`, `deleteTodo`)
- Create: `src/domain/reminderService.ts`
- Test: `tests/unit/domain/reminderService.test.ts`

**Interfaces:**
- Consumes: `Reminder`, `PlantDB.reminders` (Task 1).
- Produces:
  - `dayService`: `export async function mutateDay(deps, date, kind: 'today-only' | 'note', fn: (day: DayRecord) => void, sync?: (day: DayRecord) => Promise<unknown>): Promise<DayRecord>`; `export function reminderTodo(r: Pick<Reminder, 'id' | 'text'>, order: number): Todo`.
  - `reminderService`: `addReminder(deps, text: string, dueDate: string | null): Promise<Reminder>`; `setReminderAutoToday(deps, id: string, on: boolean): Promise<void>`; `toggleReminderDone(deps, id: string): Promise<ToggleResult | null>`; `editReminder(deps, id: string, changes: { text?: string; dueDate?: string | null }): Promise<void>`; `deleteReminder(deps, id: string): Promise<void>`.

- [ ] **Step 1: Viết test đỏ** `tests/unit/domain/reminderService.test.ts`

```ts
import { deleteTodo, editTodo, ensureToday, toggleTodo } from '../../../src/domain/dayService';
import {
  addReminder, deleteReminder, editReminder, setReminderAutoToday, toggleReminderDone,
} from '../../../src/domain/reminderService';
import { makeDeps } from '../helpers';

const linked = (todos: { reminderId?: string }[], id: string) => todos.filter((t) => t.reminderId === id);

describe('thêm việc nhắc', () => {
  it('cắt khoảng trắng, hạn rỗng thành null, mặc định chưa bật Hôm nay; chữ rỗng bị từ chối', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const r = await addReminder(deps, '  Mua quà ', '');
    expect(r).toMatchObject({ text: 'Mua quà', dueDate: null, autoToday: false, doneAt: null });
    await expect(addReminder(deps, '   ', '2026-10-20')).rejects.toThrow('không được để trống');
    expect(await deps.db.reminders.count()).toBe(1);
  });

  it('thêm liên tiếp cùng thời điểm vẫn giữ thứ tự createdAt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const a = await addReminder(deps, 'A', null);
    const b = await addReminder(deps, 'B', null);
    expect(b.createdAt).toBeGreaterThan(a.createdAt);
  });
});

describe('công tắc Hôm nay', () => {
  it('bật: thêm ngay vào cuối buổi Sáng hôm nay, đúng một lần dù bật lại', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await deps.db.templates.put({ id: 't', name: 'M', items: [{ text: 'Tập', period: 'morning' }, { text: 'Đọc', period: 'evening' }], isDefault: true, createdAt: 1, updatedAt: 1 });
    await ensureToday(deps);
    const r = await addReminder(deps, 'Mua quà', '2026-10-20');
    await setReminderAutoToday(deps, r.id, true);
    await setReminderAutoToday(deps, r.id, true);
    const day = (await deps.db.days.get('2026-10-05'))!;
    expect(linked(day.todos, r.id)).toHaveLength(1);
    const morning = day.todos.filter((t) => t.period === 'morning').map((t) => t.text);
    expect(morning).toEqual(['Tập', 'Mua quà']);
    expect((await deps.db.reminders.get(r.id))!.autoToday).toBe(true);
  });

  it('bật khi hôm nay chưa có bản ghi: chỉ đặt cờ; ensureToday thêm sau', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const r = await addReminder(deps, 'Mua quà', null);
    await setReminderAutoToday(deps, r.id, true);
    expect(await deps.db.days.count()).toBe(0);
    const day = await ensureToday(deps);
    expect(linked(day.todos, r.id).map((t) => [t.text, t.period])).toEqual([['Mua quà', 'morning']]);
  });

  it('tắt: gỡ khỏi hôm nay nếu chưa xong; việc đã xong thì giữ', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(deps);
    const a = await addReminder(deps, 'A', null);
    const b = await addReminder(deps, 'B', null);
    await setReminderAutoToday(deps, a.id, true);
    await setReminderAutoToday(deps, b.id, true);
    const todoB = linked((await deps.db.days.get('2026-10-05'))!.todos, b.id)[0];
    await toggleTodo(deps, '2026-10-05', todoB.id);
    await setReminderAutoToday(deps, a.id, false);
    await setReminderAutoToday(deps, b.id, false);
    const day = (await deps.db.days.get('2026-10-05'))!;
    expect(day.todos.map((t) => t.text)).toEqual(['B']);
    expect((await deps.db.reminders.get(a.id))!.autoToday).toBe(false);
  });
});

describe('ensureToday với việc nhắc', () => {
  it('chưa xong thì ngày sau lại có (đúng một lần), ngày cũ giữ nguyên; xong rồi thì thôi', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(deps);
    const r = await addReminder(deps, 'Vẽ tranh', null);
    const off = await addReminder(deps, 'Không bật', null);
    await setReminderAutoToday(deps, r.id, true);
    clock.current = new Date(2026, 9, 6, 8, 0);
    const day2 = await ensureToday(deps);
    expect(linked(day2.todos, r.id)).toHaveLength(1);
    expect(linked(day2.todos, off.id)).toHaveLength(0);
    expect(linked((await deps.db.days.get('2026-10-05'))!.todos, r.id)[0].done).toBe(false);
    await toggleTodo(deps, '2026-10-06', linked(day2.todos, r.id)[0].id);
    clock.current = new Date(2026, 9, 7, 8, 0);
    expect(linked((await ensureToday(deps)).todos, r.id)).toHaveLength(0);
  });
});

describe('đồng bộ hai chiều', () => {
  async function setupLinked() {
    const ctx = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(ctx.deps);
    const r = await addReminder(ctx.deps, 'Mua quà', null);
    await setReminderAutoToday(ctx.deps, r.id, true);
    const todo = linked((await ctx.deps.db.days.get('2026-10-05'))!.todos, r.id)[0];
    return { ...ctx, r, todo };
  }

  it('tick ở Hôm nay → việc nhắc xong; bỏ tick → chưa xong', async () => {
    const { deps, r, todo } = await setupLinked();
    await toggleTodo(deps, '2026-10-05', todo.id);
    expect((await deps.db.reminders.get(r.id))!.doneAt).toBe(deps.now().getTime());
    await toggleTodo(deps, '2026-10-05', todo.id);
    expect((await deps.db.reminders.get(r.id))!.doneAt).toBeNull();
  });

  it('tick ở Nhắc việc → todo hôm nay cũng xong, cây lớn; trả về ToggleResult', async () => {
    const { deps, r, todo } = await setupLinked();
    const res = await toggleReminderDone(deps, r.id);
    expect(res?.completed).toBe(true);
    const day = (await deps.db.days.get('2026-10-05'))!;
    expect(day.todos.find((t) => t.id === todo.id)!.done).toBe(true);
    expect(day.finalStage).toBe('bloom');
    expect((await deps.db.reminders.get(r.id))!.doneAt).not.toBeNull();
    await toggleReminderDone(deps, r.id);
    expect((await deps.db.days.get('2026-10-05'))!.todos.find((t) => t.id === todo.id)!.done).toBe(false);
  });

  it('tick ở Nhắc việc khi không có ở hôm nay: chỉ đổi việc nhắc, trả về null', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const r = await addReminder(deps, 'Mua quà', null);
    expect(await toggleReminderDone(deps, r.id)).toBeNull();
    expect((await deps.db.reminders.get(r.id))!.doneAt).toBe(deps.now().getTime());
  });

  it('sửa chữ ở Hôm nay ↔ Nhắc việc cập nhật bên kia; đổi hạn không đụng todo', async () => {
    const { deps, r, todo } = await setupLinked();
    await editTodo(deps, '2026-10-05', todo.id, 'Mua quà sinh nhật');
    expect((await deps.db.reminders.get(r.id))!.text).toBe('Mua quà sinh nhật');
    await editReminder(deps, r.id, { text: '  Mua hoa ', dueDate: '2026-10-20' });
    expect((await deps.db.days.get('2026-10-05'))!.todos.find((t) => t.id === todo.id)!.text).toBe('Mua hoa');
    expect(await deps.db.reminders.get(r.id)).toMatchObject({ text: 'Mua hoa', dueDate: '2026-10-20' });
    await editReminder(deps, r.id, { dueDate: '' });
    expect((await deps.db.reminders.get(r.id))!.dueDate).toBeNull();
    await expect(editReminder(deps, r.id, { text: ' ' })).rejects.toThrow('không được để trống');
  });

  it('xoá ở Hôm nay → tắt Hôm nay để mai không quay lại', async () => {
    const { deps, r, todo } = await setupLinked();
    await deleteTodo(deps, '2026-10-05', todo.id);
    expect((await deps.db.reminders.get(r.id))!.autoToday).toBe(false);
  });

  it('xoá việc nhắc → gỡ todo chưa xong ở hôm nay', async () => {
    const { deps, r } = await setupLinked();
    await deleteReminder(deps, r.id);
    expect(await deps.db.reminders.get(r.id)).toBeUndefined();
    expect((await deps.db.days.get('2026-10-05'))!.todos).toEqual([]);
  });

  it('xoá việc nhắc đã xong → todo đã xong ở hôm nay vẫn giữ', async () => {
    const { deps, r } = await setupLinked();
    await toggleReminderDone(deps, r.id);
    await deleteReminder(deps, r.id);
    expect((await deps.db.days.get('2026-10-05'))!.todos.map((t) => t.done)).toEqual([true]);
  });
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/domain/reminderService.test.ts`
Expected: FAIL (module `reminderService` chưa có).

- [ ] **Step 3: Sửa `dayService.ts`**

Import thêm `Reminder` từ `./types`.

`ensureToday`: transaction scope thêm `db.reminders`:

```ts
  return db.transaction('rw', [db.days, db.templates, db.planned, db.plannedGoals, db.settings, db.reminders], async () => {
```

Sau dòng `const goal = await db.plannedGoals.get(date);` thêm:

```ts
    // việc nhắc đang bật "Hôm nay" mà chưa xong: thêm lại mỗi ngày (buổi Sáng) cho tới khi xong
    const reminders = (await db.reminders.toArray())
      .filter((r) => r.autoToday && r.doneAt === null)
      .sort((a, b) => a.createdAt - b.createdAt);
```

và đổi dòng `todos:` thành:

```ts
      todos: withReminders(toTodos([...(template?.items ?? []), ...planned], 0), reminders),
```

Thêm ngay dưới `toTodos`:

```ts
/** Todo nối với một việc nhắc, luôn vào buổi Sáng (người dùng tự kéo sang buổi khác). */
export function reminderTodo(r: Pick<Reminder, 'id' | 'text'>, order: number): Todo {
  return { id: newId(), text: r.text, period: 'morning', done: false, doneAt: null, order, reminderId: r.id };
}

function withReminders(todos: Todo[], reminders: Reminder[]): Todo[] {
  return [...todos, ...reminders.map((r, i) => reminderTodo(r, todos.length + i))];
}
```

`mutateDay`: export, thêm tham số `sync`, transaction scope `[db.days, db.reminders]`:

```ts
/**
 * Mọi thao tác sửa một ngày đi qua đây. `sync` chạy trong cùng transaction sau khi lưu ngày
 * (dùng để cập nhật việc nhắc nối với todo), chỉ được thao tác trên `days`/`reminders`.
 */
export async function mutateDay(
  deps: DayDeps, date: string, kind: EditKind, fn: (day: DayRecord) => void, sync?: (day: DayRecord) => Promise<unknown>,
): Promise<DayRecord> {
  ...
  const saved = await db.transaction('rw', [db.days, db.reminders], async () => {
    ...
    await db.days.put(day);
    if (sync) await sync(day);
    return day;
  });
```

(Giữ nguyên phần thân còn lại. `EditKind` đổi thành `export type EditKind`.)

`toggleTodo`:

```ts
export async function toggleTodo(deps: DayDeps, date: string, id: string): Promise<ToggleResult> {
  let prevStage: GrowthStage = 'seed';
  let completed = false;
  let linked: Todo | undefined;
  const day = await mutateDay(deps, date, 'today-only', (d) => {
    prevStage = d.finalStage;
    const todo = findTodo(d, id);
    todo.done = !todo.done;
    todo.doneAt = todo.done ? deps.now().getTime() : null;
    completed = todo.done;
    linked = todo;
  }, () => syncReminder(deps, linked?.reminderId, { doneAt: linked!.doneAt }));
  return { day, prevStage, completed };
}
```

Thêm helper (cạnh `findTodo`):

```ts
/** Cập nhật việc nhắc nối với todo (id lạ/đã xoá thì bỏ qua: `update` không làm gì). */
function syncReminder(deps: DayDeps, reminderId: string | undefined, patch: Partial<Reminder>): Promise<unknown> {
  if (!reminderId) return Promise.resolve();
  return deps.db.reminders.update(reminderId, { ...patch, updatedAt: deps.now().getTime() });
}
```

(Tham số `d` của `sync` không dùng thì viết `() =>`.)

`editTodo`:

```ts
  let reminderId: string | undefined;
  return mutateDay(deps, date, 'today-only', (d) => {
    const todo = findTodo(d, id);
    todo.text = clean;
    reminderId = todo.reminderId;
  }, () => syncReminder(deps, reminderId, { text: clean }));
```

`deleteTodo`:

```ts
export function deleteTodo(deps: DayDeps, date: string, id: string): Promise<DayRecord> {
  let reminderId: string | undefined;
  return mutateDay(deps, date, 'today-only', (d) => {
    reminderId = d.todos.find((t) => t.id === id)?.reminderId;
    d.todos = d.todos.filter((t) => t.id !== id);
  }, () => syncReminder(deps, reminderId, { autoToday: false })); // xoá ở Hôm nay: mai không tự thêm lại
}
```

- [ ] **Step 4: Tạo `src/domain/reminderService.ts`**

```ts
import { dayKey } from './dayKey';
import { mutateDay, reminderTodo, toggleTodo, type DayDeps, type ToggleResult } from './dayService';
import { newId } from './id';
import type { DayRecord, Reminder, Todo } from './types';

function cleanText(text: string): string {
  const clean = text.trim();
  if (!clean) throw new Error('Nội dung việc nhắc không được để trống');
  return clean;
}

async function getReminder(deps: DayDeps, id: string): Promise<Reminder> {
  const r = await deps.db.reminders.get(id);
  if (!r) throw new Error('Không tìm thấy việc nhắc');
  return r;
}

/** Bản ghi hôm nay (nếu đã có) và todo nối với việc nhắc `id` trong đó. */
async function today(deps: DayDeps, id: string): Promise<{ day: DayRecord; todo?: Todo } | null> {
  const day = await deps.db.days.get(dayKey(deps.now()));
  return day ? { day, todo: day.todos.find((t) => t.reminderId === id) } : null;
}

export async function addReminder(deps: DayDeps, text: string, dueDate: string | null): Promise<Reminder> {
  const clean = cleanText(text);
  const ts = deps.now().getTime();
  // createdAt luôn tăng để giữ đúng thứ tự thêm khi nhiều việc cùng hạn
  const last = Math.max(0, ...(await deps.db.reminders.toArray()).map((r) => r.createdAt));
  const r: Reminder = {
    id: newId(), text: clean, dueDate: dueDate || null, autoToday: false, doneAt: null,
    createdAt: Math.max(ts, last + 1), updatedAt: ts,
  };
  await deps.db.reminders.add(r);
  return r;
}

/** Bật: thêm ngay vào buổi Sáng hôm nay (nếu chưa xong, chưa có). Tắt: gỡ todo chưa xong khỏi hôm nay. */
export async function setReminderAutoToday(deps: DayDeps, id: string, on: boolean): Promise<void> {
  const r = await getReminder(deps, id);
  const write = () => deps.db.reminders.update(id, { autoToday: on, updatedAt: deps.now().getTime() });
  const t = await today(deps, id);
  if (!t || r.doneAt !== null) {
    await write();
    return;
  }
  await mutateDay(deps, t.day.date, 'today-only', (d) => {
    const todo = d.todos.find((x) => x.reminderId === id);
    if (on && !todo) d.todos.push(reminderTodo(r, d.todos.length));
    if (!on && todo && !todo.done) d.todos = d.todos.filter((x) => x !== todo);
  }, write);
}

/** Đảo trạng thái xong. Việc đang ở hôm nay thì tick luôn todo đó (cây lớn) và trả về kết quả tick. */
export async function toggleReminderDone(deps: DayDeps, id: string): Promise<ToggleResult | null> {
  const r = await getReminder(deps, id);
  const t = await today(deps, id);
  if (t?.todo && t.todo.done === (r.doneAt !== null)) return toggleTodo(deps, t.day.date, t.todo.id);
  await deps.db.reminders.update(id, { doneAt: r.doneAt === null ? deps.now().getTime() : null, updatedAt: deps.now().getTime() });
  return null;
}

/** Sửa chữ/hạn. Đổi chữ thì todo nối với nó ở hôm nay đổi theo (ngày cũ giữ nguyên). */
export async function editReminder(deps: DayDeps, id: string, changes: { text?: string; dueDate?: string | null }): Promise<void> {
  const patch: Partial<Reminder> = { updatedAt: deps.now().getTime() };
  if (changes.text !== undefined) patch.text = cleanText(changes.text);
  if (changes.dueDate !== undefined) patch.dueDate = changes.dueDate || null;
  const write = () => deps.db.reminders.update(id, patch);
  const t = await today(deps, id);
  const text = patch.text;
  if (text && t?.todo) {
    await mutateDay(deps, t.day.date, 'today-only', (d) => {
      const todo = d.todos.find((x) => x.reminderId === id);
      if (todo) todo.text = text;
    }, write);
  } else {
    await write();
  }
}

/** Xoá việc nhắc; todo chưa xong ở hôm nay bị gỡ, todo đã xong giữ lại (đã góp vào cây). */
export async function deleteReminder(deps: DayDeps, id: string): Promise<void> {
  const remove = () => deps.db.reminders.delete(id);
  const t = await today(deps, id);
  if (t?.todo && !t.todo.done) {
    await mutateDay(deps, t.day.date, 'today-only', (d) => {
      d.todos = d.todos.filter((x) => x.reminderId !== id || x.done);
    }, remove);
  } else {
    await remove();
  }
}
```

Nếu `Todo` chưa export từ `./types` trong `dayService.ts` thì đã có sẵn (đang dùng); nếu `newId` đã import thì giữ nguyên.

- [ ] **Step 5: Chạy test pass + cả bộ**

Run: `npx vitest run tests/unit/domain && npx tsc --noEmit`
Expected: PASS hết, không lỗi kiểu.

- [ ] **Step 6: Commit**

```bash
git add src/domain tests/unit/domain && git commit -m "feat(reminders): reminder service with two-way sync to today's todos"
```

---

### Task 4: Sao lưu

**Files:**
- Modify: `src/db/backup.ts`
- Test: `tests/unit/db/backup.test.ts`

**Interfaces:**
- Consumes: `PlantDB.reminders`, `Reminder`.
- Produces: `BackupFile.reminders: Reminder[]` (mặc định `[]`), todo trong `days` giữ `reminderId`.

- [ ] **Step 1: Viết test đỏ** (cuối `tests/unit/db/backup.test.ts`; dùng các import sẵn có `makeDb`, `makeDay`, `createBackup`, `parseBackup`, `serializeBackup`, `restoreBackup`, `BACKUP_FORMAT`. Nếu `makeDay` chưa được import thì thêm vào import từ `'../helpers'`)

```ts
describe('sao lưu việc nhắc', () => {
  const rem = { id: 'r1', text: 'Mua quà', dueDate: '2026-10-20', autoToday: true, doneAt: null, createdAt: 1, updatedAt: 5 };

  it('khôi phục giữ việc nhắc và reminderId của todo', async () => {
    const src = makeDb();
    await src.reminders.put(rem);
    await src.days.put(makeDay({ date: '2026-10-05', todos: [{ id: 't', text: 'Mua quà', done: false, doneAt: null, order: 0, period: 'morning', reminderId: 'r1' }] }));
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await dst.reminders.put({ ...rem, id: 'cu' });
    await restoreBackup(dst, r.backup, 'replace');
    expect(await dst.reminders.toArray()).toEqual([rem]);
    expect((await dst.days.get('2026-10-05'))!.todos[0].reminderId).toBe('r1');
  });

  it('gộp: theo id, bản updatedAt lớn hơn thắng', async () => {
    const src = makeDb();
    await src.reminders.bulkPut([rem, { ...rem, id: 'r2', text: 'Mới' }]);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await dst.reminders.put({ ...rem, text: 'Máy mới hơn', updatedAt: 9 });
    await restoreBackup(dst, r.backup, 'merge');
    expect((await dst.reminders.orderBy('id').toArray()).map((x) => x.text)).toEqual(['Máy mới hơn', 'Mới']);
  });

  it('file cũ không có việc nhắc vẫn khôi phục được', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 4, exportedAt: 1, days: [], templates: [], calendarBg: null }));
    expect(r.ok && r.backup.reminders).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/db/backup.test.ts`
Expected: FAIL (`reminders` undefined / `reminderId` bị zod bỏ).

- [ ] **Step 3: Code** `src/db/backup.ts`

Trong `TodoSchema` thêm `reminderId: z.string().optional(), // việc đến từ Nhắc việc; file cũ chưa có`.

Thêm schema:

```ts
const ReminderSchema = z.object({
  id: z.string(),
  text: z.string(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  autoToday: z.boolean(),
  doneAt: z.number().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});
```

Trong `BackupSchema` sau `plannedGoals`: `reminders: z.array(ReminderSchema).default([]), // file phiên bản 1–4 chưa có`.

`createBackup`: scope thêm `db.reminders`; đọc `const reminders = await db.reminders.orderBy('id').toArray();`; thêm `reminders,` vào object trả về (sau `plannedGoals,`).

`restoreBackup`: scope thêm `db.reminders`. Nhánh `replace`: `await db.reminders.clear();` cùng chỗ các `clear()`, và `await db.reminders.bulkPut(backup.reminders);` cùng chỗ các `bulkPut`. Nhánh `merge`, sau vòng `plannedGoals`:

```ts
      for (const r of backup.reminders) {
        const cur = await db.reminders.get(r.id);
        if (!cur || r.updatedAt > cur.updatedAt) await db.reminders.put(r);
      }
```

- [ ] **Step 4: Chạy test pass**

Run: `npx vitest run tests/unit/db && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/backup.ts tests/unit/db/backup.test.ts && git commit -m "feat(reminders): include reminders and todo reminderId in backups"
```

---

### Task 5: Màn `RemindersScreen` + icon chuông

**Files:**
- Modify: `src/components/icons.tsx` (thêm `BellIcon`)
- Create: `src/screens/RemindersScreen.tsx`, `src/screens/reminders.css`
- Test: `tests/unit/screens/RemindersScreen.test.tsx`

**Interfaces:**
- Consumes: `reminderService` (Task 3), `reminderView` (Task 2), `DeleteWithConfirm`, `BackButton`, `useBackHandler`.
- Produces: `export function RemindersScreen({ onBack }: { onBack: () => void })`; `export function BellIcon({ size }: { size?: number })`.

- [ ] **Step 1: Viết test đỏ** `tests/unit/screens/RemindersScreen.test.tsx`

```tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RemindersScreen } from '../../../src/screens/RemindersScreen';
import { CATALOG } from '../../../src/content/catalog';
import { ensureToday } from '../../../src/domain/dayService';
import { addReminder } from '../../../src/domain/reminderService';
import { makeDeps, renderWithDeps } from '../helpers';

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 5, 10, 0), CATALOG);
  const user = userEvent.setup();
  const onBack = vi.fn();
  return { deps, clock, user, onBack, render: () => renderWithDeps(<RemindersScreen onBack={onBack} />, deps) };
};

describe('RemindersScreen', () => {
  it('thêm việc có hạn: hiện dd/mm; Escape/rỗng không lưu', async () => {
    const { deps, user, render } = setup();
    render();
    await user.click(screen.getByRole('button', { name: '＋ Việc nhắc mới' }));
    await user.type(screen.getByLabelText('Việc nhắc mới'), 'Mua điện thoại cho mẹ');
    await user.type(screen.getByLabelText('Hạn của việc mới'), '2026-10-20');
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    const active = await screen.findByTestId('reminders-active');
    await within(active).findByText('Mua điện thoại cho mẹ');
    expect(within(active).getByText('20/10')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '＋ Việc nhắc mới' }));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await deps.db.reminders.count()).toBe(1);
  });

  it('xếp theo hạn; quá hạn tô màu và ghi "Quá hạn"', async () => {
    const { deps, render } = setup();
    await addReminder(deps, 'Vẽ tranh', '2026-11-14');
    await addReminder(deps, 'Mua quần áo', '2026-10-03');
    await addReminder(deps, 'Không hạn', null);
    render();
    const active = await screen.findByTestId('reminders-active');
    await within(active).findByText('Vẽ tranh');
    const rows = within(active).getAllByRole('listitem');
    expect(rows.map((r) => r.querySelector('.rem__text')?.textContent)).toEqual(['Mua quần áo', 'Vẽ tranh', 'Không hạn']);
    expect(rows[0].querySelector('[data-due]')).toHaveAttribute('data-due', 'overdue');
    expect(rows[0]).toHaveTextContent('Quá hạn');
  });

  it('bật Hôm nay thì việc vào hôm nay; tick thì xuống mục đã hoàn thành tuần này', async () => {
    const { deps, user, render } = setup();
    await ensureToday(deps);
    await addReminder(deps, 'Mua quà', null);
    render();
    const sw = await screen.findByRole('switch', { name: 'Thêm vào hôm nay: Mua quà' });
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-05'))!.todos.map((t) => t.text)).toEqual(['Mua quà']));
    await user.click(screen.getByRole('checkbox', { name: 'Hoàn thành nhắc: Mua quà' }));
    const done = screen.getByTestId('reminders-done');
    expect(await within(done).findByText('Mua quà')).toBeInTheDocument();
    expect(within(screen.getByTestId('reminders-active')).queryByText('Mua quà')).toBeNull();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-05'))!.todos[0].done).toBe(true));
  });

  it('mục đã hoàn thành trống thì có lời nhắn; xoá phải xác nhận; nút quay lại gọi onBack', async () => {
    const { deps, user, onBack, render } = setup();
    await addReminder(deps, 'Mua quà', null);
    render();
    expect(await screen.findByText('Chưa xong việc nào tuần này')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Xoá: Mua quà' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá: Mua quà' }));
    await waitFor(async () => expect(await deps.db.reminders.count()).toBe(0));
    await user.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('chạm chữ để sửa, Enter lưu', async () => {
    const { deps, user, render } = setup();
    const r = await addReminder(deps, 'Mua quà', null);
    render();
    await user.click(await screen.findByRole('button', { name: 'Mua quà' }));
    const input = screen.getByLabelText('Sửa việc nhắc');
    await user.clear(input);
    await user.type(input, 'Mua hoa{Enter}');
    await waitFor(async () => expect((await deps.db.reminders.get(r.id))!.text).toBe('Mua hoa'));
  });
});
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/screens/RemindersScreen.test.tsx`
Expected: FAIL (module chưa có).

- [ ] **Step 3: `BellIcon`** (cuối `src/components/icons.tsx`)

```tsx
/** Chuông nhỏ: đánh dấu việc đến từ Nhắc việc. */
export function BellIcon({ size }: { size?: number }) {
  return (
    <Svg name="bell" size={size}>
      <path d="M16 6 C10.8 6 9.5 10 9.5 14 L9.5 19 L6.5 23.5 L25.5 23.5 L22.5 19 L22.5 14 C22.5 10 21.2 6 16 6 Z" fill="#FFF1C1" {...STROKE} />
      <path d="M13 26.5 C13.8 28.6 18.2 28.6 19 26.5" fill="none" {...STROKE} />
      <circle cx={16} cy={4.5} r={1.6} fill={INK} />
    </Svg>
  );
}
```

- [ ] **Step 4: `src/screens/RemindersScreen.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { DeleteWithConfirm } from '../components/DeleteWithConfirm';
import { dayKey } from '../domain/dayKey';
import type { DayDeps } from '../domain/dayService';
import { addReminder, deleteReminder, editReminder, setReminderAutoToday, toggleReminderDone } from '../domain/reminderService';
import { activeReminders, doneThisWeek, dueStatus, formatDue } from '../domain/reminderView';
import type { Reminder } from '../domain/types';
import '../components/todo.css';
import './reminders.css';

type Run = (p: Promise<unknown>) => void;

/** Màn Nhắc việc, mở từ thẻ "Nhắc việc" trong Cài đặt; `onBack` quay về Cài đặt. */
export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const deps = useDeps();
  const all = useLiveQuery(() => deps.db.reminders.toArray(), [deps.db]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useBackHandler(adding, () => setAdding(false), 'form');
  const today = dayKey(deps.now());
  const run: Run = (p) => {
    setError(null);
    p.catch((e: Error) => setError(e.message));
  };
  const active = all ? activeReminders(all) : [];
  const done = all ? doneThisWeek(all, today) : [];

  return (
    <section className="screen screen--reminders" data-testid="reminders">
      <header className="tpl-page__head">
        <BackButton inline label="Quay lại Cài đặt" onClick={onBack} />
        <h1 className="screen__title">Nhắc việc</h1>
      </header>
      <p className="muted rem__hint">Việc còn lâu mới tới hạn để ở đây. Bật <b>Hôm nay</b> thì việc tự vào buổi Sáng mỗi ngày cho tới khi xong.</p>
      {error && <p role="alert" className="error">{error}</p>}
      {adding ? (
        <NewReminder deps={deps} onError={setError} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" className="tpl-new" onClick={() => setAdding(true)}>＋ Việc nhắc mới</button>
      )}

      <div className="card rem__card" data-testid="reminders-active">
        <div className="rem__cols" aria-hidden="true">
          <span className="rem__cols-text">Việc</span><span className="rem__cols-due">Hạn</span><span className="rem__cols-today">Hôm nay</span>
        </div>
        {all && active.length === 0 && <p className="muted rem__empty">Chưa có việc nhắc nào. Bấm ＋ để thêm nhé 🌱</p>}
        <ul className="rem__list">
          {active.map((r) => <ReminderRow key={r.id} r={r} today={today} deps={deps} run={run} />)}
        </ul>
      </div>

      <div className="card rem__card" data-testid="reminders-done">
        <h2 className="rem__title">Đã hoàn thành tuần này</h2>
        {all && done.length === 0 && <p className="muted rem__empty">Chưa xong việc nào tuần này</p>}
        <ul className="rem__list">
          {done.map((r) => (
            <li key={r.id} className="rem__row is-done">
              <button
                type="button" role="checkbox" aria-checked className="todo__check"
                aria-label={`Bỏ hoàn thành nhắc: ${r.text}`}
                onClick={() => run(toggleReminderDone(deps, r.id))}
              >✓</button>
              <span className="rem__text">{r.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function ReminderRow({ r, today, deps, run }: { r: Reminder; today: string; deps: DayDeps; run: Run }) {
  // giữ trạng thái công tắc ngay trên giao diện để bấm nhanh liên tiếp vẫn đúng
  const [on, setOn] = useState(r.autoToday);
  useEffect(() => setOn(r.autoToday), [r.autoToday]);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.text);
  useBackHandler(editing, () => setEditing(false), 'form');
  const status = dueStatus(r.dueDate, today);
  const commit = () => {
    const clean = text.trim();
    if (clean && clean !== r.text) run(editReminder(deps, r.id, { text: clean }));
    setEditing(false);
  };
  return (
    <li className="rem__row" data-testid={`reminder-${r.id}`}>
      <button
        type="button" role="checkbox" aria-checked={false} className="todo__check"
        aria-label={`Hoàn thành nhắc: ${r.text}`}
        onClick={() => run(toggleReminderDone(deps, r.id))}
      />
      {editing ? (
        <form className="rem__edit" onSubmit={(e) => { e.preventDefault(); commit(); }}>
          <input
            className="input" autoFocus value={text} maxLength={200} aria-label="Sửa việc nhắc"
            onChange={(e) => setText(e.target.value)} onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false); }}
          />
        </form>
      ) : (
        <button type="button" className="rem__text" onClick={() => { setText(r.text); setEditing(true); }}>{r.text}</button>
      )}
      <label className="rem__due" data-due={status ?? 'none'}>
        <span>{r.dueDate ? formatDue(r.dueDate) : '—'}</span>
        {status === 'overdue' && <small className="rem__overdue">Quá hạn</small>}
        <input
          type="date" aria-label={`Hạn: ${r.text}`} value={r.dueDate ?? ''}
          onChange={(e) => run(editReminder(deps, r.id, { dueDate: e.target.value || null }))}
        />
      </label>
      <button
        type="button" role="switch" aria-checked={on} aria-label={`Thêm vào hôm nay: ${r.text}`}
        className={`rem__switch${on ? ' is-on' : ''}`}
        onClick={() => {
          const next = !on;
          setOn(next);
          run(setReminderAutoToday(deps, r.id, next));
        }}
      >
        <span className="switch" aria-hidden="true"><span className="switch__knob" /></span>
      </button>
      <DeleteWithConfirm text={r.text} onConfirm={() => run(deleteReminder(deps, r.id))} />
    </li>
  );
}

function NewReminder({ deps, onDone, onError }: { deps: DayDeps; onDone: () => void; onError: (msg: string) => void }) {
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  async function save() {
    // việc rỗng không bao giờ được lưu: chỉ đóng dòng
    if (text.trim()) {
      try {
        await addReminder(deps, text, due || null);
      } catch (e) {
        onError((e as Error).message);
        return;
      }
    }
    onDone();
  }
  return (
    <form
      className="card rem__new"
      onSubmit={(e) => { e.preventDefault(); void save(); }}
      onKeyDown={(e) => { if (e.key === 'Escape') onDone(); }}
    >
      <input
        className="input" autoFocus maxLength={200} aria-label="Việc nhắc mới" placeholder="Việc cần nhớ…"
        value={text} onChange={(e) => setText(e.target.value)}
      />
      <label className="rem__new-due">
        Hạn
        <input type="date" className="input" aria-label="Hạn của việc mới" value={due} onChange={(e) => setDue(e.target.value)} />
      </label>
      <div className="rem__new-actions">
        <button type="submit" className="btn btn--primary">Lưu</button>
        <button type="button" className="btn btn--ghost" onClick={onDone}>Huỷ</button>
      </div>
    </form>
  );
}
```

Ghi chú: nếu `useBackHandler` không cho đăng ký nhiều handler cùng lớp `'form'` (xem `src/app/back.ts`), giữ handler của `adding` ở màn và **bỏ** `useBackHandler` trong `ReminderRow` (Escape vẫn huỷ sửa).

- [ ] **Step 5: `src/screens/reminders.css`**

```css
.screen--reminders {
  display: flex; flex-direction: column; gap: 14px;
  padding-bottom: calc(var(--tabbar-h) + 32px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom)));
}
.rem__hint { margin: 0; }
.rem__card { display: flex; flex-direction: column; gap: 6px; }
.rem__title { font-family: var(--font-display); font-size: 1.1rem; margin: 0; }
.rem__empty { text-align: center; margin: 8px 0; }
.rem__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }

/* cột: ô tick | chữ | hạn | công tắc | xoá */
.rem__cols, .rem__row { display: grid; grid-template-columns: 28px minmax(0, 1fr) 54px 54px 32px; align-items: center; column-gap: 6px; }
.rem__cols { font-size: 0.75rem; font-weight: 700; color: var(--cocoa-soft); padding-bottom: 4px; border-bottom: 1.5px dashed rgba(91, 70, 54, 0.25); }
.rem__cols-text { grid-column: 2; }
.rem__cols-due { grid-column: 3; text-align: center; }
.rem__cols-today { grid-column: 4; text-align: center; }
.rem__row { min-height: 48px; border-bottom: 1px solid rgba(91, 70, 54, 0.08); }
.rem__row:last-child { border-bottom: none; }
.rem__row.is-done { grid-template-columns: 28px minmax(0, 1fr); }
.rem__row.is-done .rem__text { color: var(--cocoa-soft); }
.rem__row .todo__confirm { grid-column: 2 / -1; justify-self: end; }

.rem__text {
  border: none; background: none; padding: 6px 0; text-align: left; font: inherit; color: var(--cocoa);
  overflow-wrap: anywhere; cursor: text;
}
.rem__edit .input { width: 100%; }

.rem__due { position: relative; display: flex; flex-direction: column; align-items: center; font-weight: 700; font-size: 0.9rem; line-height: 1.1; }
.rem__due input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; } /* chạm chữ mở bộ chọn ngày của iOS */
.rem__due[data-due='soon'] { color: #E08A1E; }
.rem__due[data-due='overdue'] { color: #D6336C; }
.rem__overdue { font-size: 0.65rem; }

.rem__switch { border: none; background: none; padding: 0; display: flex; justify-content: center; cursor: pointer; }
.rem__switch.is-on .switch { background: var(--leaf); }
.rem__switch.is-on .switch__knob { transform: translateX(20px); }

.rem__new { display: flex; flex-direction: column; gap: 10px; }
.rem__new-due { display: flex; align-items: center; gap: 10px; font-weight: 700; }
.rem__new-due .input { flex: 1; font-size: 16px; }
.rem__new-actions { display: flex; gap: 10px; }
```

- [ ] **Step 6: Chạy test pass**

Run: `npx vitest run tests/unit/screens/RemindersScreen.test.tsx && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/icons.tsx src/screens/RemindersScreen.tsx src/screens/reminders.css tests/unit/screens/RemindersScreen.test.tsx && git commit -m "feat(reminders): Reminders screen with due dates, today switch and weekly done list"
```

---

### Task 6: Thẻ trong Cài đặt + icon chuông ở Hôm nay

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/components/TodoList.tsx`, `src/components/todo.css`
- Test: `tests/unit/screens/SettingsScreen.test.tsx`, `tests/unit/screens/TodayScreen.test.tsx`

**Interfaces:**
- Consumes: `RemindersScreen` (Task 5), `BellIcon` (Task 5), `addReminder`/`setReminderAutoToday` (Task 3).

- [ ] **Step 1: Viết test đỏ**

Cuối `describe('SettingsScreen', …)` trong `tests/unit/screens/SettingsScreen.test.tsx` (import thêm `addReminder` từ `'../../../src/domain/reminderService'`):

```tsx
  it('thẻ Nhắc việc đứng đầu, đếm việc đang theo dõi và mở màn Nhắc việc', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await addReminder(deps, 'Mua quà', null);
    await addReminder(deps, 'Vẽ tranh', '2026-11-14');
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 2)).toEqual(['Nhắc việc', 'Mẫu việc']);
    expect(await screen.findByText('2 việc đang theo dõi')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở nhắc việc' }));
    expect(await screen.findByRole('heading', { name: 'Nhắc việc', level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(await screen.findByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument();
  });
```

Cuối `describe('TodayScreen', …)` trong `tests/unit/screens/TodayScreen.test.tsx` (import thêm `addReminder`, `setReminderAutoToday` từ `'../../../src/domain/reminderService'`):

```tsx
  it('việc đến từ Nhắc việc có icon chuông', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', greetedAt: 1, speech: '' }));
    const r = await addReminder(deps, 'Mua quà', null);
    await setReminderAutoToday(deps, r.id, true);
    renderWithDeps(<TodayScreen />, deps);
    const row = (await screen.findByRole('checkbox', { name: 'Hoàn thành: Mua quà' })).closest('li')!;
    expect(row.querySelector('[data-icon="bell"]')).not.toBeNull();
  });
```

- [ ] **Step 2: Chạy, thấy fail**

Run: `npx vitest run tests/unit/screens/SettingsScreen.test.tsx tests/unit/screens/TodayScreen.test.tsx`
Expected: 2 test mới FAIL.

- [ ] **Step 3: Code**

`SettingsScreen.tsx`: import `RemindersScreen`. Thêm state và query:

```tsx
  /** đang mở màn Nhắc việc (nằm trong tab Cài đặt) */
  const [showReminders, setShowReminders] = useState(false);
  const reminderCount = useLiveQuery(async () => (await deps.db.reminders.toArray()).filter((r) => r.doneAt === null).length, [deps.db]);
```

Cạnh `useBackHandler(showTemplates, …)`:

```tsx
  useBackHandler(showReminders, () => setShowReminders(false), 'screen');
```

Cạnh `if (showTemplates) return …`:

```tsx
  if (showReminders) return <RemindersScreen onBack={() => setShowReminders(false)} />;
```

Thẻ đầu tiên, ngay trước thẻ "Mẫu việc":

```tsx
      <div className="card settings__section">
        <h2>Nhắc việc</h2>
        {reminderCount !== undefined && (
          <p className="muted">{reminderCount ? `${reminderCount} việc đang theo dõi` : 'Chưa có việc nhắc nào'}</p>
        )}
        <button type="button" className="btn btn--primary" onClick={() => setShowReminders(true)}>Mở nhắc việc</button>
      </div>
```

`TodoList.tsx` (`TodoRow`): import `BellIcon` từ `'./icons'`; thay nhánh `<span className="todo__text" …>`:

```tsx
        <span className="todo__text" onClick={() => { setText(todo.text); setEditing(true); }}>
          {todo.reminderId && <span className="todo__bell" title="Từ Nhắc việc"><BellIcon size={16} /></span>}
          {todo.text}
        </span>
```

`todo.css` thêm:

```css
.todo__bell { display: inline-flex; vertical-align: -2px; margin-right: 4px; }
```

- [ ] **Step 4: Chạy test pass + cả bộ unit**

Run: `npm test && npx tsc --noEmit`
Expected: PASS hết. Nếu test `backWiring` liệt kê các màn đã đăng ký Back thì thêm màn Nhắc việc vào danh sách đó cho khớp.

- [ ] **Step 5: Commit**

```bash
git add src/screens/SettingsScreen.tsx src/components/TodoList.tsx src/components/todo.css tests/unit/screens && git commit -m "feat(reminders): Settings card opens Reminders; bell icon on reminder todos"
```

---

### Task 7: E2E WebKit + soát hình

**Files:**
- Modify: `tests/e2e/app.spec.ts`

- [ ] **Step 1: Thêm helper + test** (sau helper `openTemplates`)

```ts
/** Màn Nhắc việc nằm trong Cài đặt: thẻ "Nhắc việc" → Mở nhắc việc. */
async function openReminders(page: Page) {
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Mở nhắc việc' }).click();
  await expect(page.getByRole('heading', { name: 'Nhắc việc', level: 1 })).toBeVisible();
}
```

Test ở cuối file:

```ts
test('Nhắc việc: bật Hôm nay thì việc vào buổi Sáng, chưa xong thì hôm sau lại có, tick xong thì xuống mục đã hoàn thành', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openReminders(page);
  await page.getByRole('button', { name: '＋ Việc nhắc mới' }).click();
  await page.getByLabel('Việc nhắc mới').fill('Mua điện thoại cho mẹ');
  await page.getByLabel('Hạn của việc mới').fill('2026-10-20');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: '＋ Việc nhắc mới' }).click();
  await page.getByLabel('Việc nhắc mới').fill('Mua quần áo');
  await page.getByLabel('Hạn của việc mới').fill('2026-10-04');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const active = page.getByTestId('reminders-active');
  await expect(active.getByText('20/10')).toBeVisible();
  await expect(active.getByText('Quá hạn')).toBeVisible();
  const sw = page.getByRole('switch', { name: 'Thêm vào hôm nay: Mua điện thoại cho mẹ' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  // hàng không tràn ngang khổ iPhone 13
  const box = await active.boundingBox();
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/reminders.png' });

  await openToday(page);
  await closeMenu(page);
  const morning = page.getByTestId('todo-section-morning');
  await expect(morning.getByRole('checkbox', { name: 'Hoàn thành: Mua điện thoại cho mẹ' })).toBeVisible();
  await expect(morning.locator('[data-icon="bell"]')).toHaveCount(1);

  await page.clock.setFixedTime(at('2026-10-06T08:00:00'));
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  const box2 = page.getByTestId('todo-section-morning').getByRole('checkbox', { name: 'Hoàn thành: Mua điện thoại cho mẹ' });
  await expect(box2).toBeVisible();
  await box2.click();
  await expect(page.getByTestId('todo-section-morning').getByRole('checkbox', { name: 'Bỏ hoàn thành: Mua điện thoại cho mẹ' })).toBeVisible();

  await openReminders(page);
  await expect(page.getByTestId('reminders-done').getByText('Mua điện thoại cho mẹ')).toBeVisible();
  await expect(page.getByTestId('reminders-active').getByText('Mua điện thoại cho mẹ')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/reminders-done.png' });
});
```

- [ ] **Step 2: Chạy E2E WebKit**

Run: `npm run e2e -- -g "Nhắc việc" > pw.log 2>&1; grep -E "passed|failed|Error" pw.log`
Expected: `1 passed`. Nếu fail thì đọc `pw.log`, sửa, chạy lại.

- [ ] **Step 3: Soát hình** — đọc `test-results/reminders.png` và `test-results/reminders-done.png`. Kiểm tra: tiêu đề cột thẳng hàng với cột của các dòng, công tắc tròn không bị bóp, chữ dài xuống dòng không tràn, màu cam/hồng của hạn dễ đọc, nút menu nổi không che dòng cuối. Có lỗi thì sửa `reminders.css` rồi chạy lại Step 2.

- [ ] **Step 4: Chạy toàn bộ E2E**

Run: `npm run e2e > pw.log 2>&1; grep -E "passed|failed" pw.log`
Expected: mọi test passed.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/app.spec.ts src/screens/reminders.css && git commit -m "test(e2e): reminders flow on WebKit iPhone 13"
```

---

### Task 8: CLAUDE.md + test giống CI + push

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Cập nhật CLAUDE.md**
  - Kiến trúc: `domain/` thêm `reminderService, reminderView`; `screens/` thêm `RemindersScreen` (mở từ thẻ "Nhắc việc" trong Cài đặt).
  - Quy tắc nghiệp vụ: thêm mục **Nhắc việc**: các quy tắc trong bảng của spec; thứ tự thẻ Cài đặt thành Nhắc việc → Mẫu việc → Lịch → Sao lưu & khôi phục → Ủng hộ tôi; `mutateDay(…, sync)` chạy trong transaction `[days, reminders]`.
  - DB: `SCHEMA_VERSION = 5`, dòng **v5**: bảng `reminders`; thêm hàng vào bảng các bảng; thêm `Reminder` và `Todo.reminderId?` vào khối kiểu.
  - Sao lưu: `schemaVersion: 5`, `"reminders": [Reminder, ...]` (file 1–4 thiếu → `[]`; gộp theo `id`, `updatedAt` lớn hơn thắng).
  - Icon: thêm `bell`.
  - Label test: `Mở nhắc việc`, `＋ Việc nhắc mới`, `Việc nhắc mới`, `Hạn của việc mới`, `Hoàn thành nhắc: <việc>`, `Bỏ hoàn thành nhắc: <việc>`, `Thêm vào hôm nay: <việc>`, `Hạn: <việc>`, `Sửa việc nhắc`, `reminders`, `reminders-active`, `reminders-done`, `reminder-<id>`, helper E2E `openReminders(page)`.
  - Nút Back Android: thêm "màn Nhắc việc, dòng thêm/sửa việc nhắc" vào danh sách đã đăng ký.

- [ ] **Step 2: Kiểm tra đủ**

Run: `npx tsc --noEmit && npm test && TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run && npm run build`
Expected: tất cả PASS / build thành công.

- [ ] **Step 3: Commit + push**

```bash
git add CLAUDE.md && git commit -m "docs: document reminders feature" && git push origin main
```

- [ ] **Step 4: Kiểm tra CI** — đọc `https://api.github.com/repos/bigbeartk/garden-of-habits/actions/runs?per_page=1` cho tới khi `conclusion` là `success` (nếu `failure` thì xem `check-runs/<job id>/annotations` và sửa).
