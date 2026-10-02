import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { DayCell } from '../components/DayCell';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { WEEKDAY_SHORT, buildMonthGrid, dayCellStatus, monthLabel, shiftMonth } from '../domain/calendar';
import { dayKey, formatDate, parseDayKey } from '../domain/dayKey';
import { useCalendarBgUrl } from '../hooks/useCalendarBg';
import { useNow } from '../hooks/useNow';
import './calendar.css';

export function CalendarScreen() {
  const deps = useDeps();
  const nav = useNav();
  const now = useNow();
  const todayKey = dayKey(now);
  const today = parseDayKey(todayKey);
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const from = formatDate(new Date(view.year, view.month, 1));
  const to = formatDate(new Date(view.year, view.month + 1, 0));
  const days = useLiveQuery(() => listDaysInRange(deps.db, from, to), [deps.db, from, to]) ?? [];
  const firstKey = useLiveQuery(() => firstDayKey(deps.db), [deps.db]) ?? null;
  const bgUrl = useCalendarBgUrl();

  const byKey = new Map(days.map((d) => [d.date, d]));
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const go = (delta: number) => {
    if (delta > 0 && isCurrentMonth) return;
    setView((v) => shiftMonth(v.year, v.month, delta));
  };
  const selectedStatus = selected ? dayCellStatus(selected, byKey.get(selected), todayKey, firstKey) : null;

  return (
    <section
      className="screen screen--calendar"
      style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
      data-has-bg={bgUrl ? 'true' : 'false'}
    >
      <header className="cal__head card">
        <button type="button" className="btn btn--round" aria-label="Tháng trước" onClick={() => go(-1)}>‹</button>
        <h1 className="screen__title" aria-live="polite">{monthLabel(view.year, view.month)}</h1>
        <button type="button" className="btn btn--round" aria-label="Tháng sau" onClick={() => go(1)} disabled={isCurrentMonth}>›</button>
      </header>

      <motion.div
        className="cal card"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.x > 60) go(-1);
          else if (info.offset.x < -60) go(1);
        }}
      >
        <div className="cal__weekdays" aria-hidden="true">
          {WEEKDAY_SHORT.map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="cal__grid">
          {cells.map((c, i) =>
            c.key && c.day ? (
              <DayCell
                key={c.key}
                dateKey={c.key}
                day={c.day}
                status={dayCellStatus(c.key, byKey.get(c.key), todayKey, firstKey)}
                record={byKey.get(c.key)}
                isToday={c.key === todayKey}
                onSelect={() => setSelected(c.key)}
              />
            ) : (
              <span key={`pad-${i}`} className="cal__pad" />
            ),
          )}
        </div>
      </motion.div>

      <div className="cal__footer">
        <BackgroundPicker />
      </div>

      <DayDetailSheet
        dateKey={selected}
        todayKey={todayKey}
        status={selectedStatus}
        record={selected ? byKey.get(selected) : undefined}
        onClose={() => setSelected(null)}
        onGoToday={() => {
          setSelected(null);
          nav('today');
        }}
      />
    </section>
  );
}
