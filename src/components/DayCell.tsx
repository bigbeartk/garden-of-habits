import { MiniPlant } from './MiniPlant';
import { longDateLabel, type CellStatus } from '../domain/calendar';
import type { DayRecord } from '../domain/types';

const STATUS_LABEL: Record<CellStatus, string> = {
  plant: '',
  rest: 'ngày tiết kiệm năng lượng',
  missed: 'cây héo',
  'today-pending': 'hôm nay',
  future: 'chưa tới',
  'before-start': '',
};

export function DayCell({ dateKey, day, status, record, plannedCount = 0, isToday, showNoteDot = true, onSelect }: {
  dateKey: string; day: number; status: CellStatus; record?: DayRecord; plannedCount?: number; isToday: boolean; showNoteDot?: boolean; onSelect: () => void;
}) {
  // ngày tương lai bấm được để lên lịch việc
  const disabled = status === 'before-start';
  const parts = [longDateLabel(dateKey), STATUS_LABEL[status], plannedCount > 0 ? `${plannedCount} việc đã lên lịch` : ''];
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
      <span className="cal__art"><MiniPlant status={status} record={record} /></span>
      {record?.specialId && !record.isRestDay && <span className="cal__spark" aria-hidden="true">✨</span>}
      {showNoteDot && record?.note && <span className="cal__note-dot" data-testid="note-dot" aria-hidden="true" />}
      {plannedCount > 0 && <span className="cal__planned" data-testid="planned-count" aria-hidden="true">{plannedCount}</span>}
    </button>
  );
}
