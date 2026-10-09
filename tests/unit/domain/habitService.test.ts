import { describe, expect, it } from 'vitest';
import { makeDay, makeDeps } from '../helpers';
import {
  addHabit, checksOn, deleteHabit, editHabit, habitsForDay, isStopped, listHabits, resumeHabit, stopHabit, toggleHabit, HABIT_NAME_MAX,
} from '../../../src/domain/habitService';
import { isScheduled } from '../../../src/domain/habitReport';
import type { HabitInput } from '../../../src/domain/habitService';

const ALL = [0, 1, 2, 3, 4, 5, 6];
const input = (p: Partial<HabitInput> = {}): HabitInput => ({ name: 'Uống nước', icon: '💧', color: 'sky', weekdays: ALL, ...p });

describe('habitService', () => {
  // makeDeps mặc định: 2026-10-02 10:00 (thứ Sáu)
  it('addHabit cắt khoảng trắng, startDate = hôm nay, order tăng dần', async () => {
    const { deps } = makeDeps();
    const a = await addHabit(deps, input({ name: '  Uống nước  ' }));
    const b = await addHabit(deps, input({ name: 'Yoga', weekdays: [5, 1, 1] }));
    expect(a).toMatchObject({ name: 'Uống nước', startDate: '2026-10-02', order: 0 });
    expect(b).toMatchObject({ order: 1, weekdays: [1, 5] });
    expect((await listHabits(deps.db)).map((h) => h.name)).toEqual(['Uống nước', 'Yoga']);
  });

  it('tên rỗng, không chọn thứ → lỗi; tên dài bị cắt còn 40', async () => {
    const { deps } = makeDeps();
    await expect(addHabit(deps, input({ name: '   ' }))).rejects.toMatchObject({ code: 'emptyHabitName' });
    await expect(addHabit(deps, input({ weekdays: [] }))).rejects.toMatchObject({ code: 'habitNoDays' });
    const h = await addHabit(deps, input({ name: 'x'.repeat(60) }));
    expect(h.name).toHaveLength(HABIT_NAME_MAX);
  });

  it('editHabit đổi tên/icon/màu/thứ, giữ startDate và order', async () => {
    const { deps, clock } = makeDeps();
    const h = await addHabit(deps, input());
    clock.current = new Date(2026, 9, 5, 10);
    await editHabit(deps, h.id, input({ name: 'Nước', icon: '🥛', color: 'mint', weekdays: [1] }));
    expect((await listHabits(deps.db))[0]).toMatchObject({ name: 'Nước', icon: '🥛', color: 'mint', weekdays: [1], startDate: '2026-10-02', order: 0 });
    await expect(editHabit(deps, 'nope', input())).rejects.toMatchObject({ code: 'habitNotFound' });
  });

  it('toggleHabit bật rồi tắt ngày hôm nay', async () => {
    const { deps } = makeDeps();
    const h = await addHabit(deps, input());
    expect(await toggleHabit(deps, h.id)).toBe(true);
    expect(await checksOn(deps.db, '2026-10-02')).toEqual(new Set([h.id]));
    expect(await toggleHabit(deps, h.id)).toBe(false);
    expect((await checksOn(deps.db, '2026-10-02')).size).toBe(0);
  });

  it('02:00 sáng vẫn tính cho ngày hôm trước (mốc 4:00)', async () => {
    const { deps, clock } = makeDeps();
    const h = await addHabit(deps, input());
    clock.current = new Date(2026, 9, 3, 2, 0); // 2h sáng thứ Bảy = vẫn thứ Sáu 02/10
    await toggleHabit(deps, h.id);
    expect(await checksOn(deps.db, '2026-10-02')).toEqual(new Set([h.id]));
    expect((await checksOn(deps.db, '2026-10-03')).size).toBe(0);
  });

  it('không có lịch hôm nay hoặc hôm nay là ngày tiết kiệm năng lượng → lỗi', async () => {
    const { deps } = makeDeps();
    const monOnly = await addHabit(deps, input({ weekdays: [1] }));
    await expect(toggleHabit(deps, monOnly.id)).rejects.toMatchObject({ code: 'habitNotToday' });
    const h = await addHabit(deps, input());
    await deps.db.days.put(makeDay({ date: '2026-10-02', isRestDay: true }));
    await expect(toggleHabit(deps, h.id)).rejects.toMatchObject({ code: 'habitRestDay' });
  });

  it('deleteHabit xoá luôn lịch sử tick', async () => {
    const { deps } = makeDeps();
    const h = await addHabit(deps, input());
    await toggleHabit(deps, h.id);
    await deleteHabit(deps, h.id);
    expect(await listHabits(deps.db)).toEqual([]);
    expect(await deps.db.habitChecks.count()).toBe(0);
  });

  it('isScheduled / habitsForDay theo thứ, startDate và ngày nghỉ', () => {
    const h = { weekdays: [1, 3], startDate: '2026-10-05' }; // T2 05/10
    expect(isScheduled(h, '2026-10-05')).toBe(true);
    expect(isScheduled(h, '2026-10-06')).toBe(false); // T3
    expect(isScheduled(h, '2026-09-30')).toBe(false); // T4 nhưng trước startDate
    const full = { id: 'a', name: 'a', icon: '💧', color: 'sky' as const, weekdays: [1], order: 0, startDate: '2026-10-01', createdAt: 0, updatedAt: 0 };
    expect(habitsForDay([full], '2026-10-05', false)).toHaveLength(1);
    expect(habitsForDay([full], '2026-10-05', true)).toHaveLength(0);
  });

  it('stopHabit dừng từ hôm nay: không còn trong hôm nay, giữ lịch sử tick, không tick được', async () => {
    const { deps, clock } = makeDeps();
    const h = await addHabit(deps, input());
    await toggleHabit(deps, h.id);
    clock.current = new Date(2026, 9, 5, 10);
    await stopHabit(deps, h.id);
    const [s] = await listHabits(deps.db);
    expect(s.pauses).toEqual([{ from: '2026-10-05', to: null }]);
    expect(isStopped(s)).toBe(true);
    expect(s.updatedAt).toBe(clock.current.getTime());
    expect(habitsForDay([s], '2026-10-05', false)).toHaveLength(0);
    expect(await checksOn(deps.db, '2026-10-02')).toEqual(new Set([h.id]));
    await expect(toggleHabit(deps, h.id)).rejects.toMatchObject({ code: 'habitNotToday' });
    await stopHabit(deps, h.id); // dừng lần nữa: không đổi gì
    expect((await listHabits(deps.db))[0].pauses).toEqual([{ from: '2026-10-05', to: null }]);
    await expect(stopHabit(deps, 'nope')).rejects.toMatchObject({ code: 'habitNotFound' });
  });

  it('resumeHabit làm lại từ hôm nay, khoảng đã dừng giữ nguyên', async () => {
    const { deps, clock } = makeDeps();
    const h = await addHabit(deps, input());
    clock.current = new Date(2026, 9, 5, 10);
    await stopHabit(deps, h.id);
    clock.current = new Date(2026, 9, 8, 10);
    await resumeHabit(deps, h.id);
    const [s] = await listHabits(deps.db);
    expect(s.pauses).toEqual([{ from: '2026-10-05', to: '2026-10-08' }]);
    expect(isStopped(s)).toBe(false);
    expect(await toggleHabit(deps, h.id)).toBe(true);
  });

  it('dừng rồi tiếp tục trong cùng ngày: không để lại khoảng dừng; dừng lại đúng ngày vừa tiếp tục thì nối khoảng cũ', async () => {
    const { deps, clock } = makeDeps();
    const h = await addHabit(deps, input());
    await stopHabit(deps, h.id);
    await resumeHabit(deps, h.id);
    expect((await listHabits(deps.db))[0].pauses).toEqual([]);
    clock.current = new Date(2026, 9, 5, 10);
    await stopHabit(deps, h.id);
    clock.current = new Date(2026, 9, 7, 10);
    await resumeHabit(deps, h.id);
    await stopHabit(deps, h.id);
    expect((await listHabits(deps.db))[0].pauses).toEqual([{ from: '2026-10-05', to: null }]);
  });

  it('editHabit giữ các khoảng dừng', async () => {
    const { deps } = makeDeps();
    const h = await addHabit(deps, input());
    await stopHabit(deps, h.id);
    await editHabit(deps, h.id, input({ name: 'Nước' }));
    expect(isStopped((await listHabits(deps.db))[0])).toBe(true);
  });
});
