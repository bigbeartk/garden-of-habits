import { BottomSheet } from './BottomSheet';
import { MiniPlant } from './MiniPlant';
import { getSpecies } from '../content/plants/registry';
import { getSpecial } from '../content/specials/registry';
import type { CellStatus } from '../domain/calendar';
import { PERIODS } from '../domain/period';
import { PeriodIcon } from './icons';
import type { DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { longDate } from '../i18n/fmt';

/** Chi tiết một ngày đã qua: chỉ để xem (việc theo buổi, ghi chú), không sửa được gì. */
export function DayDetailSheet({ dateKey, status, record, onClose }: {
  dateKey: string | null; status: CellStatus | null; record?: DayRecord; onClose: () => void;
}) {
  const { t, lang, tr } = useI18n();
  const open = dateKey !== null && status !== null;
  const special = record && !record.isRestDay ? getSpecial(record.specialId) : null;

  return (
    <BottomSheet open={open} title={dateKey ? longDate(lang, dateKey) : ''} onClose={onClose} tall>
      {open && (
        <div className="detail">
          {record?.title && <h3 className="detail__title">{record.title}</h3>}
          <div className="detail__scene"><MiniPlant status={status!} record={record} /></div>
          {status === 'plant' && record && (
            <p className="detail__line">{tr(getSpecies(record.plantId).name)} · {t.stage[record.finalStage]}</p>
          )}
          {special && <p className="detail__line">{t.detail.special(tr(special.name))}</p>}
          {status === 'rest' && <p className="detail__line">{t.detail.rest}</p>}
          {status === 'missed' && <p className="detail__line muted">{t.detail.missed}</p>}
          {record && !record.isRestDay && record.todos.length > 0 && (
            <div className="detail__periods">
              {PERIODS.map((p) => {
                const group = record.todos.filter((td) => td.period === p);
                return (
                  <section key={p} className={`detail__period todo__section--${p}`} data-testid={`detail-section-${p}`}>
                    <h4 className="detail__period-title">
                      <PeriodIcon period={p} /> {t.period[p]}
                      {group.length > 0 && <span className="detail__period-count">{group.filter((td) => td.done).length}/{group.length}</span>}
                    </h4>
                    {group.length === 0 ? (
                      <p className="muted detail__period-empty">{t.common.noTasks}</p>
                    ) : (
                      <ul className="detail__todos">
                        {group.map((td) => (
                          <li key={td.id} className={td.done ? 'is-done' : ''}>
                            <span className={`detail__check${td.done ? ' is-done' : ''}`} aria-label={td.done ? t.detail.done : t.detail.notDone} role="img">{td.done && <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 8.5 l2.6 2.6 L12 5.6" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                            {td.text}
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
              <h4 className="detail__label">{t.detail.note}</h4>
              <p className="detail__note" data-testid="detail-note">{record.note}</p>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
