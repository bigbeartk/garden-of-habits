/** Thông tin mục "Ủng hộ tôi" trong Cài đặt. Đổi mã QR: thay ảnh trong `public/support/`. */
export const SUPPORT = {
  /** ảnh mã VietQR chuyển khoản (TPBank), đã cắt gọn từ ảnh gốc */
  qrImage: `${import.meta.env.BASE_URL}support/qr-tpbank.jpg`,
  /** tên tệp khi lưu mã QR về máy */
  qrFileName: 'ma-qr-ung-ho.jpg',
  paypalUrl: 'https://paypal.me/dattruong92',
} as const;
