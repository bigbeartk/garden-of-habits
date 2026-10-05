import { availableStyles, bloomCounts, listUnlockedStyles, styleProgress, unlockStylesFor } from '../../../src/domain/styleUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
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
