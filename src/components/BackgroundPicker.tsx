import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { deleteSetting, getSetting, setSetting } from '../db/settings';
import { compressImage } from '../utils/image';

export function BackgroundPicker() {
  const deps = useDeps();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasBg = useLiveQuery(async () => (await getSetting(deps.db, 'calendarBg')) !== undefined, [deps.db]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await setSetting(deps.db, 'calendarBg', await compressImage(file));
    } catch {
      setError('Không đọc được ảnh này, thử ảnh khác nhé.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-picker">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} data-testid="bg-input" />
      <button type="button" className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? 'Đang xử lý…' : '🖼️ Đổi ảnh nền lịch'}
      </button>
      {hasBg && (
        <button type="button" className="btn btn--ghost" onClick={() => deleteSetting(deps.db, 'calendarBg')}>Dùng nền mặc định</button>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
