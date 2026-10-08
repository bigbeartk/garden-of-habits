import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { dataSummary, resetAllData } from '../db/reset';
import { ensureToday } from '../domain/dayService';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { BottomSheet } from './BottomSheet';

/**
 * Bảng xác nhận xoá toàn bộ dữ liệu: liệt kê những gì sẽ mất, mời sao lưu trước, và chỉ cho xoá khi đã gõ đúng
 * chữ xác nhận (`XOA` / `DELETE`, không phân biệt hoa thường). Xoá xong tạo lại ngày hôm nay rồi gọi `onDone`.
 */
export function ResetDataSheet({ open, onClose, onBackup, onDone }: {
  open: boolean;
  onClose: () => void;
  onBackup: () => void;
  onDone: () => void;
}) {
  const deps = useDeps();
  const { t } = useI18n();
  const r = t.settings.reset;
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = useLiveQuery(() => (open ? dataSummary(deps.db) : undefined), [deps.db, open]);

  // mỗi lần mở lại bảng đều phải gõ lại từ đầu
  useEffect(() => {
    if (!open) {
      setTyped('');
      setError(null);
    }
  }, [open]);

  const ok = typed.trim().toUpperCase() === r.word;

  async function doReset() {
    setBusy(true);
    setError(null);
    try {
      await resetAllData(deps.db);
      await ensureToday(deps);
      onDone();
    } catch (e) {
      setError(errorText(e, t));
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} title={r.title} onClose={onClose}>
      <div className="reset">
        <p className="reset__lose">{r.lose}</p>
        {summary && <p className="reset__summary">{r.summary(summary.days, summary.templates, summary.reminders, summary.planned, summary.habits)}</p>}
        <p className="muted">{r.extra}</p>
        <p className="reset__warn">{r.backupFirst}</p>
        <button type="button" className="btn btn--primary" onClick={onBackup}>{t.settings.backupNow}</button>
        <label className="reset__label" htmlFor="reset-confirm">{r.inputLabel}</label>
        <input
          id="reset-confirm"
          className="input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
        {error && <p role="alert" className="error">{error}</p>}
        <button type="button" className="btn btn--danger" disabled={!ok || busy} onClick={doReset}>{r.confirm}</button>
      </div>
    </BottomSheet>
  );
}
