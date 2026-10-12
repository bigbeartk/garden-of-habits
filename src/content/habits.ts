import type { HabitColor } from '../domain/types';

/**
 * Icon thói quen. Giá trị lưu (Habit.icon, sao lưu) vẫn là emoji để dữ liệu cũ không đổi;
 * giao diện vẽ ảnh capybara tương ứng (public/habit-icons/<tên>.webp, 144px, tạo bằng Gemini theo prompt trong phiên 10/2026).
 */
const HABIT_ICON_FILES: [emoji: string, file: string][] = [
  ['💧', 'water'], ['🧘', 'meditate'], ['🏃', 'run'], ['🚶', 'walk'], ['📚', 'read'], ['✍️', 'write'],
  ['🍎', 'fruit'], ['🥗', 'salad'], ['🥛', 'milk'], ['☕', 'coffee'], ['🛏️', 'bed'], ['😴', 'sleep'],
  ['🧹', 'clean'], ['🪥', 'teeth'], ['💊', 'medicine'], ['💰', 'money'], ['🎨', 'paint'], ['🎵', 'music'],
  ['🌿', 'plant'], ['🙏', 'gratitude'], ['📵', 'no-phone'], ['🧴', 'skincare'], ['🌞', 'wake'], ['❤️', 'love'],
];

/** 24 emoji chọn được trong form, theo thứ tự hiện */
export const HABIT_ICONS = HABIT_ICON_FILES.map(([emoji]) => emoji);

const FILE_OF = new Map(HABIT_ICON_FILES);

/** Ảnh của một emoji; emoji lạ (bản cũ hơn / file sao lưu) → null, giao diện hiện chính emoji. */
export function habitIconSrc(icon: string): string | null {
  const file = FILE_OF.get(icon);
  return file ? `${import.meta.env.BASE_URL}habit-icons/${file}.webp` : null;
}

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
