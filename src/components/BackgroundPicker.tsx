import { useRef, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { getSetting, setSetting } from '../db/settings';
import type { CalendarTheme } from '../domain/types';
import { useCalendarTheme } from '../hooks/useCalendarBg';
import { compressImage } from '../utils/image';

const OPTIONS: { id: CalendarTheme; label: string }[] = [
  { id: 'default', label: 'Mặc định' },
  { id: 'cat', label: 'Mèo vươn vai' },
  { id: 'grass', label: 'Cỏ nở' },
  { id: 'rain', label: 'Mưa chill' },
  { id: 'gamer', label: 'Gaming neon' },
  { id: 'photo', label: 'Ảnh của bạn' },
];

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
    return (
      <svg viewBox="0 0 48 36" className="bg-swatch__art" aria-hidden="true">
        <rect x={20} y={6} width={22} height={15} rx={2} fill="#1E1B3A" stroke="#4DF3FF" strokeWidth={1.5} />
        <circle cx={14} cy={18} r={7} fill="#3A2E5C" />
        <path d="M7 17 a7 7 0 0 1 14 0" fill="none" stroke="#FF5FD2" strokeWidth={2.2} />
        <rect x={5.5} y={16} width={3} height={5} rx={1.4} fill="#FF5FD2" />
        <rect x={19.5} y={16} width={3} height={5} rx={1.4} fill="#FF5FD2" />
        <rect x={18} y={27} width={26} height={4} rx={1.5} fill="#4DF3FF" />
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
      await setSetting(deps.db, 'calendarBg', await compressImage(file));
      await setSetting(deps.db, 'calendarTheme', 'photo');
      setOpen(false);
    } catch {
      setError('Không đọc được ảnh này, thử ảnh khác nhé.');
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
      .catch((e: Error) => setError(e.message));
  }

  const current = OPTIONS.find((o) => o.id === theme) ?? OPTIONS[0];

  return (
    <div className="bg-picker">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} data-testid="bg-input" />
      <button
        type="button"
        className="bg-picker__toggle"
        aria-label={`Đổi hình nền lịch (đang dùng: ${current.label})`}
        onClick={() => setOpen(true)}
      >
        <span className={`bg-picker__mini bg-swatch--${current.id}`}><span className="bg-swatch__preview"><Swatch id={current.id} /></span></span>
      </button>
      <BottomSheet open={open} title="Hình nền lịch" onClose={() => setOpen(false)}>
        <div className="bg-picker__options" role="radiogroup" aria-label="Hình nền lịch">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={theme === o.id}
              className={`bg-swatch bg-swatch--${o.id}${theme === o.id ? ' is-selected' : ''}`}
              onClick={() => choose(o.id)}
              disabled={busy}
            >
              <span className="bg-swatch__preview"><Swatch id={o.id} /></span>
              <span className="bg-swatch__label">{o.label}</span>
            </button>
          ))}
        </div>
        {theme === 'photo' && (
          <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? 'Đang xử lý…' : 'Chọn ảnh khác'}
          </button>
        )}
        {busy && theme !== 'photo' && <p className="muted">Đang xử lý ảnh…</p>}
        {error && <p role="alert" className="error">{error}</p>}
      </BottomSheet>
    </div>
  );
}
