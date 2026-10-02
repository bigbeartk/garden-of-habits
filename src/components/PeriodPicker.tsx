import { PERIODS, PERIOD_LABEL, type Period } from '../domain/period';
import { PeriodIcon } from './icons';

/** Ba nút chọn buổi Sáng / Chiều / Tối (radio). */
export function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="period-picker" role="radiogroup" aria-label="Buổi">
      {PERIODS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={p === value}
          className={`period-picker__item${p === value ? ' is-selected' : ''}`}
          onClick={() => onChange(p)}
        >
          <PeriodIcon period={p} /> {PERIOD_LABEL[p]}
        </button>
      ))}
    </div>
  );
}
