import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HABIT_COLORS, HABIT_COLOR_IDS, HABIT_ICONS, habitIconSrc } from '../../../src/content/habits';

describe('nội dung thói quen', () => {
  it('24 emoji không trùng, 8 màu hex', () => {
    expect(HABIT_ICONS).toHaveLength(24);
    expect(new Set(HABIT_ICONS).size).toBe(24);
    expect(HABIT_COLOR_IDS).toEqual(['peach', 'mint', 'butter', 'lavender', 'sky', 'rose', 'sage', 'cocoa']);
    for (const id of HABIT_COLOR_IDS) expect(HABIT_COLORS[id]).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('mỗi emoji có ảnh capybara riêng trong public/habit-icons', () => {
    const srcs = HABIT_ICONS.map(habitIconSrc);
    expect(new Set(srcs).size).toBe(24);
    for (const src of srcs) {
      expect(src).toMatch(/habit-icons\/[a-z-]+\.webp$/);
      expect(existsSync(`public/${src!.replace(/^.*?habit-icons/, 'habit-icons')}`)).toBe(true);
    }
    expect(habitIconSrc('💧')).toMatch(/habit-icons\/water\.webp$/);
  });

  it('emoji lạ (từ bản cũ hơn / sao lưu) không có ảnh', () => {
    expect(habitIconSrc('🦄')).toBeNull();
  });
});
