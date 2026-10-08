import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { ConfirmButton } from '../components/ConfirmButton';
import { HabitForm } from '../components/HabitForm';
import { WEEK_ORDER } from '../components/WeekdayPicker';
import { HABIT_COLORS } from '../content/habits';
import { addHabit, deleteHabit, editHabit, listHabits } from '../domain/habitService';
import type { Messages } from '../i18n/vi';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import './templates.css';
import './habits.css';

/** Every-day label when all 7 weekdays are on, else 'T2 · T4' (Mon→Sun order). */
export function scheduleLabel(weekdays: number[], t: Messages): string {
  if (weekdays.length === 7) return t.habits.everyDay;
  return WEEK_ORDER.filter((d) => weekdays.includes(d)).map((d) => t.templateForm.dayShort[d]).join(' · ');
}

/** Habit management screen, opened from the Garden (Habits view) or the + chip on Today; `onBack` returns to the Garden. */
export function HabitsScreen({ onBack, startAdding = false }: { onBack: () => void; startAdding?: boolean }) {
  const { t } = useI18n();
  const deps = useDeps();
  const habits = useLiveQuery(() => listHabits(deps.db), [deps.db]) ?? [];
  const [editing, setEditing] = useState<string | 'new' | null>(startAdding ? 'new' : null);
  const [error, setError] = useState<string | null>(null);
  useBackHandler(editing !== null, () => setEditing(null), 'form');

  return (
    <section className="screen screen--habits" data-testid="habits-screen">
      <header className="habits__head">
        <BackButton inline label={t.habits.backToGarden} onClick={onBack} />
        <h1 className="screen__title">{t.habits.manage}</h1>
      </header>
      {editing !== 'new' && (
        <button type="button" className="habits__new" onClick={() => setEditing('new')}>{t.habits.newHabit}</button>
      )}
      {error && <p role="alert" className="error">{error}</p>}
      {editing === 'new' && (
        <HabitForm
          onCancel={() => setEditing(null)}
          onSave={async (input) => {
            await addHabit(deps, input);
            setEditing(null);
          }}
        />
      )}
      {habits.length === 0 && editing !== 'new' && <p className="empty card">{t.habits.empty}</p>}
      <ul className="habits__list">
        {habits.map((h) => (
          <li key={h.id} className="card habit-card" data-testid={`habit-${h.id}`}>
            {editing === h.id ? (
              <HabitForm
                initial={{ name: h.name, icon: h.icon, color: h.color, weekdays: h.weekdays }}
                onCancel={() => setEditing(null)}
                onSave={async (input) => {
                  await editHabit(deps, h.id, input);
                  setEditing(null);
                }}
              />
            ) : (
              <>
                <span className="habit-card__icon" style={{ background: HABIT_COLORS[h.color] }} aria-hidden="true">{h.icon}</span>
                <div className="habit-card__text">
                  <h2 className="habit-card__name">{h.name}</h2>
                  <p className="habit-card__days">{scheduleLabel(h.weekdays, t)}</p>
                </div>
                <div className="habit-card__actions">
                  <button type="button" className="tpl__mini" onClick={() => setEditing(h.id)}>{t.habits.edit}</button>
                  <ConfirmButton
                    label={t.habits.delete} confirmLabel={t.habits.deleteConfirm} className="tpl__mini"
                    onConfirm={() => deleteHabit(deps, h.id).catch((e: Error) => setError(errorText(e, t)))}
                  />
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
