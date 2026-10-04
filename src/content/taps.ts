import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';

/** Câu cây nói khi bị chạm (gộp với `species.taps`). */
export const COMMON_TAPS = [
  'Hihi nhột quá! 😆',
  'Bạn gọi mình hả? 🌼',
  'Ôm một cái nào 🤗',
  'Mình đây, mình đây! 🙋',
  'Hôm nay bạn dễ thương ghê 💕',
  'Chạm nhẹ thôi nha, mình mắc cỡ 🙈',
  'Có mình ở đây cổ vũ bạn nè 📣',
  'Uống miếng nước rồi làm tiếp nha 💧',
  'Mình thích bạn ghé thăm lắm 🥰',
  'Cố lên! Mình tin bạn mà 💪',
];

/** Ngày tiết kiệm năng lượng: cây đang ngủ. */
export const SLEEPY_TAPS = [
  'Zzz… cho mình ngủ thêm xíu 😴',
  'Ưm… hôm nay mình nghỉ mà 💤',
  'Suỵt… mình đang mơ đẹp 🌙',
];

/** Chọn câu khi chạm cây, không lặp lại câu vừa nói (`last`). */
export function pickTap(species: PlantSpecies, rng: Rng, { last, sleeping }: { last: string | null; sleeping: boolean }): string {
  const pool = sleeping ? SLEEPY_TAPS : [...COMMON_TAPS, ...(species.taps ?? [])];
  const fresh = pool.filter((t) => t !== last);
  return pickUniform(fresh.length > 0 ? fresh : pool, rng);
}
