import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';
import type { Lang, Localized } from '../i18n/lang';

/** Câu cây nói khi bị chạm (gộp với `species.taps`). */
export const COMMON_TAPS: Localized<string[]> = {
  vi: [
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
  ],
  en: [
    'Hehe, that tickles! 😆',
    'Did you call me? 🌼',
    'Come here, hug time 🤗',
    'I\'m here, I\'m here! 🙋',
    'You\'re extra cute today 💕',
    'Gently, please — I\'m shy 🙈',
    'I\'m right here cheering you on 📣',
    'Sip some water, then keep going 💧',
    'I love it when you visit 🥰',
    'You got this! I believe in you 💪',
  ],
};

/** Ngày tiết kiệm năng lượng: cây đang ngủ. */
export const SLEEPY_TAPS: Localized<string[]> = {
  vi: [
    'Zzz… cho mình ngủ thêm xíu 😴',
    'Ưm… hôm nay mình nghỉ mà 💤',
    'Suỵt… mình đang mơ đẹp 🌙',
  ],
  en: [
    'Zzz… just five more minutes 😴',
    'Mmm… it\'s my day off 💤',
    'Shh… I\'m having a sweet dream 🌙',
  ],
};

/** Chọn câu khi chạm cây, không lặp lại câu vừa nói (`last`). */
export function pickTap(species: PlantSpecies, rng: Rng, { last, sleeping, lang }: { last: string | null; sleeping: boolean; lang: Lang }): string {
  const pool = sleeping ? SLEEPY_TAPS[lang] : [...COMMON_TAPS[lang], ...(species.taps?.[lang] ?? [])];
  const fresh = pool.filter((t) => t !== last);
  return pickUniform(fresh.length > 0 ? fresh : pool, rng);
}
