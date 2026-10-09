import { render } from '@testing-library/react';
import { BUGS, bugFor, bugSpot, bugVisitKind, countBugs, getBug } from '../../../src/content/bugs';
import { addDays } from '../../../src/domain/dayKey';

describe('côn trùng thưởng ngày làm đủ thói quen', () => {
  it('đủ 10 loài, id không trùng, có tên Việt + Anh, vẽ được', () => {
    expect(BUGS.map((b) => b.id)).toEqual(['ladybug', 'butterfly', 'bee', 'caterpillar', 'ant', 'firefly', 'beetle', 'cricket', 'dragonfly', 'luna-moth']);
    for (const b of BUGS) {
      expect(b.name.vi.length).toBeGreaterThan(0);
      expect(b.name.en.length).toBeGreaterThan(0);
      const { container } = render(<svg><b.Art animate={false} /></svg>);
      expect(container.querySelector('svg')!.children.length).toBeGreaterThan(0);
    }
  });

  it('độ hiếm: 5 thường gặp, 3 hiếm, 2 rất hiếm', () => {
    expect(BUGS.map((b) => [b.id, b.weight, b.rarity])).toEqual([
      ['ladybug', 5, 'common'], ['butterfly', 4, 'common'], ['bee', 4, 'common'], ['caterpillar', 4, 'common'], ['ant', 4, 'common'],
      ['firefly', 2, 'rare'], ['beetle', 2, 'rare'], ['cricket', 2, 'rare'],
      ['dragonfly', 1, 'epic'], ['luna-moth', 1, 'epic'],
    ]);
  });

  it('bugVisitKind: gặp lần đầu → new; không thì hiếm → rare, rất hiếm → epic, thường → null', () => {
    expect(bugVisitKind(getBug('ladybug')!, false)).toBe('new');
    expect(bugVisitKind(getBug('dragonfly')!, false)).toBe('new');
    expect(bugVisitKind(getBug('ladybug')!, true)).toBeNull();
    expect(bugVisitKind(getBug('firefly')!, true)).toBe('rare');
    expect(bugVisitKind(getBug('luna-moth')!, true)).toBe('epic');
  });

  it('qua 4 năm, số ngày mỗi loài gần đúng tỉ lệ trọng số', () => {
    const days: string[] = [];
    for (let k = '2026-01-01'; k < '2030-01-01'; k = addDays(k, 1)) days.push(k);
    const counts = countBugs(days.map((d) => bugFor(d).id));
    const total = BUGS.reduce((n, b) => n + b.weight, 0);
    for (const b of BUGS) {
      const share = (counts.get(b.id) ?? 0) / days.length;
      expect(Math.abs(share - b.weight / total)).toBeLessThan(0.04);
    }
    expect(counts.get('dragonfly')!).toBeLessThan(counts.get('firefly')!);
    expect(counts.get('luna-moth')!).toBeLessThan(counts.get('cricket')!);
    expect(counts.get('firefly')!).toBeLessThan(counts.get('bee')!);
  });

  it('bugFor cố định theo ngày và đủ mọi loài qua nhiều ngày', () => {
    expect(bugFor('2026-10-08').id).toBe(bugFor('2026-10-08').id);
    const seen = new Set<string>();
    for (let k = '2026-01-01'; k < '2027-01-01'; k = addDays(k, 1)) seen.add(bugFor(k).id);
    expect(seen.size).toBe(BUGS.length);
  });

  it('bugSpot đậu cạnh mặt cây (bên phải, phía trên) và luôn trong khung 200×240', () => {
    const s = bugSpot({ x: 100, y: 100, scale: 0.6 });
    expect(s.x).toBeGreaterThan(100 + 0.6 * 20);
    expect(s.y).toBeLessThan(100);
    for (const a of [{ x: 150, y: 120, scale: 0.46 }, { x: 100, y: 32, scale: 0.45 }, { x: 190, y: 5, scale: 1 }]) {
      const p = bugSpot(a);
      expect(p.x).toBeGreaterThanOrEqual(22);
      expect(p.x).toBeLessThanOrEqual(178);
      expect(p.y).toBeGreaterThanOrEqual(22);
    }
  });
});
