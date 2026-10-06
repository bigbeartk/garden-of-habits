import type { PlantDB } from '../db/db';
import { dayKey } from './dayKey';
import { stageOfTodos, type GrowthStage } from './growth';
import { newId } from './id';
import { pickUniform, rollSpecial, type Rng } from './random';
import { PERIODS, type Period } from './period';
import { listUnlockedSpecials, pairKey, unlockSpecial } from './specialUnlocks';
import { listUnlockedStyles, styleKey, unlockStylesFor } from './styleUnlocks';
import { BASE_STYLE_ID, type Catalog, type DayRecord, type Reminder, type TemplateItem, type Todo } from './types';
import { AppError, LockedDayError } from './errors';

export interface DayDeps {
  db: PlantDB;
  catalog: Catalog;
  rng: Rng;
  now: () => Date;
}

export { LockedDayError } from './errors';

/** Độ dài tối đa của lời cây nói */
export const SPEECH_MAX = 100;

export async function ensureToday(deps: DayDeps): Promise<DayRecord> {
  const { db } = deps;
  const date = dayKey(deps.now());
  const existing = await db.days.get(date);
  if (existing) return existing;
  // đọc trước khi mở transaction: hàm async lồng nhau bên trong transaction làm Dexie mất ngữ cảnh
  // khi App và useToday cùng gọi ensureToday (PrematureCommitError)
  const unlockedStyles = await listUnlockedStyles(deps);
  return db.transaction('rw', [db.days, db.templates, db.planned, db.plannedGoals, db.settings, db.reminders], async () => {
    const existing = await db.days.get(date);
    if (existing) return existing;
    const template = (await db.templates.toArray()).find((t) => t.isDefault);
    // việc đã lên lịch cho hôm nay: vào sau việc của mẫu, rồi xoá khỏi danh sách chờ
    const planned = await db.planned.where('date').equals(date).sortBy('createdAt');
    const goal = await db.plannedGoals.get(date);
    // việc nhắc đang bật "Hôm nay" mà chưa xong: thêm lại mỗi ngày (buổi Sáng) cho tới khi xong
    const reminders = (await db.reminders.toArray())
      .filter((r) => r.autoToday && r.doneAt === null)
      .sort((a, b) => a.createdAt - b.createdAt);
    const plant = pickUniform(deps.catalog.plants, deps.rng);
    const ts = deps.now().getTime();
    const record: DayRecord = {
      date,
      plantId: plant.id,
      potId: plant.defaultPotId,
      specialId: rollSpecial(deps.catalog.specials, deps.rng),
      isRestDay: false,
      title: goal?.title ?? '',
      greetedAt: null,
      note: '',
      todos: withReminders(toTodos([...(template?.items ?? []), ...planned], 0), reminders),
      finalStage: 'seed',
      createdAt: ts,
      updatedAt: ts,
    };
    // dáng: random trong các dáng đã mở; chỉ gọi RNG khi thật sự có lựa chọn để không lệch chuỗi random cũ
    const styles = [BASE_STYLE_ID, ...(plant.styles ?? []).map((s) => s.id).filter((id) => unlockedStyles.has(styleKey({ plantId: plant.id, styleId: id })))];
    record.styleId = styles.length > 1 ? pickUniform(styles, deps.rng) : BASE_STYLE_ID;
    await db.days.add(record);
    await db.planned.bulkDelete(planned.map((p) => p.id));
    if (goal) await db.plannedGoals.delete(date);
    // trúng cây đặc biệt: mở khoá để những ngày sau chọn lại được trong bảng Đổi cây
    if (record.specialId) await unlockSpecial(db, { plantId: record.plantId, specialId: record.specialId });
    return record;
  });
}

function toTodos(items: TemplateItem[], startOrder: number): Todo[] {
  return items
    .map((item) => ({ text: item.text.trim(), period: item.period }))
    .filter((item) => item.text)
    .map((item, i) => ({ id: newId(), text: item.text, period: item.period, done: false, doneAt: null, order: startOrder + i }));
}

/** Todo nối với một việc nhắc, luôn vào buổi Sáng (người dùng tự kéo sang buổi khác). */
export function reminderTodo(r: Pick<Reminder, 'id' | 'text'>, order: number): Todo {
  return { id: newId(), text: r.text, period: 'morning', done: false, doneAt: null, order, reminderId: r.id };
}

function withReminders(todos: Todo[], reminders: Reminder[]): Todo[] {
  return [...todos, ...reminders.map((r, i) => reminderTodo(r, todos.length + i))];
}

export type EditKind = 'today-only' | 'note';

/**
 * Mọi thao tác sửa một ngày đi qua đây. `sync` chạy trong cùng transaction sau khi lưu ngày
 * (dùng để cập nhật việc nhắc nối với todo), chỉ được thao tác trên `days`/`reminders`.
 */
export async function mutateDay(
  deps: DayDeps, date: string, kind: EditKind, fn: (day: DayRecord) => void, sync?: (day: DayRecord) => Promise<unknown>,
): Promise<DayRecord> {
  const today = dayKey(deps.now());
  if (kind === 'today-only' && date !== today) throw new LockedDayError(date);
  const { db } = deps;
  let before = 'seed' as GrowthStage; // giai đoạn trước khi sửa (gán trong transaction)
  const saved = await db.transaction('rw', [db.days, db.reminders], async () => {
    const day = await db.days.get(date);
    if (!day) throw new AppError('dayNotFound', { date });
    before = day.finalStage;
    fn(day);
    day.todos.sort((a, b) => a.order - b.order).forEach((t, i) => (t.order = i));
    day.finalStage = stageOfTodos(day.todos);
    day.updatedAt = deps.now().getTime();
    await db.days.put(day);
    if (sync) await sync(day);
    return day;
  });
  // hôm nay VỪA ra hoa (đổi loài trên ngày đã ra hoa không tính): mở các dáng vừa đủ mốc, lưu lại để bỏ tick vẫn giữ.
  // Ngoài transaction (lý do như ensureToday); ghi hỏng thì việc đã lưu vẫn đúng, chỉ báo ra console.
  if (date === today && !saved.isRestDay && before !== 'bloom' && saved.finalStage === 'bloom') {
    await unlockStylesFor(deps, saved.plantId).catch((e) => console.error(e));
  }
  return saved;
}

