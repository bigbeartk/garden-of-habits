import { render } from '@testing-library/react';
import { ArtView } from '../../../src/content/ArtView';
import { DEFAULT_POT_ID, POTS, getPot } from '../../../src/content/pots/registry';
import { SPECIALS, getSpecial } from '../../../src/content/specials/registry';

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
