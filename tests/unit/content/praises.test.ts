import { BLOOM_PRAISES, COMMON_PRAISES, pickPraise } from '../../../src/content/praises';
import { getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';

describe('praises', () => {
  it('lời khen lấy từ câu chung + câu riêng của loài', () => {
    const corn = getSpecies('corn');
    const pool = new Set([...COMMON_PRAISES, ...(corn.praises ?? [])]);
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) expect(pool.has(pickPraise(corn, rng, false))).toBe(true);
  });

  it('xong hết việc (ra hoa) thì dùng câu khen đặc biệt', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 20; i++) expect(BLOOM_PRAISES).toContain(pickPraise(getSpecies('cherry'), rng, true));
  });

  it('mỗi loài có ít nhất một câu khen riêng', () => {
    for (const id of ['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry']) {
      expect(getSpecies(id).praises?.length ?? 0).toBeGreaterThan(0);
    }
  });
});