function findTodo(day: DayRecord, id: string): Todo {
  const todo = day.todos.find((t) => t.id === id);
  if (!todo) throw new AppError('todoNotFound');
  return todo;
}

/** Cập nhật việc nhắc nối với todo (id lạ/đã xoá thì bỏ qua: `update` không làm gì). */
function syncReminder(deps: DayDeps, reminderId: string | undefined, patch: Partial<Reminder>): Promise<unknown> {
  if (!reminderId) return Promise.resolve();
  return deps.db.reminders.update(reminderId, { ...patch, updatedAt: deps.now().getTime() });
}

export function addTodo(deps: DayDeps, date: string, text: string, period: Period = 'morning'): Promise<DayRecord> {
  const clean = text.trim();
  if (!clean) return Promise.reject(new AppError('emptyTask'));
  return mutateDay(deps, date, 'today-only', (d) => {
    d.todos.push(...toTodos([{ text: clean, period }], d.todos.length));
  });
}

export function addTodos(deps: DayDeps, date: string, items: TemplateItem[]): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.todos.push(...toTodos(items, d.todos.length));
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
  let toggled: Todo | undefined;
  const day = await mutateDay(deps, date, 'today-only', (d) => {
    prevStage = d.finalStage;
    const todo = findTodo(d, id);
    todo.done = !todo.done;
    todo.doneAt = todo.done ? deps.now().getTime() : null;
    completed = todo.done;
    toggled = todo;
  }, () => syncReminder(deps, toggled?.reminderId, { doneAt: toggled?.doneAt ?? null }));
  return { day, prevStage, completed };
}

export function editTodo(deps: DayDeps, date: string, id: string, text: string): Promise<DayRecord> {
  const clean = text.trim();
  if (!clean) return Promise.reject(new AppError('emptyTask'));
  let reminderId: string | undefined;
  return mutateDay(deps, date, 'today-only', (d) => {
    const todo = findTodo(d, id);
    todo.text = clean;
    reminderId = todo.reminderId;
  }, () => syncReminder(deps, reminderId, { text: clean }));
}

export function deleteTodo(deps: DayDeps, date: string, id: string): Promise<DayRecord> {
  let reminderId: string | undefined;
  return mutateDay(deps, date, 'today-only', (d) => {
    reminderId = d.todos.find((t) => t.id === id)?.reminderId;
    d.todos = d.todos.filter((t) => t.id !== id);
  }, () => syncReminder(deps, reminderId, { autoToday: false })); // xoá ở Hôm nay: mai không tự thêm lại
}

/** Chuyển một việc sang buổi `period`, đứng ở vị trí `index` trong buổi đó (dùng cả để sắp xếp trong cùng buổi). */
export function moveTodo(deps: DayDeps, date: string, id: string, period: Period, index: number): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    const todo = findTodo(d, id);
    const sorted = d.todos.filter((t) => t.id !== id).sort((a, b) => a.order - b.order);
    const target = sorted.filter((t) => t.period === period);
    target.splice(Math.max(0, Math.min(index, target.length)), 0, todo);
    todo.period = period;
    PERIODS.flatMap((p) => (p === period ? target : sorted.filter((t) => t.period === p))).forEach((t, i) => (t.order = i));
  });
}

export function setRestDay(deps: DayDeps, date: string, isRest: boolean): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.isRestDay = isRest;
  });
}

/** Đổi cây hôm nay: loài thường (`specialId` null) hoặc một cây đặc biệt đã mở khoá. */
export async function changePlant(
  deps: DayDeps, date: string, plantId: string, specialId: string | null = null, styleId: string = BASE_STYLE_ID,
): Promise<DayRecord> {
  const next = deps.catalog.plants.find((p) => p.id === plantId);
  if (!next) throw new AppError('unknownPlant', { id: plantId });
  if (specialId) {
    const key = pairKey({ plantId, specialId });
    const unlocked = await listUnlockedSpecials(deps);
    if (!unlocked.some((p) => pairKey(p) === key)) throw new AppError('specialLocked');
  }
  if (styleId !== BASE_STYLE_ID) {
    if (!next.styles?.some((s) => s.id === styleId)) throw new AppError('unknownStyle', { id: styleId });
    if (!(await listUnlockedStyles(deps)).has(styleKey({ plantId, styleId }))) throw new AppError('styleLocked');
  }
  return mutateDay(deps, date, 'today-only', (d) => {
    const prev = deps.catalog.plants.find((p) => p.id === d.plantId);
    if (!prev || d.potId === prev.defaultPotId) d.potId = next.defaultPotId;
    d.plantId = next.id;
    d.specialId = specialId;
    d.styleId = styleId;
  });
}

export function changePot(deps: DayDeps, date: string, potId: string): Promise<DayRecord> {
  if (!deps.catalog.potIds.includes(potId)) return Promise.reject(new AppError('unknownPot', { id: potId }));
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

/** Lời cây nói cả ngày (chỉ hôm nay); rỗng = hôm nay cây không nói. */
export function setDaySpeech(deps: DayDeps, date: string, text: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.speech = text.trim().slice(0, SPEECH_MAX);
  });
}

export function setTitle(deps: DayDeps, date: string, title: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.title = title.trim();
  });
}
