import { COMMON_SAYINGS, pickSaying } from '../../../src/content/sayings';
import { PLANTS, getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';
import { LANGS } from '../../../src/i18n/lang';

describe('câu cây nói mỗi ngày', () => {
  it.each(LANGS)('[%s] có ít nhất 30 câu chung, không trùng, mỗi câu ≤ 100 ký tự', (lang) => {
    const list = COMMON_SAYINGS[lang];
    expect(list.length).toBeGreaterThanOrEqual(30);
    expect(new Set(list).size).toBe(list.length);
    for (const s of list) expect(s.length).toBeLessThanOrEqual(100);
  });

  it.each(LANGS)('[%s] mỗi loài có ít nhất 2 câu riêng, ≤ 100 ký tự', (lang) => {
    for (const p of PLANTS) {
      expect(p.sayings?.[lang].length ?? 0, p.id).toBeGreaterThanOrEqual(2);
      for (const s of p.sayings?.[lang] ?? []) expect(s.length, s).toBeLessThanOrEqual(100);
    }
  });

  it.each(LANGS)('[%s] pickSaying lấy từ câu chung + câu riêng của loài, đúng ngôn ngữ', (lang) => {
    const sunflower = getSpecies('sunflower');
    const pool = new Set([...COMMON_SAYINGS[lang], ...(sunflower.sayings?.[lang] ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickSaying(sunflower, rng, lang))).toBe(true);
  });
});
