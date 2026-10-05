import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { CATALOG } from '../../../src/content/catalog';
import { PLANTS, getSpecies } from '../../../src/content/plants/registry';
import { POTS } from '../../../src/content/pots/registry';
import { SPECIALS } from '../../../src/content/specials/registry';
import { GROWTH_STAGES } from '../../../src/domain/growth';

describe('plants', () => {
  it('có 9 loài theo thứ tự', () => {
    expect(PLANTS.map((p) => p.id)).toEqual(['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon', 'hydrangea']);
    expect(PLANTS.map((p) => p.name)).toEqual(['Hướng dương', 'Ngô', 'Xương rồng', 'Monstera', 'Cây cam', 'Cherry', 'Hoa hồng', 'Dưa hấu', 'Tulip']);
  });

  it('mỗi loài có đủ 4 giai đoạn, toạ độ mặt và chậu mặc định hợp lệ', () => {
    const potIds = new Set(POTS.map((p) => p.id));
    for (const p of PLANTS) {
      expect(potIds.has(p.defaultPotId)).toBe(true);
      for (const stage of GROWTH_STAGES) {
        expect(p.stages[stage]).toBeDefined();
        expect(p.faceAnchor[stage].scale).toBeGreaterThan(0);
        const { unmount } = render(<svg><ArtView art={p.stages[stage]} /></svg>);
        unmount();
      }
    }
  });

  it('mỗi loài có chậu mặc định khác nhau', () => {
    expect(new Set(PLANTS.map((p) => p.defaultPotId)).size).toBe(PLANTS.length);
  });

  it('loài có dáng thì đúng 2 dáng: id duy nhất, khác "base", mốc 10 rồi 20, đủ bud/bloom', () => {
    for (const p of PLANTS.filter((s) => s.styles)) {
      const styles = p.styles!;
      expect(styles.map((s) => s.unlockAt)).toEqual([10, 20]);
      expect(new Set(styles.map((s) => s.id)).size).toBe(2);
      for (const s of styles) {
        expect(s.id).not.toBe('base');
        expect(s.name.length).toBeGreaterThan(0);
        for (const stage of ['bud', 'bloom'] as const) {
          expect(s.faceAnchor[stage].scale).toBeGreaterThan(0);
          const { unmount } = render(<svg><ArtView art={s.stages[stage]} /></svg>);
          unmount();
        }
      }
    }
  });

  it('dáng của từng loài theo thứ tự', () => {
    expect(Object.fromEntries(PLANTS.filter((p) => p.styles).map((p) => [p.id, p.styles!.map((s) => s.id)]))).toEqual({
      sunflower: ['mini', 'giant'],
      corn: ['popcorn', 'rainbow'],
    });
  });

  it('getSpecies với id lạ trả về loài đầu tiên', () => {
    expect(getSpecies('khong-co').id).toBe('sunflower');
  });

  it('CATALOG khớp với registry', () => {
    expect(CATALOG.plants).toEqual(PLANTS.map((p) => ({
      id: p.id, defaultPotId: p.defaultPotId,
      styles: (p.styles ?? []).map((s) => ({ id: s.id, unlockAt: s.unlockAt })),
    })));
    expect(CATALOG.potIds).toEqual(POTS.map((p) => p.id));
    expect(CATALOG.specials).toEqual(SPECIALS.map((s) => ({ id: s.id, weight: s.weight })));
  });
});
