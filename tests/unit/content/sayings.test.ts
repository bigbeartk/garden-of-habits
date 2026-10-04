import { COMMON_SAYINGS, pickSaying } from '../../../src/content/sayings';
import { PLANTS, getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';

describe('câu cây nói mỗi ngày', () => {
  it('có ít nhất 30 câu chung, không trùng, mỗi câu ≤ 100 ký tự', () => {
    expect(COMMON_SAYINGS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(COMMON_SAYINGS).size).toBe(COMMON_SAYINGS.length);
    for (const s of COMMON_SAYINGS) expect(s.length).toBeLessThanOrEqual(100);
  });

  it('mỗi loài có ít nhất 2 câu riêng', () => {
    for (const p of PLANTS) expect(p.sayings?.length ?? 0, p.id).toBeGreaterThanOrEqual(2);
  });

  it('pickSaying lấy từ câu chung + câu riêng của loài', () => {
    const sunflower = getSpecies('sunflower');
    const pool = new Set([...COMMON_SAYINGS, ...(sunflower.sayings ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickSaying(sunflower, rng))).toBe(true);
  });
});
