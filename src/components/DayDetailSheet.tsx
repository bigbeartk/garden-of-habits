import { useEffect, useState } from 'react';
import { BottomSheet } from './BottomSheet';
import { MiniPlant } from './MiniPlant';
import { PlannedSection } from './PlannedSection';
import { useDeps } from '../app/deps';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import { longDateLabel, type CellStatus } from '../domain/calendar';
import { setNote } from '../domain/dayService';
import { STAGE_LABEL } from '../domain/growth';
import type { DayRecord } from '../domain/types';

export function DayDetailSheet({ dateKey, todayKey, status, record, onClose, onGoToday }: {
  dateKey: string | null; todayKey: string; status: CellStatus | null; record?: DayRecord; onClose: () => void; onGoToday: () => void;
}) {
  const deps = useDeps();
  const [note, setNoteText] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setNoteText(record?.note ?? '');
    setSaved(false);
    setError(null);
  }, [dateKey, record?.note]);

  const open = dateKey !== null && status !== null;
  const special = record && !record.isRestDay ? getSpecial(record.specialId) : null;

  async function saveNote() {
    if (!dateKey) return;
    try {
      await setNote(deps, dateKey, note);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <BottomSheet open={open} title={dateKey ? longDateLabel(dateKey) : ''} onClose={onClose}>
      {open && (
        <div className="detail">
          {record?.title && <h3 className="detail__title">{record.title}</h3>}
          <div className="detail__scene"><MiniPlant status={status!} record={record} /></div>
          {status === 'plant' && record && (
            <p className="detail__line">{getSpecies(record.plantId).name} · {STAGE_LABEL[record.finalStage]}</p>
          )}
          {special && <p className="detail__line">✨ Cây đặc biệt: {special.name}</p>}
          {status === 'rest' && <p className="detail__line">💤 Ngày tiết kiệm năng lượng</p>}
          {status === 'missed' && <p className="detail__line muted">Hôm đó cây chưa được chăm sóc 🥀</p>}
          {status === 'today-pending' && <p className="detail__line muted">Cây hôm nay đang chờ bạn đó!</p>}
          {status === 'future' && dateKey && <PlannedSection date={dateKey} />}
          {record && !record.isRestDay && record.todos.length > 0 && (
            <ul className="detail__todos">
              {record.todos.map((t) => (
                <li key={t.id} className={t.done ? 'is-done' : ''}>
                  <span aria-hidden="true">{t.done ? '✅' : '⬜'}</span> {t.text}
                </li>
              ))}
            </ul>
          )}
          {record && (
            <>
              <label className="detail__label" htmlFor="day-note">Ghi chú ngày này</label>
              <textarea id="day-note" className="textarea" value={note} onChange={(e) => { setNoteText(e.target.value); setSaved(false); }} />
              <div className="detail__row">
                {saved && <span className="muted">Đã lưu ✓</span>}
                <button type="button" className="btn btn--primary" onClick={saveNote}>Lưu ghi chú</button>
              </div>
            </>
          )}
          {error && <p role="alert" className="error">{error}</p>}
          {dateKey === todayKey && (
            <button type="button" className="btn" onClick={onGoToday}>Đi tới Hôm nay 🌱</button>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
