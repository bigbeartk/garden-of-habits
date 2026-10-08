import type { HabitColor } from '../domain/types';

/** Emoji cho thói quen: là nội dung người dùng chọn (như tên), không phải icon chức năng. */
export const HABIT_ICONS = [
  '💧', '🧘', '🏃', '🚶', '📚', '✍️', '🍎', '🥗', '🥛', '☕', '🛏️', '😴',
  '🧹', '🪥', '💊', '💰', '🎨', '🎵', '🌿', '🙏', '📵', '🧴', '🌞', '❤️',
];

/** Màu đậm hơn nền pastel một chút để ô "đã làm" nổi trên thẻ trắng. */
export const HABIT_COLORS: Record<HabitColor, string> = {
  peach: '#FFB3C1',
  mint: '#9FE0C8',
  butter: '#FFE08A',
  lavender: '#C9B8FF',
  sky: '#A9D6FF',
  rose: '#F48FB1',
  sage: '#B5D99C',
  cocoa: '#C9A88B',
};

export const HABIT_COLOR_IDS = Object.keys(HABIT_COLORS) as HabitColor[];
