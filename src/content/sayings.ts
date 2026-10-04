import { pickUniform, type Rng } from '../domain/random';
import type { PlantSpecies } from './types';

/** Câu cây nói cả ngày: mỗi ngày chọn ngẫu nhiên một câu (câu chung + `species.sayings`). */
export const COMMON_SAYINGS = [
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
  'Hít một hơi thật sâu rồi mình bắt đầu nha 🌬️',
  'Không cần hoàn hảo, chỉ cần tiến lên một chút thôi 💪',
  'Hôm nay nhớ cười nhiều lên nha 😊',
  'Mệt thì nghỉ một xíu, mình vẫn ở đây mà 🌿',
  'Mỗi việc bạn làm là một giọt nước cho mình 💧',
  'Bạn giỏi hơn bạn nghĩ nhiều lắm đó!',
  'Hôm nay là một trang mới tinh, viết gì cũng đẹp 📖',
  'Ăn sáng đầy đủ chưa đó? 🍳',
  'Nhớ đứng dậy vươn vai một cái nha 🙆',
  'Làm từ từ thôi, mình lớn từ từ cũng được 🌱',
  'Có bạn chăm, mình thấy vui lắm 💚',
  'Việc khó nhất làm trước, việc vui để sau nha 😉',
  'Mình gửi bạn một cái ôm lá xanh 🤗',
  'Trời hôm nay đẹp như bạn vậy ☀️',
  'Xong việc nào là mình vươn cao thêm chút xíu 📏',
  'Đừng quên uống nước và nghỉ mắt nha 👀',
  'Bạn làm được mà, mình cổ vũ nè 📣',
  'Một ngày nhẹ nhàng và thật nhiều điều xinh đẹp nha 🌷',
  'Mình chưa ra hoa, nhưng mình đang cố nè 🌼',
  'Cảm ơn bạn đã chăm mình mỗi ngày 💌',
];

export function pickSaying(species: PlantSpecies, rng: Rng): string {
  return pickUniform([...COMMON_SAYINGS, ...(species.sayings ?? [])], rng);
}
