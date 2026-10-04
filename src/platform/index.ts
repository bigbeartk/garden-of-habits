/**
 * Chỗ DUY NHẤT trong src/ được hỏi "đang chạy app Android (Capacitor) hay PWA?".
 * Mọi tính năng viết chung cho cả hai; cái gì khác nhau giữa trình duyệt và app native thì
 * bọc thành một hàm ở đây. Plugin native được import động để bản PWA không phải tải chúng.
 */
import { Capacitor } from '@capacitor/core';
import { bytesToBase64 } from '../db/backup';

export const isNative = (): boolean => Capacitor.isNativePlatform();

/**
 * Đưa file cho người dùng cất đi.
 * - Android: ghi vào bộ nhớ đệm của app rồi mở menu Chia sẻ (Drive, Tệp, Zalo…).
 * - Web: menu Chia sẻ của iOS; Safari chặn (NotAllowedError) hoặc không hỗ trợ thì tải xuống.
 * Người dùng tự huỷ thì ném AbortError để nơi gọi không ghi nhận là đã lưu.
 */
export async function shareFile(file: File): Promise<void> {
  if (isNative()) return shareNative(file);
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: file.name });
      return;
    } catch (e) {
      if ((e as Error).name !== 'NotAllowedError') throw e;
    }
  }
  download(file);
}

async function shareNative(file: File) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const data = bytesToBase64(await file.arrayBuffer());
  const { uri } = await Filesystem.writeFile({ path: file.name, data, directory: Directory.Cache });
  try {
    await Share.share({ title: file.name, files: [uri] });
  } catch (e) {
    if (/cancel/i.test((e as Error).message)) throw new DOMException('Đã huỷ chia sẻ', 'AbortError');
    throw e;
  }
}

function download(file: File) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Mở link ngoài app (PayPal…). Android: trình duyệt của máy, không mở bên trong WebView. */
export async function openExternal(url: string): Promise<void> {
  if (isNative()) {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

/** Gọi `cb` mỗi khi app quay lại màn hình (để kịp sang ngày mới lúc 4:00). Trả về hàm huỷ. */
export function onAppResume(cb: () => void): () => void {
  document.addEventListener('visibilitychange', cb);
  window.addEventListener('focus', cb);
  const offNative = isNative() ? nativeListener('resume', cb) : () => {};
  return () => {
    document.removeEventListener('visibilitychange', cb);
    window.removeEventListener('focus', cb);
    offNative();
  };
}

/** Nút Back cứng của Android (web không có). Trả về hàm huỷ. */
export function onHardwareBack(cb: () => void): () => void {
  return isNative() ? nativeListener('backButton', cb) : () => {};
}

export function exitApp(): void {
  if (isNative()) void import('@capacitor/app').then(({ App }) => App.exitApp());
}

function nativeListener(event: 'resume' | 'backButton', cb: () => void): () => void {
  let removed = false;
  let remove: (() => Promise<void>) | null = null;
  void import('@capacitor/app').then(async ({ App }) => {
    const handle = await App.addListener(event as 'resume', cb);
    if (removed) void handle.remove();
    else remove = () => handle.remove();
  });
  return () => {
    removed = true;
    void remove?.();
  };
}

/** Khung app native: ẩn màn chờ khi React đã vẽ (thanh hệ thống cấu hình ở capacitor.config.ts). */
export async function setupNativeShell(): Promise<void> {
  if (!isNative()) return;
  const { SplashScreen } = await import('@capacitor/splash-screen');
  requestAnimationFrame(() => void SplashScreen.hide());
}
