import { mulberry32, pickUniform, pickWeighted, rollSpecial } from '../../../src/domain/random';

describe('random', () => {
  it('mulberry32 cùng seed cho cùng dãy số trong [0,1)', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('pickUniform trả về mọi phần tử', () => {
    const rng = mulberry32(1);
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(pickUniform(['a', 'b', 'c'], rng));
    expect([...seen].sort()).toEqual(['a', 'b', 'c']);
  });

  it('pickUniform với mảng rỗng thì báo lỗi', () => {
    expect(() => pickUniform([], mulberry32(1))).toThrow();
  });

  it('pickWeighted theo trọng số', () => {
    const rng = mulberry32(3);
    let heavy = 0;
    for (let i = 0; i < 10000; i++) {
      if (pickWeighted([{ id: 'h', weight: 9 }, { id: 'l', weight: 1 }], rng).id === 'h') heavy++;
    }
    expect(heavy / 10000).toBeGreaterThan(0.87);
    expect(heavy / 10000).toBeLessThan(0.93);
  });

  it('rollSpecial ra đặc biệt khoảng 10%', () => {
    const rng = mulberry32(42);
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (rollSpecial([{ id: 'glow', weight: 1 }], rng)) hits++;
    expect(hits / 10000).toBeGreaterThan(0.08);
    expect(hits / 10000).toBeLessThan(0.12);
  });

  it('rollSpecial không có hiệu ứng nào thì trả về null', () => {
    expect(rollSpecial([], () => 0)).toBeNull();
  });
});
