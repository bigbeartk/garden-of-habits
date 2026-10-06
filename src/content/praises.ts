import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';
import type { Lang, Localized } from '../i18n/lang';

export const COMMON_PRAISES: Localized<string[]> = {
  vi: [
    'Giỏi quá trời! 💪',
    'Xong thêm một việc rồi, tuyệt vời! ✨',
    'Mát quá, cảm ơn bạn đã tưới mình 💧',
    'Bạn làm tốt lắm luôn đó! 🌟',
    'Từng bước nhỏ thôi mà đáng nể ghê 🐾',
    'Mình thấy mình lớn thêm xíu rồi nè 🌱',
    'Hoan hô! Tiếp tục nha 🎉',
    'Bạn đỉnh thật sự! 😆',
  ],
  en: [
    'So good! 💪',
    'One more task done — awesome! ✨',
    'Ahh, refreshing! Thanks for watering me 💧',
    'You did great! 🌟',
    'Small steps, but seriously impressive 🐾',
    'I feel a little taller already 🌱',
    'Hooray! Keep going 🎉',
    'You\'re truly the best! 😆',
  ],
};

export const BLOOM_PRAISES: Localized<string[]> = {
  vi: [
    'Xong hết rồi! Mình nở hoa vì bạn đó 🌸',
    'Trọn vẹn một ngày! Bạn tuyệt nhất 🏆',
    'Hết việc rồi, nghỉ ngơi thôi nào 💖',
  ],
  en: [
    'All done! I bloomed just for you 🌸',
    'A perfect day! You are the best 🏆',
    'Nothing left to do — time to rest 💖',
  ],
};

/** bloomed = vừa xong việc cuối cùng của ngày (cây ra hoa). */
export function pickPraise(species: PlantSpecies, rng: Rng, bloomed: boolean, lang: Lang): string {
  if (bloomed) return pickUniform(BLOOM_PRAISES[lang], rng);
  return pickUniform([...COMMON_PRAISES[lang], ...(species.praises?.[lang] ?? [])], rng);
}
