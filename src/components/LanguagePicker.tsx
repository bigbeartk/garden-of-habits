import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/lang';

/** Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó. */
const NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English' };

/**
 * Thẻ chọn ngôn ngữ trong Cài đặt; đổi là giao diện đổi ngay.
 * Dùng `<select>` gốc: iPhone bật bánh xe chọn của iOS, Android bật danh sách của hệ thống.
 */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="card settings__section">
      <h2 id="lang-title">{t.language.title}</h2>
      <select
        className="input lang-select"
        aria-labelledby="lang-title"
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
      >
        {LANGS.map((l) => (
          <option key={l} value={l}>{NAMES[l]}</option>
        ))}
      </select>
    </div>
  );
}
