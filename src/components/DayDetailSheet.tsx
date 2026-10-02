import { BottomSheet } from './BottomSheet';
import { MiniPlant } from './MiniPlant';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import { longDateLabel, type CellStatus } from '../domain/calendar';
import { STAGE_LABEL } from '../domain/growth';
import { PERIODS, PERIOD_LABEL } from '../domain/period';
import { PeriodIcon } from './icons';
import type { DayRecord } from '../domain/types';

/** Chi tiết một ngày đã qua: chỉ để xem (việc theo buổi, ghi chú), không sửa được gì. */
export function DayDetailSheet({ dateKey, status, record, onClose }: {
  dateKey: string | null; status: CellStatus | null; record?: DayRecord; onClose: () => void;
}) {
  const open = dateKey !== null && status !== null;
  const special = record && !record.isRestDay ? getSpecial(record.specialId) : null;

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
          {record && !record.isRestDay && record.todos.length > 0 && (
            <div className="detail__periods">
              {PERIODS.map((p) => {
                const group = record.todos.filter((t) => t.period === p);
                return (
                  <section key={p} className={`detail__period todo__section--${p}`} data-testid={`detail-section-${p}`}>
                    <h4 className="detail__period-title">
                      <PeriodIcon period={p} /> {PERIOD_LABEL[p]}
                      {group.length > 0 && <span className="detail__period-count">{group.filter((t) => t.done).length}/{group.length}</span>}
                    </h4>
                    {group.length === 0 ? (
                      <p className="muted detail__period-empty">Chưa có việc</p>
                    ) : (
                      <ul className="detail__todos">
                        {group.map((t) => (
                          <li key={t.id} className={t.done ? 'is-done' : ''}>
                            <span className={`detail__check${t.done ? ' is-done' : ''}`} aria-label={t.done ? 'Đã xong' : 'Chưa xong'} role="img">{t.done && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5 l2.6 2.6 L12 5.6" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                            {t.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
          {record?.note && (
            <div className="detail__note-box">
              <h4 className="detail__label">Ghi chú</h4>
              <p className="detail__note" data-testid="detail-note">{record.note}</p>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
