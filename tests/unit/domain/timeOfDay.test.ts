import { timeOfDay } from '../../../src/domain/timeOfDay';

const at = (h: number, m = 0) => new Date(2026, 9, 2, h, m);

describe('timeOfDay', () => {
  it.each([
    [at(3, 59), 'evening'],
    [at(4), 'morning'],
    [at(10, 59), 'morning'],
    [at(11), 'noon'],
    [at(13, 59), 'noon'],
    [at(14), 'afternoon'],
    [at(17, 59), 'afternoon'],
    [at(18), 'evening'],
    [at(0), 'evening'],
  ] as const)('%s → %s', (date, expected) => {
    expect(timeOfDay(date)).toBe(expected);
  });
});
