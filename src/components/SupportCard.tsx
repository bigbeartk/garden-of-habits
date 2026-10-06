import { useState } from 'react';
import { SUPPORT } from '../content/support';
import { shareOrDownload } from '../db/share';
import { isNative, openExternal } from '../platform';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Mục "Ủng hộ tôi" trong Cài đặt: mã QR chuyển khoản + nút lưu mã QR + nút PayPal.
 * Nút "Lưu mã QR" vì không thể dùng chính điện thoại quét mã trên màn hình của nó:
 * lưu ảnh vào máy rồi mở trong app ngân hàng.
 */
export function SupportCard() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);

  async function saveQr() {
    setError(null);
    try {
      const res = await fetch(SUPPORT.qrImage);
      const blob = await res.blob();
      await shareOrDownload(new File([blob], SUPPORT.qrFileName, { type: 'image/jpeg' }));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(t.support.saveFailed);
    }
  }

  // app Android: mở PayPal bằng trình duyệt của máy thay vì ngay trong WebView
  function onPaypal(e: React.MouseEvent) {
    if (!isNative()) return;
    e.preventDefault();
    void openExternal(SUPPORT.paypalUrl);
  }

  return (
    <section className="card settings__section support">
      <h2>{t.support.title}</h2>
      <p className="muted support__text">{t.support.text}</p>
      <img className="support__qr" src={SUPPORT.qrImage} alt={t.support.qrAlt} width={890} height={1135} loading="lazy" />
      <p className="muted support__hint">{t.support.hint}</p>
      {error && <p role="alert" className="error">{error}</p>}
      <div className="support__actions">
        <button type="button" className="btn" onClick={saveQr}>{t.support.saveQr}</button>
        <a className="btn btn--primary support__paypal" href={SUPPORT.paypalUrl} target="_blank" rel="noopener noreferrer" onClick={onPaypal}>
          {t.support.paypal}
        </a>
      </div>
    </section>
  );
}
