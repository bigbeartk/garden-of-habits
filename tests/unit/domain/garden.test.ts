import { gardenReport } from '../../../src/domain/garden';
import { makeDay } from '../helpers';

const IDS = ['sunflower', 'corn', 'cactus'];
const todo = (done: boolean) => ({ id: crypto.randomUUID(), text: 'x', done, doneAt: done ? 1 : null, order: 0, period: 'morning' as const });

describe('gardenReport', () => {
  const records = [
    makeDay({ date: '2026-09-30', plantId: 'corn' }), // ngoài khoảng
    makeDay({ date: '2026-10-01', plantId: 'corn', finalStage: 'bloom', todos: [todo(true), todo(true)] }),
    makeDay({ date: '2026-10-02', plantId: 'cactus', todos: [todo(true), todo(false)], finalStage: 'bud' }),
    makeDay({ date: '2026-10-03', plantId: 'corn', isRestDay: true }), // ngày nghỉ vẫn tính là cây được chọn
    makeDay({ date: '2026-10-05', plantId: 'corn', finalStage: 'bloom', todos: [todo(true)] }),
    makeDay({ date: '2026-10-06', plantId: 'sunflower' }), // ngoài khoảng
  ];

  it('đếm số ngày mỗi cây được chọn trong khoảng (tính cả hai đầu), nhiều nhất đứng trước', () => {
    const r = gardenReport(records, IDS, '2026-10-01', '2026-10-05');
    expect(r.entries).toEqual([
      { plantId: 'corn', count: 3 },
      { plantId: 'cactus', count: 1 },
      { plantId: 'sunflower', count: 0 }, // vẫn có mặt, để vườn hiện đủ loài
    ]);
  });

  it('tổng kết: số ngày có cây, số ngày ra hoa, số việc đã xong', () => {
    const r = gardenReport(records, IDS, '2026-10-01', '2026-10-05');
    expect(r.days).toBe(4);
    expect(r.bloomDays).toBe(2);
    expect(r.todosDone).toBe(4);
  });

  it('cùng số lần thì giữ thứ tự loài trong danh sách; loài lạ (đã xoá khỏi nội dung) không có ô riêng', () => {
    const r = gardenReport(
      [makeDay({ date: '2026-10-01', plantId: 'cactus' }), makeDay({ date: '2026-10-02', plantId: 'sunflower' }), makeDay({ date: '2026-10-03', plantId: 'old-plant' })],
      IDS, '2026-10-01', '2026-10-31',
    );
    expect(r.entries.map((e) => e.plantId)).toEqual(['sunflower', 'cactus', 'corn']);
    expect(r.days).toBe(3);
  });

  it('ngày bắt đầu sau ngày kết thúc thì tự đổi chỗ', () => {
    expect(gardenReport(records, IDS, '2026-10-05', '2026-10-01')).toEqual(gardenReport(records, IDS, '2026-10-01', '2026-10-05'));
  });
});
