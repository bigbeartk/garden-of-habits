import { activeReminders, doneThisWeek, weekStart } from '../../../src/domain/reminderView';
import type { Reminder } from '../../../src/domain/types';

const rem = (p: Partial<Reminder> & { id: string }): Reminder => ({
  text: p.id, autoToday: false, doneAt: null, createdAt: 0, updatedAt: 0, ...p,
});

describe('activeReminders', () => {
  it('chỉ việc chưa xong, theo thứ tự thêm', () => {
    const list = [
      rem({ id: 'c', createdAt: 3 }),
      rem({ id: 'a', createdAt: 1 }),
      rem({ id: 'done', createdAt: 0, doneAt: 10 }),
      rem({ id: 'b', createdAt: 2 }),
    ];
    expect(activeReminders(list).map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('tuần', () => {
  it('weekStart là thứ Hai của tuần (kể cả khi hôm nay là Chủ nhật)', () => {
    expect(weekStart('2026-10-05')).toBe('2026-10-05'); // thứ Hai
    expect(weekStart('2026-10-07')).toBe('2026-10-05');
    expect(weekStart('2026-10-11')).toBe('2026-10-05'); // Chủ nhật
  });

  it('doneThisWeek: xong từ 4:00 thứ Hai trở đi, mới xong lên trên', () => {
    const list = [
      rem({ id: 'sunday-night', doneAt: new Date(2026, 9, 5, 3, 0).getTime() }), // 3:00 sáng thứ Hai = vẫn là Chủ nhật
      rem({ id: 'mon', doneAt: new Date(2026, 9, 5, 9, 0).getTime() }),
      rem({ id: 'wed', doneAt: new Date(2026, 9, 7, 9, 0).getTime() }),
      rem({ id: 'active' }),
    ];
    expect(doneThisWeek(list, '2026-10-07').map((r) => r.id)).toEqual(['wed', 'mon']);
  });
});
