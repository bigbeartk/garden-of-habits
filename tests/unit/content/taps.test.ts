import { COMMON_TAPS, SLEEPY_TAPS, pickTap } from '../../../src/content/taps';
import { getSpecies } from '../../../src/content/plants/registry';
import { mulberry32 } from '../../../src/domain/random';

const IDS = ['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon', 'hydrangea'];

describe('câu nói khi chạm vào cây', () => {
  it('lấy từ câu chung + câu riêng của loài', () => {
    const cactus = getSpecies('cactus');
    const pool = new Set([...COMMON_TAPS, ...(cactus.taps ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickTap(cactus, rng, { last: null, sleeping: false }))).toBe(true);
  });

  it('không lặp lại câu vừa nói', () => {
    const rng = mulberry32(7);
    let last: string | null = null;
    for (let i = 0; i < 100; i++) {
      const next = pickTap(getSpecies('rose'), rng, { last, sleeping: false });
      expect(next).not.toBe(last);
      last = next;
    }
  });

  it('cây đang ngủ (ngày tiết kiệm năng lượng) thì nói câu ngái ngủ', () => {
    const rng = mulberry32(1);
    let last: string | null = null;
    for (let i = 0; i < 20; i++) {
      last = pickTap(getSpecies('corn'), rng, { last, sleeping: true });
      expect(SLEEPY_TAPS).toContain(last);
    }
  });

  it('mỗi loài có ít nhất 2 câu riêng', () => {
    for (const id of IDS) expect(getSpecies(id).taps?.length ?? 0, id).toBeGreaterThanOrEqual(2);
  });
});
