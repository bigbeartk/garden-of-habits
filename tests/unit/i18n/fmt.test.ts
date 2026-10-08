import { describe, expect, it } from 'vitest';
import { dateTime, longDate, monthLabel, shortDate, weekdayName } from '../../../src/i18n/fmt';
import { en } from '../../../src/i18n/en';
import { vi } from '../../../src/i18n/vi';

describe('fmt', () => {
  it('tiếng Việt giữ đúng chữ cũ', () => {
    expect(monthLabel('vi', 2026, 9)).toBe('Tháng 10, 2026');
    expect(longDate('vi', '2026-10-01')).toBe('Thứ Năm, 01/10/2026');
    expect(longDate('vi', '2026-10-04')).toBe('Chủ Nhật, 04/10/2026');
    expect(vi.calendar.weekdaysShort).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  });
  it('English', () => {
    expect(monthLabel('en', 2026, 9)).toBe('October 2026');
    expect(longDate('en', '2026-10-01')).toBe('Thursday, Oct 1, 2026');
    expect(en.calendar.weekdaysShort).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
  it('shortDate', () => {
    expect(shortDate('vi', '2026-10-06')).toBe('06/10');
    expect(shortDate('en', '2026-10-06')).toBe('Oct 6');
  });
  it('tên thứ', () => {
    expect(weekdayName('vi', '2026-10-04')).toBe('Chủ Nhật');
    expect(weekdayName('en', '2026-10-04')).toBe('Sunday');
  });
  it('dateTime theo locale', () => {
    const ms = new Date(2026, 9, 6, 14, 5).getTime();
    expect(dateTime('vi', ms)).toBe(new Date(ms).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }));
    expect(dateTime('en', ms)).toContain('2026');
  });
  it('nhãn buổi và giai đoạn', () => {
    expect([vi.period.morning, vi.period.afternoon, vi.period.evening]).toEqual(['Sáng', 'Chiều', 'Tối']);
    expect(en.stage.bloom).toBe('Bloom');
  });
});

it('số nhiều tiếng Anh ở tóm tắt Khu vườn', () => {
  expect([en.garden.days(1), en.garden.days(2)]).toEqual(['day', 'days']);
  expect([en.garden.blooms(1), en.garden.blooms(365)]).toEqual(['bloom', 'blooms']);
  expect([en.garden.tasks(1), en.garden.tasks(0)]).toEqual(['task', 'tasks']);
});
