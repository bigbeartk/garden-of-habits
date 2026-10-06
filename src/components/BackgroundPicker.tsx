import { useRef, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting, setSetting } from '../db/settings';
import type { CalendarTheme } from '../domain/types';
import { useCalendarTheme } from '../hooks/useCalendarBg';
import { prepareBackground } from '../utils/image';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { AppError } from '../domain/errors';

/** Nhãn ở `t.background.options[id]`. */
const OPTIONS: CalendarTheme[] = ['default', 'cat', 'grass', 'rain', 'gamer', 'photo'];

/** Hình xem trước nhỏ cho từng kiểu nền */
function Swatch({ id }: { id: CalendarTheme }) {
  if (id === 'cat') {
    return (
      <svg viewBox="0 0 48 36" className="bg-swatch__art" aria-hidden="true">
        <path d="M12 26 C 14 16 26 12 36 14 C 44 16 44 26 38 28 C 30 30 20 30 12 26 Z" fill="#FFD8A8" stroke="#5B4636" strokeWidth={1.6} />
        <circle cx={14} cy={20} r={7} fill="#FFD8A8" stroke="#5B4636" strokeWidth={1.6} />
        <path d="M9 15 L 9 9 L 13 13 Z M17 13 L 20 9 L 20 15 Z" fill="#FFD8A8" stroke="#5B4636" strokeWidth={1.2} strokeLinejoin="round" />
        <path d="M11 20 q1.5 1.2 3 0 M15.5 20 q1.5 1.2 3 0" fill="none" stroke="#5B4636" strokeWidth={1.1} strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'grass') {
    return (
      <svg viewBox="0 0 48 36" className="bg-swatch__art" aria-hidden="true">
        {[4, 10, 16, 22, 28, 34, 40].map((x, i) => (
          <path key={x} d={`M${x - 2} 36 Q ${x} ${22 - (i % 3) * 4} ${x + 2} 36 Z`} fill="#6DBB5E" />
        ))}
        <circle cx={18} cy={20} r={3} fill="#FFE58A" stroke="#5B4636" strokeWidth={0.8} />
        <circle cx={33} cy={23} r={3} fill="#FFB8C8" stroke="#5B4636" strokeWidth={0.8} />
      </svg>
    );
  }
  if (id === 'rain') {
    return (
      <svg viewBox="0 0 48 36" className="bg-swatch__art" aria-hidden="true">
        {[8, 16, 24, 32, 40].map((x, i) => <path key={x} d={`M${x} ${4 + (i % 2) * 5} l-3 9`} stroke="#BFD7FF" strokeWidth={1.6} strokeLinecap="round" />)}
        <path d="M16 24 h14 v5 a4 4 0 0 1 -4 4 h-6 a4 4 0 0 1 -4 -4 Z" fill="#FFF1C1" stroke="#5B4636" strokeWidth={1.3} />
        <path d="M30 26 q4 0 3 3 q-1 2 -3 2" fill="none" stroke="#5B4636" strokeWidth={1.3} />
        <path d="M21 21 q-2 -3 0 -5 M25 21 q-2 -3 0 -5" fill="none" stroke="#FFFDFB" strokeWidth={1.2} strokeLinecap="round" />
      </svg>
    );
  }
  if (id === 'gamer') {
    const px: [number, number, number, number, string][] = [
      [14, 6, 20, 14, '#1A1033'], [16, 8, 16, 10, '#5DA9FF'], [16, 15, 16, 3, '#3FA34D'], [19, 12, 2, 3, '#E8473F'],
      [22, 20, 4, 3, '#1A1033'], [8, 24, 32, 2, '#6B4E9B'], [16, 22, 14, 2, '#FF5FD2'],
      [4, 12, 8, 12, '#FF5FD2'], [5, 10, 6, 6, '#5A3A8C'], [4, 9, 8, 1, '#4DF3FF'],
    ];
    return (
      <svg viewBox="0 0 48 30" className="bg-swatch__art" aria-hidden="true" shapeRendering="crispEdges">
        {px.map(([x, y, w, h, c], i) => <rect key={i} x={x} y={y} width={w} height={h} fill={c} />)}
      </svg>
    );
  }
  if (id === 'photo') {
    return (
      <svg viewBox="0 0 48 36" className="bg-swatch__art" aria-hidden="true">
        <rect x={10} y={7} width={28} height={22} rx={4} fill="#FFFDFB" stroke="#5B4636" strokeWidth={1.6} />
        <path d="M12 27 L 20 18 L 26 24 L 30 20 L 36 27 Z" fill="#9ED9A0" />
        <circle cx={31} cy={13} r={3} fill="#FFE58A" />
      </svg>
    );
  }
  return null;
}

/** Chọn hình nền màn Lịch: mặc định, 2 nền động, hoặc ảnh từ máy. */
export function BackgroundPicker() {
  const { t } = useI18n();
  const deps = useDeps();
  const theme = useCalendarTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const hasBg = useLiveQuery(async () => (await getSetting(deps.db, 'calendarBg')) !== undefined, [deps.db]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setSetting(deps.db, 'calendarBg', await prepareBackground(file));
      await setSetting(deps.db, 'calendarTheme', 'photo');
      setOpen(false);
    } catch (err) {
      // quá lớn: báo rõ giới hạn; lỗi khác (tệp hỏng, không đọc được): câu chung
      setError(err instanceof AppError ? errorText(err, t) : t.background.readFailed);
    } finally {
      setBusy(false);
    }
  }

  function choose(id: CalendarTheme) {
    setError(null);
    // chưa có ảnh thì "Ảnh của bạn" mở chọn ảnh; ảnh cũ luôn được giữ lại khi đổi sang kiểu khác
    if (id === 'photo' && !hasBg) {
      inputRef.current?.click();
      return;
    }
    setSetting(deps.db, 'calendarTheme', id)
      .then(() => setOpen(false))
      .catch((e: Error) => setError(errorText(e, t)));
  }

  const current = OPTIONS.includes(theme) ? theme : 'default';

  return (
    <div className="bg-picker">
      <input ref={inputRef} type="file" accept="image/*,video/*" hidden onChange={onFile} data-testid="bg-input" />
      <button
        type="button"
        className="bg-picker__toggle"
        aria-label={t.background.toggle(t.background.options[current])}
        onClick={() => setOpen(true)}
      >
        <span className={`bg-picker__mini bg-swatch--${current}`}><span className="bg-swatch__preview"><Swatch id={current} /></span></span>
      </button>
      <BottomSheet open={open} title={t.background.title} onClose={() => setOpen(false)}>
        <div className="bg-picker__options" role="radiogroup" aria-label={t.background.title}>
          {OPTIONS.map((o) => (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={theme === o}
              className={`bg-swatch bg-swatch--${o}${theme === o ? ' is-selected' : ''}`}
              onClick={() => choose(o)}
              disabled={busy}
            >
              <span className="bg-swatch__preview"><Swatch id={o} /></span>
              <span className="bg-swatch__label">{t.background.options[o]}</span>
            </button>
          ))}
        </div>
        {theme === 'photo' && (
          <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? t.common.processing : t.background.chooseOther}
          </button>
        )}
        {busy && theme !== 'photo' && <p className="muted">{t.background.processingImage}</p>}
        {error && <p role="alert" className="error">{error}</p>}
      </BottomSheet>
    </div>
  );
}
