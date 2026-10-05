import { availableStyles, bloomCounts, listUnlockedStyles, styleProgress, unlockStylesFor } from '../../../src/domain/styleUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
import { addTodo, changePlant, ensureToday, toggleTodo } from '../../../src/domain/dayService';
import { mulberry32 } from '../../../src/domain/random';
import { makeDay, makeDeps } from '../helpers';

/** n ngày ra hoa của một loài, bắt đầu từ 2026-08-01 */
const blooms = (plantId: string, n: number) =>
  Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom' }));

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
    await deps.db.days.bulkPut(Array.from({ length: 10 }, (_, i) => makeDay({ date: `2026-07-${String(i + 1).padStart(2, '0')}`, plantId: 'sunflower', finalStage: 'bloom' })));
    expect(await availableStyles(deps, 'sunflower')).toEqual(['base', 'mini', 'giant']);
  });

  it('khoá trong setting vẫn tính dù số ngày chưa đủ; bỏ khoá lạ', async () => {
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
    deps.rng = () => 0; // sunflower (trúng đặc biệt cũng không sao)
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
