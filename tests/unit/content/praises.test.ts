import { BLOOM_PRAISES, COMMON_PRAISES, pickPraise } from '../../../src/content/praises';
import { getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';
import { LANGS } from '../../../src/i18n/lang';

describe('praises', () => {
  it.each(LANGS)('[%s] lời khen lấy từ câu chung + câu riêng của loài', (lang) => {
    const corn = getSpecies('corn');
    const pool = new Set([...COMMON_PRAISES[lang], ...(corn.praises?.[lang] ?? [])]);
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) expect(pool.has(pickPraise(corn, rng, false, lang))).toBe(true);
  });

  it.each(LANGS)('[%s] xong hết việc (ra hoa) thì dùng câu khen đặc biệt', (lang) => {
    const rng = mulberry32(9);
    for (let i = 0; i < 20; i++) expect(BLOOM_PRAISES[lang]).toContain(pickPraise(getSpecies('cherry'), rng, true, lang));
  });

  it.each(LANGS)('[%s] mỗi loài có ít nhất một câu khen riêng', (lang) => {
    for (const id of ['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon', 'hydrangea']) {
      expect(getSpecies(id).praises?.[lang].length ?? 0, id).toBeGreaterThan(0);
    }
  });
});
