import { render } from '@testing-library/react';
import { Face, type FaceStyle, type Mood } from '../../../src/content/Face';

const NEW: FaceStyle[] = ['doll', 'sparkle', 'happy', 'cheeky'];
const MOODS: Mood[] = ['normal', 'smile', 'talk', 'sleep', 'sad'];

const draw = (style: FaceStyle, mood: Mood) => render(<svg><Face faceStyle={style} mood={mood} x={0} y={0} scale={1} /></svg>);

describe('kiểu mặt mới', () => {
  it.each(NEW)('%s vẽ đủ 5 nét mặt, có data-style, mắt và má hồng', (style) => {
    for (const mood of MOODS) {
      const { container, unmount } = draw(style, mood);
      const face = container.querySelector('[data-testid="face"]')!;
      expect(face.getAttribute('data-style')).toBe(style);
      expect(face.getAttribute('data-mood')).toBe(mood);
      expect(face.querySelector('[data-part="eyes"]'), `${style}/${mood}`).not.toBeNull();
      expect(face.querySelectorAll('[data-part="blush"]').length, `${style}/${mood}`).toBe(2);
      unmount();
    }
  });

  it('mọi kiểu đều có phần mắt (kể cả cute, cool, lady)', () => {
    for (const style of ['cute', 'cool', 'lady'] as FaceStyle[]) {
      const { container, unmount } = draw(style, 'normal');
      expect(container.querySelector('[data-part="eyes"]'), style).not.toBeNull();
      unmount();
    }
  });

  it('các kiểu khác nhau ở nét Thường', () => {
    const html = (s: FaceStyle) => {
      const { container, unmount } = draw(s, 'normal');
      const h = container.innerHTML.replace(/data-style="[^"]+"/, '');
      unmount();
      return h;
    };
    const all = (['cute', ...NEW] as FaceStyle[]).map(html);
    expect(new Set(all).size).toBe(all.length);
  });
});
