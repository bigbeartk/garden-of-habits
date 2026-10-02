import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { CATALOG } from '../../../src/content/catalog';
import { COMMON_GREETINGS, pickGreeting } from '../../../src/content/greetings';
import { PLANTS, getSpecies } from '../../../src/content/plants/registry';
import { POTS } from '../../../src/content/pots/registry';
import { SPECIALS } from '../../../src/content/specials/registry';
import { GROWTH_STAGES } from '../../../src/domain/growth';
import { mulberry32 } from '../../../src/domain/random';

describe('plants', () => {
  it('có 8 loài theo thứ tự', () => {
    expect(PLANTS.map((p) => p.id)).toEqual(['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon']);
    expect(PLANTS.map((p) => p.name)).toEqual(['Hướng dương', 'Ngô', 'Xương rồng', 'Trầu bà', 'Cây cam', 'Cherry', 'Hoa hồng', 'Dưa hấu']);
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

  it('getSpecies với id lạ trả về loài đầu tiên', () => {
    expect(getSpecies('khong-co').id).toBe('sunflower');
  });

  it('CATALOG khớp với registry', () => {
    expect(CATALOG.plants).toEqual(PLANTS.map((p) => ({ id: p.id, defaultPotId: p.defaultPotId })));
    expect(CATALOG.potIds).toEqual(POTS.map((p) => p.id));
    expect(CATALOG.specials).toEqual(SPECIALS.map((s) => ({ id: s.id, weight: s.weight })));
  });

  it('pickGreeting lấy từ câu chung + câu riêng của loài', () => {
    const sunflower = getSpecies('sunflower');
    const pool = new Set([...COMMON_GREETINGS, ...(sunflower.greetings ?? [])]);
    const rng = mulberry32(5);
    for (let i = 0; i < 50; i++) expect(pool.has(pickGreeting(sunflower, rng))).toBe(true);
  });
});
