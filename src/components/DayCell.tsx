import { MiniPlant } from './MiniPlant';
import type { CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';
import { useI18n } from '../i18n/I18nProvider';
import { longDate } from '../i18n/fmt';

export function DayCell({ dateKey, day, status, record, plannedCount = 0, isToday, showNoteDot = true, bugId, onSelect }: {
  dateKey: string; day: number; status: CellStatus; record?: DayRecord; plannedCount?: number; isToday: boolean; showNoteDot?: boolean; bugId?: string | null; onSelect: () => void;
}) {
  const { t, lang } = useI18n();
  // ngày tương lai bấm được để lên lịch việc
  const disabled = status === 'before-start';
  const parts = [longDate(lang, dateKey), t.dayCell.status[status], plannedCount > 0 ? t.dayCell.planned(plannedCount) : ''];
  return (
    <button
      type="button"
      className={`cal__cell cal__cell--${status}${isToday ? ' is-today' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      data-testid={`day-${dateKey}`}
      data-status={status}
      aria-label={parts.filter(Boolean).join(', ')}
    >
      <span className="cal__num">{day}</span>
      <span className="cal__art"><MiniPlant status={status} record={record} bugId={bugId} /></span>
      {record?.specialId && !record.isRestDay && <span className="cal__spark" aria-hidden="true">✨</span>}
      {showNoteDot && record?.note && <span className="cal__note-dot" data-testid="note-dot" aria-hidden="true" />}
      {plannedCount > 0 && <span className="cal__planned" data-testid="planned-count" aria-hidden="true">{plannedCount}</span>}
    </button>
  );
}
