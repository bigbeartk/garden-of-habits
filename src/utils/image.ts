import type { CalendarBg } from '../domain/types';

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Ảnh động / video làm nền được lưu nguyên tệp nên giới hạn dung lượng (cả trong máy lẫn file sao lưu). */
export const MAX_ANIMATED_BG_BYTES = 25 * 1024 * 1024;

const EXT_MIME: Record<string, string> = { gif: 'image/gif', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

/**
 * Đoán loại theo vài byte đầu: điện thoại hay ghi sai `file.type` hoặc đặt tên không có đuôi
 * (Android: "1000012345"), nên GIF bị coi là ảnh tĩnh, nén qua canvas và mất chuyển động.
 */
function sniffMime(head: Uint8Array): string {
  const ascii = (from: number, to: number) => String.fromCharCode(...head.subarray(from, to));
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(4, 8) === 'ftyp') return ascii(8, 10) === 'qt' ? 'video/quicktime' : 'video/mp4';
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'video/webm';
  return '';
}

/** Loại tệp: theo nội dung trước, rồi `file.type`, cuối cùng đoán theo đuôi. */
async function mimeOf(file: File): Promise<string> {
  const sniffed = sniffMime(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  // video đã ghi đúng loại (mp4 / mov) thì giữ loại đó; byte đầu chỉ để biết đây là video
  if (isVideoMime(sniffed) && isVideoMime(file.type)) return file.type;
  if (sniffed) return sniffed;
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MIME[ext] ?? '';
}

export const isVideoMime = (mime: string) => mime.startsWith('video/');

/**
 * Chuẩn bị ảnh nền Lịch từ tệp người dùng chọn:
 * - GIF / video: giữ nguyên tệp để còn chuyển động (nén qua canvas sẽ mất), tối đa 25 MB;
 * - ảnh tĩnh: thu nhỏ + nén JPEG.
 */
export async function prepareBackground(file: File): Promise<CalendarBg> {
  const mime = await mimeOf(file);
  if (mime === 'image/gif' || isVideoMime(mime)) {
    if (file.size > MAX_ANIMATED_BG_BYTES) {
      throw new Error(`${isVideoMime(mime) ? 'Video' : 'Ảnh động'} quá lớn, tối đa 25 MB. Thử cắt ngắn hoặc chọn tệp khác nhé.`);
    }
    return { mime, data: await file.arrayBuffer() };
  }
  return compressImage(file);
}

/** Thu nhỏ ảnh còn tối đa `max` px rồi nén JPEG để lưu nhẹ trong IndexedDB. */
export async function compressImage(file: Blob, max = 1600): Promise<CalendarBg> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không xử lý được ảnh');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Không nén được ảnh'))), 'image/jpeg', 0.85),
  );
  return { mime: 'image/jpeg', data: await blob.arrayBuffer() };
}
