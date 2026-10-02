import type { PlantDB } from '../db/db';
import { dayKey } from './dayKey';
import { stageOfTodos, type GrowthStage } from './growth';
import { newId } from './id';
import { pickUniform, rollSpecial, type Rng } from './random';
import type { Period } from './period';
import type { Catalog, DayRecord, TemplateItem, Todo } from './types';

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
      title: '',
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

function toTodos(items: TemplateItem[], startOrder: number): Todo[] {
  return items
    .map((item) => ({ text: item.text.trim(), period: item.period }))
    .filter((item) => item.text)
    .map((item, i) => ({ id: newId(), text: item.text, period: item.period, done: false, doneAt: null, order: startOrder + i }));
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

export function addTodo(deps: DayDeps, date: string, text: string, period: Period = 'morning'): Promise<DayRecord> {
  const clean = text.trim();
  if (!clean) return Promise.reject(new Error('Nội dung việc cần làm không được để trống'));
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

export function setTitle(deps: DayDeps, date: string, title: string): Promise<DayRecord> {
  return mutateDay(deps, date, 'today-only', (d) => {
    d.title = title.trim();
  });
}
