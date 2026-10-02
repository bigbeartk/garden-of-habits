import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';

export const COMMON_PRAISES = [
  'Giỏi quá trời! 💪',
  'Xong thêm một việc rồi, tuyệt vời! ✨',
  'Mát quá, cảm ơn bạn đã tưới mình 💧',
  'Bạn làm tốt lắm luôn đó! 🌟',
  'Từng bước nhỏ thôi mà đáng nể ghê 🐾',
  'Mình thấy mình lớn thêm xíu rồi nè 🌱',
  'Hoan hô! Tiếp tục nha 🎉',
  'Bạn đỉnh thật sự! 😆',
];

export const BLOOM_PRAISES = [
  'Xong hết rồi! Mình nở hoa vì bạn đó 🌸',
  'Trọn vẹn một ngày! Bạn tuyệt nhất 🏆',
  'Hết việc rồi, nghỉ ngơi thôi nào 💖',
];

/** bloomed = vừa xong việc cuối cùng của ngày (cây ra hoa). */
export function pickPraise(species: PlantSpecies, rng: Rng, bloomed: boolean): string {
  if (bloomed) return pickUniform(BLOOM_PRAISES, rng);
  return pickUniform([...COMMON_PRAISES, ...(species.praises ?? [])], rng);
}
