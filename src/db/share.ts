import { shareFile } from '../platform';

/**
 * Lưu file ra ngoài app: menu Chia sẻ (iOS / Android), hoặc tải xuống khi không chia sẻ được.
 * Người dùng tự huỷ (AbortError) thì ném lỗi lại để không ghi nhận là đã sao lưu.
 */
export const shareOrDownload = (file: File): Promise<void> => shareFile(file);
