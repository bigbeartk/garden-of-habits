import { PERIODS, periodOf } from '../../../src/domain/period';

const at = (h: number, m = 0) => new Date(2026, 9, 2, h, m);

describe('period', () => {
  it('có 3 buổi theo thứ tự Sáng, Chiều, Tối', () => {
    expect(PERIODS).toEqual(['morning', 'afternoon', 'evening']);
  });

  it.each([
    [at(4), 'morning'],
    [at(10, 59), 'morning'],
    [at(11), 'afternoon'],
    [at(17, 59), 'afternoon'],
    [at(18), 'evening'],
    [at(23, 59), 'evening'],
    [at(2), 'evening'],
  ] as const)('periodOf(%s) → %s', (d, expected) => {
    expect(periodOf(d)).toBe(expected);
  });
});
