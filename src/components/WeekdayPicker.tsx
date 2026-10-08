import { useI18n } from '../i18n/I18nProvider';
import './weekdays.css';

/** thứ hiển thị bắt đầu từ thứ Hai; giá trị theo getDay() (0 = CN) */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** Hàng 7 nút tròn T2…CN (`aria-pressed`), dùng cho Mẫu việc và Thói quen. */
export function WeekdayPicker({ value, onChange, labelledBy }: { value: number[]; onChange: (next: number[]) => void; labelledBy: string }) {
  const { t } = useI18n();
  return (
    <div role="group" aria-labelledby={labelledBy} className="weekday-picker">
      {WEEK_ORDER.map((d) => {
        const on = value.includes(d);
        return (
          <button
            key={d}
            type="button"
            className={`weekday-picker__day${on ? ' is-on' : ''}`}
            aria-pressed={on}
            aria-label={t.templateForm.dayLong[d]}
            onClick={() => onChange(on ? value.filter((x) => x !== d) : [...value, d])}
          >
            {t.templateForm.dayShort[d]}
          </button>
        );
      })}
    </div>
  );
}
