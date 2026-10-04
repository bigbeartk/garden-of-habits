import { changePlant, ensureToday } from '../../../src/domain/dayService';
import { listUnlockedSpecials } from '../../../src/domain/specialUnlocks';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps } from '../helpers';

describe('cây đặc biệt đã mở khoá', () => {
  it('tung trúng cây đặc biệt khi tạo ngày mới thì mở khoá đúng cặp đó', async () => {
    const { deps } = makeDeps();
    deps.rng = () => 0; // loài đầu tiên + trúng 10% + hiệu ứng đầu tiên
    const day = await ensureToday(deps);
    expect([day.plantId, day.specialId]).toEqual(['sunflower', 'glow']);
    expect(await getSetting(deps.db, 'unlockedSpecials')).toEqual(['sunflower|glow']);
    expect(await listUnlockedSpecials(deps)).toEqual([{ plantId: 'sunflower', specialId: 'glow' }]);
  });

  it('ngày thường không mở khoá gì', async () => {
    const { deps } = makeDeps();
    deps.rng = () => 0.5;
    await ensureToday(deps);
    expect(await listUnlockedSpecials(deps)).toEqual([]);
  });

  it('đổi sang cây thường ngay hôm tung trúng vẫn giữ cặp đã mở khoá', async () => {
    const { deps } = makeDeps();
    deps.rng = () => 0;
    const { date } = await ensureToday(deps);
    const day = await changePlant(deps, date, 'corn');
    expect(day.specialId).toBeNull();
    expect(await listUnlockedSpecials(deps)).toEqual([{ plantId: 'sunflower', specialId: 'glow' }]);
  });

  it('cặp có trong lịch sử trước bản cập nhật cũng tính là đã mở; không trùng; theo thứ tự nội dung', async () => {
    const { deps } = makeDeps();
    await deps.db.days.bulkPut([
      makeDay({ date: '2026-09-01', plantId: 'corn', specialId: 'glow' }),
      makeDay({ date: '2026-09-02', plantId: 'sunflower', specialId: 'glow' }),
      makeDay({ date: '2026-09-03', plantId: 'corn', specialId: 'glow' }),
    ]);
    await setSetting(deps.db, 'unlockedSpecials', ['sunflower|glow']);
    expect(await listUnlockedSpecials(deps)).toEqual([
      { plantId: 'sunflower', specialId: 'glow' },
      { plantId: 'corn', specialId: 'glow' },
    ]);
  });

  it('bỏ qua cặp có loài hoặc hiệu ứng đã xoá khỏi nội dung', async () => {
    const { deps } = makeDeps();
    await setSetting(deps.db, 'unlockedSpecials', ['banana|glow', 'corn|lava', 'corn|glow', 'rác']);
    await deps.db.days.put(makeDay({ date: '2026-09-01', plantId: 'old', specialId: 'glow' }));
    expect(await listUnlockedSpecials(deps)).toEqual([{ plantId: 'corn', specialId: 'glow' }]);
  });
});

describe('changePlant với cây đặc biệt', () => {
  it('chọn loài thường thì thành cây thường', async () => {
    const { deps } = makeDeps();
    const date = '2026-10-02';
    await deps.db.days.put(makeDay({ date, plantId: 'sunflower', potId: 'terracotta', specialId: 'glow' }));
    const day = await changePlant(deps, date, 'corn');
    expect([day.plantId, day.potId, day.specialId]).toEqual(['corn', 'rattan', null]);
  });

  it('chọn cặp đã mở khoá thì đặt cả loài lẫn hiệu ứng', async () => {
    const { deps } = makeDeps();
    deps.rng = () => 0.5;
    const { date } = await ensureToday(deps);
    await setSetting(deps.db, 'unlockedSpecials', ['corn|glow']);
    const day = await changePlant(deps, date, 'corn', 'glow');
    expect([day.plantId, day.potId, day.specialId]).toEqual(['corn', 'rattan', 'glow']);
  });

  it('cặp chưa mở khoá thì báo lỗi và không đổi gì', async () => {
    const { deps } = makeDeps();
    deps.rng = () => 0.5;
    const before = await ensureToday(deps);
    await expect(changePlant(deps, before.date, 'corn', 'glow')).rejects.toThrow(/chưa mở khoá/);
    expect((await deps.db.days.get(before.date))!.specialId).toBe(before.specialId);
  });
});
