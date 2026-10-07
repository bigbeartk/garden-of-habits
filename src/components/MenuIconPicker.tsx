import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { MenuIcon } from './icons';
import { useDeps } from '../app/deps';
import { setSetting } from '../db/settings';
import { MENU_ICON_CHOICES, resolveMenuIcon } from '../domain/menuIcon';
import type { MenuIconChoice } from '../domain/types';
import { useCalendarTheme, useMenuIconChoice } from '../hooks/useCalendarBg';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';

/** Chọn icon cho nút menu nổi: theo hình nền lịch (mặc định) hoặc một icon cố định. */
export function MenuIconPicker() {
  const { t } = useI18n();
  const deps = useDeps();
  const choice = useMenuIconChoice();
  const theme = useCalendarTheme();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(id: MenuIconChoice) {
    setError(null);
    setSetting(deps.db, 'menuIcon', id)
      .then(() => setOpen(false))
      .catch((e: Error) => setError(errorText(e, t)));
  }

  return (
    <div className="icon-picker">
      <button
        type="button"
        className="icon-picker__toggle"
        aria-label={t.menuIcon.toggle(t.menuIcon.options[choice])}
        onClick={() => setOpen(true)}
      >
        <MenuIcon size={30} kind={resolveMenuIcon(choice, theme)} />
      </button>
      <BottomSheet open={open} title={t.menuIcon.title} onClose={() => setOpen(false)}>
        <div className="icon-picker__options" role="radiogroup" aria-label={t.menuIcon.title}>
          {MENU_ICON_CHOICES.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={choice === o}
              className={`icon-picker__option${choice === o ? ' is-selected' : ''}${o === 'auto' ? ' is-auto' : ''}`}
              onClick={() => choose(o)}
            >
              <span className="icon-picker__disc"><MenuIcon size={30} kind={resolveMenuIcon(o, theme)} /></span>
              <span className="icon-picker__label">{t.menuIcon.options[o]}</span>
            </button>
          ))}
        </div>
        {error && <p role="alert" className="error">{error}</p>}
      </BottomSheet>
    </div>
  );
}
