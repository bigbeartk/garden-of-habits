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

export function DayCell({ dateKey, day, status, record, isToday, onSelect }: {
  dateKey: string; day: number; status: CellStatus; record?: DayRecord; isToday: boolean; onSelect: () => void;
}) {
  const disabled = status === 'future' || status === 'before-start';
  const extra = STATUS_LABEL[status];
  return (
    <button
      type="button"
      className={`cal__cell cal__cell--${status}${isToday ? ' is-today' : ''}`}
      onClick={onSelect}
      disabled={disabled}
      data-testid={`day-${dateKey}`}
      data-status={status}
      aria-label={extra ? `${longDateLabel(dateKey)}, ${extra}` : longDateLabel(dateKey)}
    >
      <span className="cal__num">{day}</span>
      <span className="cal__art"><MiniPlant status={status} record={record} /></span>
      {record?.specialId && !record.isRestDay && <span className="cal__spark" aria-hidden="true">✨</span>}
      {record?.note && <span className="cal__note-dot" aria-hidden="true" />}
    </button>
  );
}
