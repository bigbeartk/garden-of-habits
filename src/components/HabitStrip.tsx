import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { HABIT_COLORS } from '../content/habits';
import { checksOn, habitsForDay, listHabits, toggleHabit } from '../domain/habitService';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { PlusIcon } from './icons';
import './habit-strip.css';

/** Dải chip thói quen có lịch hôm nay, đầu danh sách ở màn Hôm nay. Chạm chip = tick / bỏ tick. */
export function HabitStrip({ date, isRestDay, onChecked, onManage }: {
  date: string; isRestDay: boolean; onChecked: () => void; onManage: () => void;
}) {
  const { t } = useI18n();
  const deps = useDeps();
  const data = useLiveQuery(async () => ({ habits: await listHabits(deps.db), done: await checksOn(deps.db, date) }), [deps.db, date]);
  /** giữ cục bộ để bấm nhanh hai lần không đọc lại giá trị cũ từ DB */
  const [local, setLocal] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  if (!data || isRestDay) return null;

  if (data.habits.length === 0) {
    return (
      <div className="habit-strip habit-strip--empty">
        <button type="button" className="habit-chip habit-chip--add is-faint" onClick={onManage}>
          <span className="habit-chip__dot"><PlusIcon size={22} /></span>
          <span className="habit-chip__name">{t.habits.addFirstChip}</span>
        </button>
      </div>
    );
  }
  const today = habitsForDay(data.habits, date, false);
  if (today.length === 0) return null;
  const isOn = (id: string) => local[id] ?? data.done.has(id);
  const doneCount = today.filter((h) => isOn(h.id)).length;

  function toggle(id: string) {
    const next = !isOn(id);
    setLocal((m) => ({ ...m, [id]: next }));
    toggleHabit(deps, id).then((checked) => {
      if (checked) onChecked();
    }).catch((e: Error) => {
      setLocal((m) => ({ ...m, [id]: !next }));
      setError(errorText(e, t));
    });
  }

  return (
    <section className="habit-strip" data-testid="habit-strip" aria-label={t.habits.stripTitle}>
      <header className="habit-strip__head">
        <h2 className="habit-strip__title">{t.habits.stripTitle}</h2>
        <span className="pill">{`${doneCount}/${today.length}`}</span>
      </header>
      {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
      <div className="habit-strip__chips">
        {today.map((h) => {
          const on = isOn(h.id);
          return (
            <button
              key={h.id} type="button" role="switch" aria-checked={on} aria-label={t.habits.chip(h.name)}
              className={`habit-chip${on ? ' is-on' : ''}`}
              style={{ ['--habit-color' as string]: HABIT_COLORS[h.color] }}
              onClick={() => toggle(h.id)}
            >
              <span className="habit-chip__dot" aria-hidden="true">{h.icon}{on && <span className="habit-chip__check">✓</span>}</span>
              <span className="habit-chip__name" aria-hidden="true">{h.name}</span>
            </button>
          );
        })}
        <button type="button" className="habit-chip habit-chip--add" aria-label={t.habits.manage} onClick={onManage}>
          <span className="habit-chip__dot"><PlusIcon size={22} /></span>
        </button>
      </div>
    </section>
  );
}
