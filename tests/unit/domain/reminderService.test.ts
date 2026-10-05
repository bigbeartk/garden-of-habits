import { deleteTodo, editTodo, ensureToday, toggleTodo } from '../../../src/domain/dayService';
import {
  addReminder, deleteReminder, editReminder, setReminderAutoToday, toggleReminderDone,
} from '../../../src/domain/reminderService';
import { makeDeps } from '../helpers';

const linked = <T extends { reminderId?: string }>(todos: T[], id: string) => todos.filter((t) => t.reminderId === id);

describe('thêm việc nhắc', () => {
  it('cắt khoảng trắng, mặc định chưa bật Hôm nay; chữ rỗng bị từ chối', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const r = await addReminder(deps, '  Mua quà ');
    expect(r).toMatchObject({ text: 'Mua quà', autoToday: false, doneAt: null });
    await expect(addReminder(deps, '   ')).rejects.toThrow('không được để trống');
    expect(await deps.db.reminders.count()).toBe(1);
  });

  it('thêm liên tiếp cùng thời điểm vẫn giữ thứ tự createdAt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    const a = await addReminder(deps, 'A');
    const b = await addReminder(deps, 'B');
    expect(b.createdAt).toBeGreaterThan(a.createdAt);
  });
});

describe('công tắc Hôm nay', () => {
  it('bật: thêm ngay vào cuối buổi Sáng hôm nay, đúng một lần dù bật lại', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await deps.db.templates.put({ id: 't', name: 'M', items: [{ text: 'Tập', period: 'morning' }, { text: 'Đọc', period: 'evening' }], isDefault: true, createdAt: 1, updatedAt: 1 });
    await ensureToday(deps);
    const r = await addReminder(deps, 'Mua quà');
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
    const r = await addReminder(deps, 'Mua quà');
    await setReminderAutoToday(deps, r.id, true);
    expect(await deps.db.days.count()).toBe(0);
    const day = await ensureToday(deps);
    expect(linked(day.todos, r.id).map((t) => [t.text, t.period])).toEqual([['Mua quà', 'morning']]);
  });

  it('tắt: gỡ khỏi hôm nay nếu chưa xong; việc đã xong thì giữ', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(deps);
    const a = await addReminder(deps, 'A');
    const b = await addReminder(deps, 'B');
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
    const r = await addReminder(deps, 'Vẽ tranh');
    const off = await addReminder(deps, 'Không bật');
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
    const r = await addReminder(ctx.deps, 'Mua quà');
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
    const r = await addReminder(deps, 'Mua quà');
    expect(await toggleReminderDone(deps, r.id)).toBeNull();
    expect((await deps.db.reminders.get(r.id))!.doneAt).toBe(deps.now().getTime());
  });

  it('sửa chữ ở Hôm nay ↔ Nhắc việc cập nhật bên kia', async () => {
    const { deps, r, todo } = await setupLinked();
    await editTodo(deps, '2026-10-05', todo.id, 'Mua quà sinh nhật');
    expect((await deps.db.reminders.get(r.id))!.text).toBe('Mua quà sinh nhật');
    await editReminder(deps, r.id, '  Mua hoa ');
    expect((await deps.db.days.get('2026-10-05'))!.todos.find((t) => t.id === todo.id)!.text).toBe('Mua hoa');
    expect((await deps.db.reminders.get(r.id))!.text).toBe('Mua hoa');
    await expect(editReminder(deps, r.id, ' ')).rejects.toThrow('không được để trống');
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

describe('bỏ hoàn thành việc đã xong từ hôm trước', () => {
  it('đang bật Hôm nay thì việc quay lại buổi Sáng hôm nay ngay', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(deps);
    const r = await addReminder(deps, 'Mua quà');
    await setReminderAutoToday(deps, r.id, true);
    await toggleReminderDone(deps, r.id);
    clock.current = new Date(2026, 9, 6, 8, 0);
    expect(linked((await ensureToday(deps)).todos, r.id)).toHaveLength(0);
    expect(await toggleReminderDone(deps, r.id)).toBeNull();
    expect((await deps.db.reminders.get(r.id))!.doneAt).toBeNull();
    const today = (await deps.db.days.get('2026-10-06'))!;
    expect(linked(today.todos, r.id).map((t) => [t.text, t.period, t.done])).toEqual([['Mua quà', 'morning', false]]);
  });

  it('không bật Hôm nay thì chỉ trở lại danh sách', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 5, 10, 0));
    await ensureToday(deps);
    const r = await addReminder(deps, 'Mua quà');
    await toggleReminderDone(deps, r.id);
    clock.current = new Date(2026, 9, 6, 8, 0);
    await ensureToday(deps);
    await toggleReminderDone(deps, r.id);
    expect((await deps.db.days.get('2026-10-06'))!.todos).toEqual([]);
  });
});
