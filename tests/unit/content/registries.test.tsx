import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { DEFAULT_POT_ID, POTS, getPot } from '../../../src/content/pots/registry';
import { SPECIALS, getSpecial } from '../../../src/content/specials/registry';
import { getSpecies } from '../../../src/content/plants/registry';
import { PlantScene } from '../../../src/components/PlantScene';

describe('pots', () => {
  it('id duy nhất và vẽ được tất cả', () => {
    expect(new Set(POTS.map((p) => p.id)).size).toBe(POTS.length);
    for (const pot of POTS) {
      const { container, unmount } = render(<svg><ArtView art={pot.art} /></svg>);
      expect(container.querySelector('[data-part="pot"]')).not.toBeNull();
      unmount();
    }
  });

  it('getPot với id lạ trả về chậu mặc định', () => {
    expect(getPot('khong-co').id).toBe(DEFAULT_POT_ID);
  });
});

describe('chậu mới cho hoa hồng và dưa hấu', () => {
  it('có chậu Sứ hoa hồng và Xô thiếc làm chậu mặc định', () => {
    expect(getPot('rose-porcelain').name).toBe('Sứ hoa hồng');
    expect(getPot('tin-bucket').name).toBe('Xô thiếc');
    expect(getPot('blue-ceramic').name).toBe('Gốm xanh lam');
  });
});

describe('specials', () => {
  it('có 5 hiệu ứng, trọng số dương, id duy nhất', () => {
    expect(SPECIALS.map((s) => s.id)).toEqual(['glow', 'sparkle', 'rainbow', 'gold', 'crystal']);
    expect(SPECIALS.every((s) => s.weight > 0)).toBe(true);
  });

  it('vẽ được overlay/underlay', () => {
    for (const s of SPECIALS) {
      const { unmount } = render(<svg>{s.Underlay && <s.Underlay />}<s.Overlay /></svg>);
      unmount();
    }
  });

  it('getSpecial: null và id lạ trả về null', () => {
    expect(getSpecial(null)).toBeNull();
    expect(getSpecial('khong-co')).toBeNull();
    expect(getSpecial('glow')?.name).toBe('Phát sáng');
  });
});

describe('xương rồng ngầu', () => {
  it('có chậu Bê tông làm chậu mặc định của xương rồng', () => {
    expect(getPot('concrete').name).toBe('Bê tông');
    expect(getSpecies('cactus').defaultPotId).toBe('concrete');
  });

  it('xương rồng đeo kính râm, không có má hồng; loài khác vẫn mặt dễ thương', () => {
    for (const mood of ['normal', 'smile', 'talk'] as const) {
      const { container, unmount } = render(<PlantScene plantId="cactus" potId="concrete" stage="bloom" specialId={null} mood={mood} />);
      expect(container.querySelector('[data-part="shades"]')).not.toBeNull();
      expect(container.querySelector('[data-part="blush"]')).toBeNull();
      expect(container.querySelector('[data-testid="face"]')!.getAttribute('data-style')).toBe('cool');
      unmount();
    }
    const { container } = render(<PlantScene plantId="sunflower" potId="terracotta" stage="bloom" specialId={null} mood="normal" />);
    expect(container.querySelector('[data-part="shades"]')).toBeNull();
    expect(container.querySelectorAll('[data-part="blush"]').length).toBe(2);
  });
});

describe('hoa hồng quý cô', () => {
  it('mặt có hàng mi cong và môi son, vẫn giữ má hồng; đội vương miện, cành thắt nơ', () => {
    for (const mood of ['normal', 'smile', 'talk'] as const) {
      const { container, unmount } = render(<PlantScene plantId="rose" potId="rose-porcelain" stage="bloom" specialId={null} mood={mood} />);
      expect(container.querySelector('[data-testid="face"]')!.getAttribute('data-style')).toBe('lady');
      expect(container.querySelector('[data-part="lashes"]')).not.toBeNull();
      expect(container.querySelectorAll('[data-part="blush"]').length).toBe(2);
      expect(container.querySelector('[data-part="tiara"]')).not.toBeNull();
      expect(container.querySelector('[data-part="bow"]')).not.toBeNull();
      unmount();
    }
    const { container } = render(<PlantScene plantId="sunflower" potId="terracotta" stage="bloom" specialId={null} mood="normal" />);
    expect(container.querySelector('[data-part="lashes"]')).toBeNull();
  });
});
