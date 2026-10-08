import { describe, expect, it } from 'vitest';
import { HABIT_COLORS, HABIT_COLOR_IDS, HABIT_ICONS } from '../../../src/content/habits';

describe('nội dung thói quen', () => {
  it('24 emoji không trùng, 8 màu hex', () => {
    expect(HABIT_ICONS).toHaveLength(24);
    expect(new Set(HABIT_ICONS).size).toBe(24);
    expect(HABIT_COLOR_IDS).toEqual(['peach', 'mint', 'butter', 'lavender', 'sky', 'rose', 'sage', 'cocoa']);
    for (const id of HABIT_COLOR_IDS) expect(HABIT_COLORS[id]).toMatch(/^#[0-9A-F]{6}$/);
  });
});
