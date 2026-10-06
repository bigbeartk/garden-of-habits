import { COMMON_TAPS, SLEEPY_TAPS, pickTap } from '../../../src/content/taps';
import { getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';
import { LANGS } from '../../../src/i18n/lang';

const IDS = ['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon', 'hydrangea'];

describe('câu nói khi chạm vào cây', () => {
  it.each(LANGS)('[%s] lấy từ câu chung + câu riêng của loài', (lang) => {
    const cactus = getSpecies('cactus');
    const pool = new Set([...COMMON_TAPS[lang], ...(cactus.taps?.[lang] ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickTap(cactus, rng, { last: null, sleeping: false, lang }))).toBe(true);
  });

  it('không lặp lại câu vừa nói', () => {
    const rng = mulberry32(7);
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      const next = pickTap(getSpecies('rose'), rng, { last, sleeping: false, lang: 'en' });
      expect(next).not.toBe(last);
      last = next;
    }
  });

  it.each(LANGS)('[%s] cây đang ngủ (ngày tiết kiệm năng lượng) thì nói câu ngái ngủ', (lang) => {
    const rng = mulberry32(1);
    let last: string | null = null;
    for (let i = 0; i < 20; i++) {
      last = pickTap(getSpecies('corn'), rng, { last, sleeping: true, lang });
      expect(SLEEPY_TAPS[lang]).toContain(last);
    }
  });

  it.each(LANGS)('[%s] mỗi loài có ít nhất 2 câu riêng', (lang) => {
    for (const id of IDS) expect(getSpecies(id).taps?.[lang].length ?? 0, id).toBeGreaterThanOrEqual(2);
  });
});
