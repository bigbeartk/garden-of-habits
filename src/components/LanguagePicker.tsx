import { useEffect, useRef, useState } from 'react';
import { useBackHandler } from '../app/back';
import { useI18n } from '../i18n/I18nProvider';
import { LANGS, type Lang } from '../i18n/lang';

/** Tên ngôn ngữ luôn viết bằng chính ngôn ngữ đó. */
const NAMES: Record<Lang, string> = { vi: 'Tiếng Việt', en: 'English' };

/**
 * Thẻ chọn ngôn ngữ trong Cài đặt: dropdown tự vẽ (không dùng `<select>` gốc vì phần thả xuống do hệ điều hành
 * vẽ, không theo phong cách sticker). Chọn là giao diện đổi ngay. Chạm ra ngoài, Escape hoặc Back Android thì đóng.
 */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  /** dòng đang được bàn phím trỏ tới */
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useBackHandler(open, () => setOpen(false), 'sheet');

  useEffect(() => {
    if (!open) return;
    setActive(LANGS.indexOf(lang));
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
    // chỉ chạy lúc mở/đóng; ngôn ngữ đổi thì danh sách đã đóng
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function choose(l: Lang) {
    if (l !== lang) setLang(l);
    close();
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + LANGS.length) % LANGS.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(LANGS[active]);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className="card settings__section">
      <h2 id="lang-title">{t.language.title}</h2>
      <div className="lang-dd" ref={rootRef}>
        <button
          ref={buttonRef}
          id="lang-value"
          type="button"
          className={`lang-dd__toggle${open ? ' is-open' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby="lang-title lang-value"
          onClick={() => setOpen((o) => !o)}
        >
          {NAMES[lang]}
          <span className="lang-dd__arrow" aria-hidden="true" />
        </button>
        {open && (
          <ul
            ref={listRef}
            className="lang-dd__list"
            role="listbox"
            tabIndex={-1}
            aria-labelledby="lang-title"
            aria-activedescendant={`lang-opt-${LANGS[active]}`}
            onKeyDown={onListKey}
          >
            {LANGS.map((l, i) => (
              <li
                key={l}
                id={`lang-opt-${l}`}
                role="option"
                aria-selected={l === lang}
                className={`lang-dd__option${l === lang ? ' is-selected' : ''}${i === active ? ' is-active' : ''}`}
                onClick={() => choose(l)}
                onPointerEnter={() => setActive(i)}
              >
                {NAMES[l]}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
