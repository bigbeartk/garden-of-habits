import { render } from '@testing-library/react';
import { BUGS, bugFor, bugSpot, countBugs } from '../../../src/content/bugs';
import { addDays } from '../../../src/domain/dayKey';

describe('côn trùng thưởng ngày làm đủ thói quen', () => {
  it('đủ 5 loài, id không trùng, có tên Việt + Anh, vẽ được', () => {
    expect(BUGS.map((b) => b.id)).toEqual(['ladybug', 'butterfly', 'bee', 'firefly', 'dragonfly']);
    for (const b of BUGS) {
      expect(b.name.vi.length).toBeGreaterThan(0);
      expect(b.name.en.length).toBeGreaterThan(0);
      const { container } = render(<svg><b.Art animate={false} /></svg>);
      expect(container.querySelector('svg')!.children.length).toBeGreaterThan(0);
    }
  });

  it('độ hiếm: bọ rùa/bướm/ong thường gặp, đom đóm hiếm, chuồn chuồn rất hiếm', () => {
    expect(BUGS.map((b) => [b.id, b.weight, b.rarity])).toEqual([
      ['ladybug', 5, 'common'], ['butterfly', 4, 'common'], ['bee', 4, 'common'], ['firefly', 2, 'rare'], ['dragonfly', 1, 'epic'],
    ]);
  });

  it('qua 4 năm, số ngày mỗi loài gần đúng tỉ lệ trọng số', () => {
    const days: string[] = [];
    for (let k = '2026-01-01'; k < '2030-01-01'; k = addDays(k, 1)) days.push(k);
    const counts = countBugs(days);
    const total = BUGS.reduce((n, b) => n + b.weight, 0);
    for (const b of BUGS) {
      const share = (counts.get(b.id) ?? 0) / days.length;
      expect(Math.abs(share - b.weight / total)).toBeLessThan(0.04);
    }
    expect(counts.get('dragonfly')!).toBeLessThan(counts.get('firefly')!);
    expect(counts.get('firefly')!).toBeLessThan(counts.get('bee')!);
  });

  it('bugFor cố định theo ngày và đủ mọi loài qua nhiều ngày', () => {
    expect(bugFor('2026-10-08').id).toBe(bugFor('2026-10-08').id);
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) seen.add(bugFor(`2026-02-${String(d).padStart(2, '0')}`).id);
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
