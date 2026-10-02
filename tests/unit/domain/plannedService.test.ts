import { addPlanned, deletePlanned, editPlanned, getPlannedGoal, listPlanned, plannedCountsInRange, setPlannedGoal } from '../../../src/domain/plannedService';
import { ensureToday } from '../../../src/domain/dayService';
import { makeDeps } from '../helpers';

describe('việc đã lên lịch cho ngày tương lai', () => {
  it('thêm việc cho ngày sau hôm nay, cắt khoảng trắng, giữ buổi', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    await addPlanned(deps, '2026-10-05', '  Khám răng ', 'afternoon');
    await addPlanned(deps, '2026-10-05', 'Mua quà', 'evening');
    const list = await listPlanned(deps.db, '2026-10-05');
    expect(list.map((p) => [p.text, p.period])).toEqual([['Khám răng', 'afternoon'], ['Mua quà', 'evening']]);
  });

  it('không lên lịch cho hôm nay hay ngày đã qua, không nhận nội dung trống', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    await expect(addPlanned(deps, '2026-10-02', 'A', 'morning')).rejects.toThrow('Chỉ lên lịch được cho ngày sau hôm nay');
    await expect(addPlanned(deps, '2026-10-01', 'A', 'morning')).rejects.toThrow('Chỉ lên lịch được cho ngày sau hôm nay');
    await expect(addPlanned(deps, '2026-10-05', '   ', 'morning')).rejects.toThrow('không được để trống');
  });

  it('xoá việc đã lên lịch và đếm theo ngày', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    const a = await addPlanned(deps, '2026-10-05', 'A', 'morning');
    await addPlanned(deps, '2026-10-05', 'B', 'morning');
    await addPlanned(deps, '2026-10-20', 'C', 'morning');
    await addPlanned(deps, '2026-11-01', 'D', 'morning');
    await deletePlanned(deps.db, a.id);
    expect(await plannedCountsInRange(deps.db, '2026-10-01', '2026-10-31')).toEqual({ '2026-10-05': 1, '2026-10-20': 1 });
  });

  it('đến ngày đó: việc đã lên lịch vào danh sách sau việc của mẫu, rồi được xoá khỏi danh sách chờ', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0));
    await deps.db.templates.put({ id: 't', name: 'Sáng', items: [{ text: 'Tập thể dục', period: 'morning' }], isDefault: true, createdAt: 1, updatedAt: 1 });
    await addPlanned(deps, '2026-10-03', 'Khám răng', 'afternoon');
    await addPlanned(deps, '2026-10-04', 'Để ngày sau', 'evening');
    clock.current = new Date(2026, 9, 3, 8, 0);
    const day = await ensureToday(deps);
    expect(day.todos.map((t) => [t.text, t.period])).toEqual([['Tập thể dục', 'morning'], ['Khám răng', 'afternoon']]);
    expect(await listPlanned(deps.db, '2026-10-03')).toEqual([]);
    expect((await listPlanned(deps.db, '2026-10-04')).map((p) => p.text)).toEqual(['Để ngày sau']);
  });
});

describe('sửa việc đã lên lịch', () => {
  it('editPlanned cắt khoảng trắng, từ chối nội dung trống', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    const a = await addPlanned(deps, '2026-10-05', 'Khám răng', 'morning');
    await editPlanned(deps.db, a.id, '  Khám răng lúc 9h ');
    expect((await listPlanned(deps.db, '2026-10-05'))[0].text).toBe('Khám răng lúc 9h');
    await expect(editPlanned(deps.db, a.id, '  ')).rejects.toThrow('không được để trống');
  });
});

describe('mục tiêu cho ngày tương lai', () => {
  it('đặt, sửa, xoá trống; chỉ cho ngày sau hôm nay', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0));
    await setPlannedGoal(deps, '2026-10-05', '  Đi khám răng ');
    expect(await getPlannedGoal(deps.db, '2026-10-05')).toBe('Đi khám răng');
    await setPlannedGoal(deps, '2026-10-05', '   ');
    expect(await getPlannedGoal(deps.db, '2026-10-05')).toBe('');
    await expect(setPlannedGoal(deps, '2026-10-02', 'A')).rejects.toThrow('Chỉ lên lịch được cho ngày sau hôm nay');
  });

  it('đến ngày đó: mục tiêu thành mục tiêu của ngày rồi được xoá khỏi danh sách chờ', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0));
    await setPlannedGoal(deps, '2026-10-03', 'Ngày dọn nhà');
    clock.current = new Date(2026, 9, 3, 8, 0);
    expect((await ensureToday(deps)).title).toBe('Ngày dọn nhà');
    expect(await getPlannedGoal(deps.db, '2026-10-03')).toBe('');
  });
});
