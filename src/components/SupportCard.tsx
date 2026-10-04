import { useState } from 'react';
import { SUPPORT } from '../content/support';
import { shareOrDownload } from '../db/share';

/**
 * Mục "Ủng hộ tôi" trong Cài đặt: mã QR chuyển khoản + nút lưu mã QR + nút PayPal.
 * Nút "Lưu mã QR" vì không thể dùng chính điện thoại quét mã trên màn hình của nó:
 * lưu ảnh vào máy rồi mở trong app ngân hàng.
 */
export function SupportCard() {
  const [error, setError] = useState<string | null>(null);

  async function saveQr() {
    setError(null);
    try {
      const res = await fetch(SUPPORT.qrImage);
      const blob = await res.blob();
      await shareOrDownload(new File([blob], SUPPORT.qrFileName, { type: 'image/jpeg' }));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError('Không lưu được mã QR, thử chụp màn hình nhé.');
    }
  }

  return (
    <section className="card settings__section support">
      <h2>Ủng hộ tôi</h2>
      <p className="muted support__text">Nếu bạn thích khu vườn nhỏ này, có thể mời mình một ly cà phê nha ☕🌱</p>
      <img className="support__qr" src={SUPPORT.qrImage} alt={SUPPORT.qrAlt} width={890} height={1135} loading="lazy" />
      <p className="muted support__hint">Lưu mã QR rồi mở trong app ngân hàng để quét.</p>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="support__actions">
        <button type="button" className="btn" onClick={saveQr}>Lưu mã QR</button>
        <a className="btn btn--primary support__paypal" href={SUPPORT.paypalUrl} target="_blank" rel="noopener noreferrer">
          Ủng hộ qua PayPal
        </a>
      </div>
    </section>
  );
}
