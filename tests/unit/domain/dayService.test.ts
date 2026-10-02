import {
  LockedDayError, addTodo, addTodos, changePlant, changePot, deleteTodo, editTodo,
  ensureToday, markGreeted, reorderTodos, setNote, setRestDay, setTitle, toggleTodo,
} from '../../../src/domain/dayService';
import { makeDay, makeDeps } from '../helpers';

const m = (text: string) => ({ text, period: 'morning' as const });
const TEMPLATE = (isDefault: boolean, items: { text: string; period: 'morning' | 'afternoon' | 'evening' }[]) => ({
  id: crypto.randomUUID(), name: 'Sáng', items, isDefault, createdAt: 1, updatedAt: 1,
});

describe('ensureToday', () => {
  it('tạo ngày mới với cây trong catalog, chậu mặc định và todo từ mẫu mặc định', async () => {
    const { deps } = makeDeps();
    await deps.db.templates.bulkAdd([TEMPLATE(false, [m('Không dùng')]), TEMPLATE(true, [m('Tập thể dục'), { text: 'Đọc sách', period: 'evening' }])]);
    const day = await ensureToday(deps);
    expect(day.date).toBe('2026-10-02');
    const plant = deps.catalog.plants.find((p) => p.id === day.plantId)!;
    expect(plant).toBeDefined();
    expect(day.potId).toBe(plant.defaultPotId);
    expect(day.todos.map((t) => [t.text, t.period])).toEqual([['Tập thể dục', 'morning'], ['Đọc sách', 'evening']]);
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
    const day = await addTodos(deps, date, [m('B'), m(' '), m('C')]);
    expect(day.todos.map((t) => [t.text, t.order])).toEqual([['A', 0], ['B', 1], ['C', 2]]);
  });

  it('toggleTodo cập nhật trạng thái, giai đoạn và báo giai đoạn trước', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodos(deps, date, [m('A'), m('B')]);
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
    const day = await addTodos(deps, date, [m('A'), m('B'), m('C')]);
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

describe('tiêu đề ngày', () => {
  it('ngày mới có tiêu đề trống', async () => {
    const { deps } = makeDeps();
    expect((await ensureToday(deps)).title).toBe('');
  });

  it('setTitle cắt khoảng trắng, cho phép xoá trống', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    expect((await setTitle(deps, date, '  Ngày dọn nhà 🧹  ')).title).toBe('Ngày dọn nhà 🧹');
    expect((await setTitle(deps, date, '   ')).title).toBe('');
  });

  it('ngày đã qua không sửa được tiêu đề', async () => {
    const { deps, clock } = makeDeps();
    const { date } = await ensureToday(deps);
    clock.current = new Date(2026, 9, 3, 9, 0);
    await expect(setTitle(deps, date, 'muộn')).rejects.toBeInstanceOf(LockedDayError);
  });
});

describe('buổi Sáng / Chiều / Tối', () => {
  it('addTodo gắn buổi được chọn, mặc định là sáng', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodo(deps, date, 'A');
    const day = await addTodo(deps, date, 'B', 'evening');
    expect(day.todos.map((t) => [t.text, t.period])).toEqual([['A', 'morning'], ['B', 'evening']]);
  });

  it('sắp xếp trong một buổi không làm xáo trộn buổi khác', async () => {
    const { deps } = makeDeps();
    const { date } = await ensureToday(deps);
    await addTodos(deps, date, [m('S1'), { text: 'T1', period: 'evening' }, m('S2'), { text: 'T2', period: 'evening' }]);
    const day = (await deps.db.days.get(date))!;
    const [s1, , s2] = day.todos;
    const after = await reorderTodos(deps, date, [s2.id, s1.id]);
    const morning = after.todos.filter((t) => t.period === 'morning').map((t) => t.text);
    const evening = after.todos.filter((t) => t.period === 'evening').map((t) => t.text);
    expect(morning).toEqual(['S2', 'S1']);
    expect(evening).toEqual(['T1', 'T2']);
  });
});
