/**
 * Mở menu Chia sẻ của iOS (lưu vào Tệp/iCloud); nếu không hỗ trợ, hoặc Safari chặn vì
 * thao tác chạm đã "hết hạn" (NotAllowedError), thì tải file xuống.
 * Người dùng tự huỷ (AbortError) thì ném lỗi lại để không ghi nhận là đã sao lưu.
 */
export async function shareOrDownload(file: File): Promise<void> {
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
