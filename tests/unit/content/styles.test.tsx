import type { PlantSpecies } from '../../../src/content/types';
import { getStageArt, getStyle } from '../../../src/content/plants/styles';

const art = (name: string) => ({ image: name });
const anchor = (y: number) => ({ x: 100, y, scale: 1 });
const SPECIES: PlantSpecies = {
  id: 'x', name: { vi: 'X', en: 'X' }, defaultPotId: 'terracotta', faceStyle: 'cool',
  stages: { seed: art('seed'), sprout: art('sprout'), bud: art('bud'), bloom: art('bloom') },
  faceAnchor: { seed: anchor(1), sprout: anchor(2), bud: anchor(3), bloom: anchor(4) },
  styles: [
    { id: 'tall', name: { vi: 'Cao', en: 'Tall' }, unlockAt: 10, render: 'pixel', stages: { bud: art('tall-bud'), bloom: art('tall-bloom') }, faceAnchor: { bud: anchor(30), bloom: anchor(40) } },
    { id: 'lady', name: { vi: 'Quý cô', en: 'Lady' }, unlockAt: 20, render: 'clay', faceStyle: 'lady', stages: { bud: art('lady-bud'), bloom: art('lady-bloom') }, faceAnchor: { bud: anchor(31), bloom: anchor(41) } },
  ],
};

describe('getStageArt', () => {
  it('Gốc, null, undefined hay id lạ đều dùng hình gốc', () => {
    for (const id of ['base', null, undefined, 'khong-co']) {
      expect(getStageArt(SPECIES, id, 'bloom')).toEqual({ art: art('bloom'), faceAnchor: anchor(4), faceStyle: 'cool' });
    }
  });

  it('dáng mới chỉ đổi bud/bloom; seed/sprout luôn là gốc', () => {
    expect(getStageArt(SPECIES, 'tall', 'bud')).toEqual({ art: art('tall-bud'), faceAnchor: anchor(30), faceStyle: 'cool', render: 'pixel' });
    expect(getStageArt(SPECIES, 'tall', 'bloom').art).toEqual(art('tall-bloom'));
    expect(getStageArt(SPECIES, 'tall', 'seed').art).toEqual(art('seed'));
    expect(getStageArt(SPECIES, 'tall', 'sprout').faceAnchor).toEqual(anchor(2));
  });

  it('faceStyle riêng của dáng thắng faceStyle của loài', () => {
    expect(getStageArt(SPECIES, 'lady', 'bloom').faceStyle).toBe('lady');
  });

  it('getStyle trả null cho Gốc và id lạ', () => {
    expect(getStyle(SPECIES, 'base')).toBeNull();
    expect(getStyle(SPECIES, 'nope')).toBeNull();
    expect(getStyle(SPECIES, 'tall')?.name.en).toBe('Tall');
  });
});
