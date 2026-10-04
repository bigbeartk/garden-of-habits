import type { CalendarBg } from '../domain/types';

export function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Ảnh động / video làm nền được lưu nguyên tệp nên giới hạn dung lượng (cả trong máy lẫn file sao lưu). */
export const MAX_ANIMATED_BG_BYTES = 25 * 1024 * 1024;

const EXT_MIME: Record<string, string> = { gif: 'image/gif', mp4: 'video/mp4', m4v: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };

/** Loại tệp: lấy từ `file.type`, nếu trống thì đoán theo đuôi. */
function mimeOf(file: File): string {
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
  const mime = mimeOf(file);
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
