import { describe, expect, it } from 'vitest';
import { cellState, datesBetween, habitReport, periodRange, shiftPeriod } from '../../../src/domain/habitReport';
import type { Habit, HabitCheck } from '../../../src/domain/types';

const habit = (p: Partial<Habit> & { id: string }): Habit => ({
  name: p.id, icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: '2026-01-01', createdAt: 0, updatedAt: 0, ...p,
});
const check = (habitId: string, date: string): HabitCheck => ({ habitId, date, at: 0 });
const NONE = new Set<string>();

describe('kỳ báo cáo', () => {
  it('tuần T2→CN, tháng, năm', () => {
    expect(periodRange('week', '2026-10-08')).toEqual({ from: '2026-10-05', to: '2026-10-11' });
    expect(periodRange('week', '2026-10-11')).toEqual({ from: '2026-10-05', to: '2026-10-11' }); // CN thuộc tuần trước đó
    expect(periodRange('month', '2026-02-10')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
    expect(periodRange('year', '2026-10-08')).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });
  it('shiftPeriod trả về đầu kỳ', () => {
    expect(shiftPeriod('week', '2026-10-08', -1)).toBe('2026-09-28');
    expect(shiftPeriod('month', '2026-01-31', 1)).toBe('2026-02-01');
    expect(shiftPeriod('year', '2026-10-08', -1)).toBe('2025-01-01');
  });
  it('datesBetween tính cả hai đầu', () => {
    expect(datesBetween('2026-10-30', '2026-11-02')).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
  });
});

describe('cellState', () => {
  const h = habit({ id: 'a', weekdays: [1, 3, 5], startDate: '2026-10-05' }); // T2/T4/T6 từ 05/10
  const today = '2026-10-09'; // T6
  it('mọi trạng thái', () => {
    expect(cellState(h, '2026-10-05', true, false, today)).toBe('done');
    expect(cellState(h, '2026-10-07', false, false, today)).toBe('missed');
    expect(cellState(h, '2026-10-09', false, false, today)).toBe('pending');
    expect(cellState(h, '2026-10-06', false, false, today)).toBe('off');   // T3 không có lịch
    expect(cellState(h, '2026-10-07', false, true, today)).toBe('off');    // ngày nghỉ
    expect(cellState(h, '2026-10-02', false, false, today)).toBe('off');   // trước startDate
    expect(cellState(h, '2026-10-12', false, false, today)).toBe('future');
  });
  it('đã tick vào ngày nay không còn trong lịch vẫn là done', () => {
    expect(cellState(h, '2026-10-06', true, false, today)).toBe('done');
  });
});

describe('habitReport', () => {
  const today = '2026-10-08'; // T5
  const a = habit({ id: 'a' });
  const b = habit({ id: 'b', weekdays: [1, 3] }); // T2, T4

  it('đếm %, tổng lần làm, ngày trọn vẹn, huy hiệu từng thói quen', () => {
    const checks = [check('a', '2026-10-05'), check('a', '2026-10-06'), check('a', '2026-10-07'), check('a', '2026-10-08'), check('b', '2026-10-05')];
    const r = habitReport([a, b], checks, NONE, '2026-10-05', '2026-10-11', today);
    // a: 4/4 done (T2..T5); b: T2 done, T4 missed
    expect(r.rows[0]).toMatchObject({ done: 4, counted: 4, rate: 100, perfect: true });
    expect(r.rows[1]).toMatchObject({ done: 1, counted: 2, rate: 50, perfect: false });
    expect(r.stats).toEqual({ metPct: 83, perfectDays: 3, totalDone: 5, bestStreak: 2 });
    // trọn vẹn: 05 (a+b), 06 (a), 08 (a); 07 hỏng vì b missed → chuỗi 05-06 = 2, 08 = 1
    expect(r.perfectDays).toEqual(['2026-10-05', '2026-10-06', '2026-10-08']);
    expect(r.perfectPeriod).toBe(false);
    expect(r.rows[0].cells.map((c) => c.state)).toEqual(['done', 'done', 'done', 'done', 'future', 'future', 'future']);
  });

  it('ngày không có lịch / ngày nghỉ không làm đứt chuỗi', () => {
    // kỳ 05–11/10 đã qua hết (hôm nay 11/10), nên mới được tính 👑
    const t = habit({ id: 't', weekdays: [1, 3] });
    const checks = [check('t', '2026-10-05'), check('t', '2026-10-07')];
    const r = habitReport([t], checks, new Set(['2026-10-06']), '2026-10-05', '2026-10-11', '2026-10-11');
    expect(r.stats.bestStreak).toBe(2);
    expect(r.perfectPeriod).toBe(true);
  });

  it('kỳ đang diễn ra (còn ngày tương lai) chưa được 👑 dù mọi ngày đã có đều trọn vẹn', () => {
    // hôm nay 08/10, kỳ 05–11/10; thói quen mỗi ngày, 05–08 đều đã tick
    const daily = habit({ id: 'd' });
    const checks = ['05', '06', '07', '08'].map((d) => check('d', `2026-10-${d}`));
    const r = habitReport([daily], checks, NONE, '2026-10-05', '2026-10-11', today);
    expect(r.stats.perfectDays).toBe(4);
    expect(r.perfectPeriod).toBe(false);
  });

  it('kỳ đã qua hết và mọi ngày có lịch đều trọn vẹn → 👑', () => {
    const daily = habit({ id: 'd' });
    const checks = ['05', '06', '07', '08', '09', '10', '11'].map((d) => check('d', `2026-10-${d}`));
    const r = habitReport([daily], checks, NONE, '2026-10-05', '2026-10-11', '2026-10-12');
    expect(r.perfectPeriod).toBe(true);
  });

  it('hôm nay chưa tick là pending: chưa trọn vẹn nhưng không bị coi là bỏ lỡ', () => {
    const r = habitReport([a], [], NONE, '2026-10-08', '2026-10-08', today);
    expect(r.rows[0].cells[0].state).toBe('pending');
    expect(r.stats).toEqual({ metPct: 0, perfectDays: 0, totalDone: 0, bestStreak: 0 });
  });

  it('không có ô có lịch nào → % là null', () => {
    const r = habitReport([a], [], NONE, '2026-10-12', '2026-10-18', today);
    expect(r.stats.metPct).toBeNull();
    expect(r.rows[0].rate).toBeNull();
  });

  it('đổi lịch sau khi tick: lần tick cũ vẫn tính done', () => {
    const changed = habit({ id: 'c', weekdays: [3] }); // trước là mỗi ngày, nay chỉ T4
    const r = habitReport([changed], [check('c', '2026-10-05')], NONE, '2026-10-05', '2026-10-11', today);
    expect(r.rows[0].cells[0].state).toBe('done');
    expect(r.stats.totalDone).toBe(1);
  });

  it('bỏ qua check của thói quen không còn trong danh sách', () => {
    const r = habitReport([a], [check('zzz', '2026-10-05')], NONE, '2026-10-05', '2026-10-05', today);
    expect(r.stats.totalDone).toBe(0);
  });
});
