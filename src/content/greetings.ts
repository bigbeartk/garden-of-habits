import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';

export const COMMON_GREETINGS = [
  'Xin chào! Hôm nay mình cùng lớn nhé 🌱',
  'Ơ bạn tới rồi! Mình chờ nãy giờ á 💕',
  'Làm xong việc là tưới cho mình đó nha 💧',
  'Hôm nay bạn trông tuyệt lắm đó ✨',
  'Từng việc nhỏ thôi, mình tin bạn! 🍀',
  'Mình vừa mơ thấy bạn làm xong hết việc đó 😆',
  'Uống nước chưa? Mình uống rồi nè 💦',
  'Cùng nhau nở hoa hôm nay nha 🌸',
  'Bạn là người làm vườn số một của mình! 🏆',
  'Chậm mà chắc, mình không vội đâu 🐢',
];

export function pickGreeting(species: PlantSpecies, rng: Rng): string {
  return pickUniform([...COMMON_GREETINGS, ...(species.greetings ?? [])], rng);
}
