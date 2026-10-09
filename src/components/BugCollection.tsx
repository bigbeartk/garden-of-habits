import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { BUGS, countBugs } from '../content/bugs';
import { dayKey } from '../domain/dayKey';
import { listHabits, perfectHabitDays } from '../domain/habitService';
import { useI18n } from '../i18n/I18nProvider';
import './bug-collection.css';

/** Thẻ "Côn trùng đã gặp" (Khu vườn → Thói quen): đếm từ mọi ngày làm đủ thói quen; loài chưa gặp là ô bí ẩn. */
export function BugCollection() {
  const { t, tr } = useI18n();
  const deps = useDeps();
  const counts = useLiveQuery(async () => {
    const habits = await listHabits(deps.db);
    if (habits.length === 0) return null;
    const from = habits.reduce((m, h) => (h.startDate < m ? h.startDate : m), habits[0].startDate);
    return countBugs(await perfectHabitDays(deps, from, dayKey(deps.now())));
  }, [deps]);
  if (!counts) return null;
  const met = BUGS.filter((b) => counts.has(b.id)).length;

  return (
    <section className="bug-collection card" data-testid="bug-collection" aria-labelledby="bug-collection-title">
      <header className="bug-collection__head">
        <h2 id="bug-collection-title" className="bug-collection__title">{t.bugs.title}</h2>
        <span className="pill">{`${met}/${BUGS.length}`}</span>
      </header>
      <ul className="bug-collection__grid">
        {BUGS.map((b) => {
          const n = counts.get(b.id) ?? 0;
          const rarity = t.bugs.rarity[b.rarity];
          return (
            <li
              key={b.id}
              className={`bug-collection__item is-${b.rarity}${n > 0 ? '' : ' is-locked'}`}
              data-testid={`bug-${b.id}`}
              data-met={n > 0}
              aria-label={n > 0 ? t.bugs.item(tr(b.name), rarity, n) : t.bugs.mysteryItem(rarity)}
            >
              <span className="bug-collection__disc" aria-hidden="true">
                {n > 0 ? (
                  <svg viewBox="-16 -16 32 32" data-testid="bug-art"><b.Art animate={false} /></svg>
                ) : (
                  <span className="bug-collection__mystery">?</span>
                )}
                {n > 0 && <span className="bug-collection__count">{t.bugs.times(n)}</span>}
              </span>
              <span className="bug-collection__name" aria-hidden="true">{n > 0 ? tr(b.name) : '???'}</span>
              <span className="bug-collection__rarity" aria-hidden="true">{rarity}</span>
            </li>
          );
        })}
      </ul>
      {met < BUGS.length && <p className="bug-collection__hint">{t.bugs.hint}</p>}
    </section>
  );
}
