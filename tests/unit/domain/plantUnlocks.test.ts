import { liveQuery } from 'dexie';
import { availablePlants, earnedSlots, goodDayCount, plantUnlockState, unlockPlant } from '../../../src/domain/plantUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
import { addDays } from '../../../src/domain/dayKey';
import { makeDay, makeDeps } from '../helpers';

/** n ngày ra hoa liên tiếp, kết thúc hôm qua (makeDeps: hôm nay là 2026-10-02) */
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
    await deps.db.habits.add({ id: 'h', name: 'Đọc', icon: '📚', color: 'mint', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: '2026-09-01', createdAt: 0, updatedAt: 0 });
    await deps.db.habitChecks.bulkPut([
      { habitId: 'h', date: '2026-09-01', at: 0 },
      { habitId: 'h', date: '2026-09-02', at: 0 },
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

  it('bỏ tick làm lượt tụt: cây đã mở vẫn mở, freeSlots không âm, mốc kế tiếp tính sau cây đã mở', async () => {
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

  it('liveQuery: trạng thái và danh sách loài tự cập nhật khi ngày đổi / setting đổi', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut([...blooms(89), makeDay({ date: '2026-10-02', finalStage: 'seed' })]);
    const days: number[] = [];
    const ids: string[][] = [];
    const a = liveQuery(() => plantUnlockState(deps)).subscribe((v) => days.push(v.goodDays));
    const b = liveQuery(() => availablePlants(deps)).subscribe((v) => ids.push(v.map((p) => p.id)));
    await new Promise((r) => setTimeout(r, 300));
    await deps.db.days.update('2026-10-02', { finalStage: 'bloom' });
    await new Promise((r) => setTimeout(r, 500));
    expect(days.at(-1)).toBe(90); // chỉ ngày đổi (setting chưa đổi) mà vẫn chạy lại
    await setSetting(deps.db, 'unlockedPlants', ['daisy']);
    await new Promise((r) => setTimeout(r, 500));
    a.unsubscribe();
    b.unsubscribe();
    expect(ids.at(-1)).toEqual(['sunflower', 'corn', 'daisy']);
  });

  it('liveQuery: tick thói quen hôm nay (không đổi ngày) cũng cập nhật số ngày đạt', async () => {
    const { deps } = makeDeps();
    await deps.db.habits.add({ id: 'h', name: 'Đọc', icon: '📚', color: 'mint', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: '2026-09-01', createdAt: 0, updatedAt: 0 });
    const seen: number[] = [];
    const sub = liveQuery(() => plantUnlockState(deps)).subscribe((v) => seen.push(v.goodDays));
    await new Promise((r) => setTimeout(r, 300));
    await deps.db.habitChecks.put({ habitId: 'h', date: '2026-10-02', at: 0 });
    await new Promise((r) => setTimeout(r, 500));
    sub.unsubscribe();
    expect(seen.at(-1)).toBe(1);
  });
});

