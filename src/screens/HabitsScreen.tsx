import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useBackHandler } from '../app/back';
import { useDeps } from '../app/deps';
import { BackButton } from '../components/BackButton';
import { ConfirmButton } from '../components/ConfirmButton';
import { HabitForm } from '../components/HabitForm';
import { PauseIcon, PencilIcon, PlayIcon, RemoveIcon } from '../components/icons';
import { WEEK_ORDER } from '../components/WeekdayPicker';
import { HABIT_COLORS } from '../content/habits';
import { addHabit, deleteHabit, editHabit, listHabits, resumeHabit, stopHabit } from '../domain/habitService';
import { stoppedSince } from '../domain/habitReport';
import type { Habit } from '../domain/types';
import { shortDate } from '../i18n/fmt';
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
export function HabitsScreen({ onBack, startAdding = false, backLabel }: { onBack: () => void; startAdding?: boolean; backLabel?: string }) {
  const { t, lang } = useI18n();
  const deps = useDeps();
  const habits = useLiveQuery(() => listHabits(deps.db), [deps.db]) ?? [];
  const active = habits.filter((h) => stoppedSince(h) === null);
  const stopped = habits.filter((h) => stoppedSince(h) !== null);
  const [editing, setEditing] = useState<string | 'new' | null>(startAdding ? 'new' : null);
  const [error, setError] = useState<string | null>(null);
  useBackHandler(editing !== null, () => setEditing(null), 'form');
  const fail = (e: Error) => setError(errorText(e, t));

  const head = (h: Habit, sub: string) => (
    <>
      <span className="habit-card__icon" style={{ background: HABIT_COLORS[h.color] }} aria-hidden="true">{h.icon}</span>
      <div className="habit-card__text">
        <h2 className="habit-card__name">{h.name}</h2>
        <p className="habit-card__days">{sub}</p>
      </div>
    </>
  );
  const del = (h: Habit) => (
    <ConfirmButton
      label={t.habits.delete(h.name)} confirmLabel={t.habits.deleteConfirm} className="habit-card__btn habit-card__btn--delete"
      icon={<RemoveIcon size={22} />} onConfirm={() => deleteHabit(deps, h.id).catch(fail)}
    />
  );

  return (
    <section className="screen screen--habits" data-testid="habits-screen">
      <header className="habits__head">
        <BackButton inline label={backLabel ?? t.habits.backToGarden} onClick={onBack} />
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
        {active.map((h) => (
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
                {head(h, scheduleLabel(h.weekdays, t))}
                <div className="habit-card__actions">
                  <button type="button" className="habit-card__btn habit-card__btn--edit" aria-label={t.habits.edit(h.name)} title={t.habits.edit(h.name)} onClick={() => setEditing(h.id)}>
                    <PencilIcon size={22} />
                  </button>
                  <button type="button" className="habit-card__btn habit-card__btn--pause" aria-label={t.habits.stop(h.name)} title={t.habits.stop(h.name)} onClick={() => stopHabit(deps, h.id).catch(fail)}>
                    <PauseIcon size={22} />
                  </button>
                  {del(h)}
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      {stopped.length > 0 && (
        <section className="habits__stopped" data-testid="habits-stopped" aria-labelledby="habits-stopped-title">
          <h2 id="habits-stopped-title" className="habits__stopped-title">{t.habits.stoppedTitle}</h2>
          <p className="habits__stopped-hint">{t.habits.stoppedHint}</p>
          <ul className="habits__list">
            {stopped.map((h) => (
              <li key={h.id} className="card habit-card is-stopped" data-testid={`habit-${h.id}`}>
                {head(h, t.habits.stoppedSince(shortDate(lang, stoppedSince(h)!)))}
                <div className="habit-card__actions">
                  <button type="button" className="habit-card__btn habit-card__btn--resume" aria-label={t.habits.resume(h.name)} title={t.habits.resume(h.name)} onClick={() => resumeHabit(deps, h.id).catch(fail)}>
                    <PlayIcon size={22} />
                  </button>
                  {del(h)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
