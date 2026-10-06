import { buildMonthGrid, dayCellStatus, shiftMonth } from '../../../src/domain/calendar';
import { fitWithin } from '../../../src/utils/image';
import { makeDay } from '../helpers';

describe('calendar', () => {
  it('tháng 10/2026 bắt đầu thứ Năm → 3 ô trống đầu (tuần bắt đầu thứ Hai)', () => {
    const cells = buildMonthGrid(2026, 9);
    expect(cells).toHaveLength(35);
    expect(cells.slice(0, 3).every((c) => c.key === null)).toBe(true);
    expect(cells[3]).toEqual({ key: '2026-10-01', day: 1 });
    expect(cells[33]).toEqual({ key: '2026-10-31', day: 31 });
  });

  it('tháng 2/2027 bắt đầu thứ Hai và vừa khít 4 tuần', () => {
    const cells = buildMonthGrid(2027, 1);
    expect(cells).toHaveLength(28);
    expect(cells[0].key).toBe('2027-02-01');
  });

  it('dayCellStatus', () => {
    const today = '2026-10-15';
    const first = '2026-10-02';
    expect(dayCellStatus('2026-10-03', makeDay({ date: '2026-10-03' }), today, first)).toBe('plant');
    expect(dayCellStatus('2026-10-04', makeDay({ date: '2026-10-04', isRestDay: true }), today, first)).toBe('rest');
    expect(dayCellStatus('2026-10-05', undefined, today, first)).toBe('missed');
    expect(dayCellStatus('2026-10-01', undefined, today, first)).toBe('before-start');
    expect(dayCellStatus('2026-09-20', undefined, today, null)).toBe('before-start');
    expect(dayCellStatus('2026-10-15', undefined, today, first)).toBe('today-pending');
    expect(dayCellStatus('2026-10-16', undefined, today, first)).toBe('future');
  });

  it('shiftMonth qua năm', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });

  it('fitWithin giữ tỉ lệ và không phóng to', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });
});
