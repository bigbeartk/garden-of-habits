import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/lang';

/** Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó. */
const NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English' };

/** Thẻ chọn ngôn ngữ trong Cài đặt; đổi là giao diện đổi ngay. */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="card settings__section">
      <h2 id="lang-title">{t.language.title}</h2>
      <div className="settings__row" role="radiogroup" aria-labelledby="lang-title">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            role="radio"
            aria-checked={lang === l}
            className={lang === l ? 'btn btn--primary' : 'btn'}
            onClick={() => setLang(l)}
          >
            {NAMES[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
