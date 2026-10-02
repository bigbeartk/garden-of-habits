import { addDays, dayKey, formatDate, parseDayKey } from '../../../src/domain/dayKey';

describe('dayKey', () => {
  it('trước 4:00 vẫn tính là ngày hôm trước', () => {
    expect(dayKey(new Date(2026, 9, 2, 3, 59))).toBe('2026-10-01');
  });
  it('từ 4:00 là ngày mới', () => {
    expect(dayKey(new Date(2026, 9, 2, 4, 0))).toBe('2026-10-02');
  });
  it('qua ranh giới năm', () => {
    expect(dayKey(new Date(2027, 0, 1, 2, 0))).toBe('2026-12-31');
  });
  it('formatDate thêm số 0', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('parseDayKey và addDays', () => {
    const d = parseDayKey('2026-10-02');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 2]);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
