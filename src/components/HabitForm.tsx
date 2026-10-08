import { useId, useRef, useState } from 'react';
import { HABIT_COLORS, HABIT_COLOR_IDS, HABIT_ICONS } from '../content/habits';
import { HABIT_NAME_MAX, type HabitInput } from '../domain/habitService';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { WeekdayPicker } from './WeekdayPicker';

const BLANK: HabitInput = { name: '', icon: HABIT_ICONS[0], color: 'peach', weekdays: [0, 1, 2, 3, 4, 5, 6] };

export function HabitForm({ initial = BLANK, onSave, onCancel }: {
  initial?: HabitInput; onSave: (input: HabitInput) => Promise<void>; onCancel: () => void;
}) {
  const { t } = useI18n();
  const f = t.habits.form;
  const id = useId();
  const [v, setV] = useState<HabitInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** chặn nộp hai lần trong cùng một nhịp (state chưa kịp cập nhật) */
  const inFlight = useRef(false);
  const valid =v.name.trim() !== '' && v.weekdays.length > 0;
  return (
    <form
      className="habit-form card"
      onSubmit={async (e) => {
        e.preventDefault();
        if (inFlight.current) return;
        inFlight.current = true;
        setBusy(true);
        try {
          await onSave(v);
        } catch (err) {
          setError(errorText(err, t));
        } finally {
          inFlight.current = false;
          setBusy(false);
        }
      }}
    >
      <label htmlFor={`${id}-name`} className="habit-form__label">{f.name}</label>
      <input
        id={`${id}-name`} className="input" value={v.name} maxLength={HABIT_NAME_MAX} placeholder={f.namePlaceholder}
        onChange={(e) => setV({ ...v, name: e.target.value })}
      />
      <p id={`${id}-icon`} className="habit-form__label">{f.icon}</p>
      <div role="radiogroup" aria-labelledby={`${id}-icon`} className="habit-form__icons">
        {HABIT_ICONS.map((icon) => (
          <button
            key={icon} type="button" role="radio" aria-checked={v.icon === icon} aria-label={icon}
            className={`habit-form__icon${v.icon === icon ? ' is-on' : ''}`}
            onClick={() => setV({ ...v, icon })}
          >
            {icon}
          </button>
        ))}
      </div>
      <p id={`${id}-color`} className="habit-form__label">{f.color}</p>
      <div role="radiogroup" aria-labelledby={`${id}-color`} className="habit-form__colors">
        {HABIT_COLOR_IDS.map((c) => (
          <button
            key={c} type="button" role="radio" aria-checked={v.color === c} aria-label={t.habits.colorName[c]}
            className={`habit-form__color${v.color === c ? ' is-on' : ''}`} style={{ background: HABIT_COLORS[c] }}
            onClick={() => setV({ ...v, color: c })}
          />
        ))}
      </div>
      <p id={`${id}-days`} className="habit-form__label">{f.days}</p>
      <WeekdayPicker value={v.weekdays} onChange={(weekdays) => setV({ ...v, weekdays })} labelledBy={`${id}-days`} />
      {error && <p role="alert" className="error">{error}</p>}
      <div className="habit-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>{t.common.cancelForm}</button>
        <button type="submit" className="btn btn--primary" disabled={!valid || busy}>{f.save}</button>
      </div>
    </form>
  );
}
