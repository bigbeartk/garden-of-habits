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

export async function addReminder(deps: DayDeps, text: string): Promise<Reminder> {
  const clean = cleanText(text);
  const ts = deps.now().getTime();
  // createdAt luôn tăng để giữ đúng thứ tự thêm (danh sách xếp theo createdAt)
  const last = Math.max(0, ...(await deps.db.reminders.toArray()).map((r) => r.createdAt));
  const r: Reminder = {
    id: newId(), text: clean, autoToday: false, doneAt: null,
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

/** Sửa chữ; todo nối với nó ở hôm nay đổi theo (ngày cũ giữ nguyên). */
export async function editReminder(deps: DayDeps, id: string, newText: string): Promise<void> {
  const text = cleanText(newText);
  const write = () => deps.db.reminders.update(id, { text, updatedAt: deps.now().getTime() });
  const t = await today(deps, id);
  if (t?.todo) {
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
