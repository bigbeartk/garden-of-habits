import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PeriodPicker } from './PeriodPicker';
import { useDeps } from '../app/deps';
import { PERIOD_ICON, PERIOD_LABEL, type Period } from '../domain/period';
import { addPlanned, deletePlanned, listPlanned } from '../domain/plannedService';

/** Lên lịch việc cho một ngày tương lai: xem, thêm theo buổi, xoá. */
export function PlannedSection({ date }: { date: string }) {
  const deps = useDeps();
  const items = useLiveQuery(() => listPlanned(deps.db, date), [deps.db, date]) ?? [];
  const [period, setPeriod] = useState<Period>('morning');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="planned">
      <h3 className="planned__title">Việc đã lên lịch</h3>
      {items.length === 0 ? (
        <p className="muted planned__empty">Chưa có việc nào được lên lịch.</p>
      ) : (
        <ul className="planned__list">
          {items.map((p) => (
            <li key={p.id} className="planned__item">
              <span className="planned__period" title={PERIOD_LABEL[p.period]} aria-hidden="true">{PERIOD_ICON[p.period]}</span>
              <span className="planned__text">{p.text}</span>
              <button type="button" className="todo__delete" aria-label={`Xoá: ${p.text}`} onClick={() => deletePlanned(deps.db, p.id).catch((e: Error) => setError(e.message))}>×</button>
            </li>
          ))}
        </ul>
      )}
      <PeriodPicker value={period} onChange={setPeriod} />
      <form
        className="todo__add"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          try {
            await addPlanned(deps, date, draft, period);
            setDraft('');
            setError(null);
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Việc cần làm…"
          aria-label="Việc cho ngày này"
          maxLength={200}
        />
        <button type="submit" className="btn btn--primary">Lên lịch</button>
      </form>
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
}
