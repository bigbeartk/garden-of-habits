import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useDeps } from '../app/deps';
import { BUGS, getBug } from '../content/bugs';
import { HABIT_COLORS } from '../content/habits';
import { PLANTS } from '../content/plants/registry';
import { DEFAULT_POT_ID } from '../content/pots/registry';
import { PlantScene } from './PlantScene';
import { ChevronIcon } from './icons';
import { listDaysInRange } from '../db/queries';
import { dayKey, parseDayKey } from '../domain/dayKey';
import { habitReport, isScheduled, periodRange, shiftPeriod, type HabitCellState, type HabitReportResult, type ReportKind } from '../domain/habitReport';
import { dayBugId, ensureDayBug, listHabits, toggleHabit } from '../domain/habitService';
import type { DayRecord, Habit } from '../domain/types';
import { monthLabel, shortDate } from '../i18n/fmt';
import { useI18n } from '../i18n/I18nProvider';
import { errorText } from '../i18n/errors';
import { useNow } from '../hooks/useNow';
import { useOptimisticToggle } from '../hooks/useOptimisticToggle';
import { WEEK_ORDER } from './WeekdayPicker';
import './habit-report.css';

const KINDS: ReportKind[] = ['week', 'month', 'year'];
const colorVar = (h: Habit) => ({ ['--habit-color' as string]: HABIT_COLORS[h.color] });

/** Báo cáo thói quen: Tuần (bảng như ảnh mẫu), Tháng (lịch nhỏ), Năm (12 thanh %), kèm 4 số tổng. */
export function HabitReport({ onManage }: { onManage: () => void }) {
  const { t, lang } = useI18n();
  const deps = useDeps();
  const todayKey = dayKey(useNow());
  const [kind, setKind] = useState<ReportKind>('week');
  const [anchor, setAnchor] = useState(todayKey);
  const { from, to } = periodRange(kind, anchor);
  const isCurrent = to >= todayKey;
  const data = useLiveQuery(async () => {
    const [habits, checks, days] = await Promise.all([
      listHabits(deps.db),
      deps.db.habitChecks.where('date').between(from, to, true, true).toArray(),
      listDaysInRange(deps.db, from, to),
    ]);
    return { habits, checks, days: new Map(days.map((d) => [d.date, d])), rest: new Set(days.filter((d) => d.isRestDay).map((d) => d.date)) };
  }, [deps.db, from, to]);
  if (!data) return null;

  if (data.habits.length === 0) {
    return (
      <div className="habit-report habit-report--empty card" data-testid="habit-report">
        <div className="habit-report__empty-art" aria-hidden="true" data-testid="habit-empty-art">
          <PlantScene plantId={PLANTS[0].id} potId={DEFAULT_POT_ID} stage="seed" specialId={null} mood="sleep" mode="sleeping" />
        </div>
        <p className="muted">{t.habits.empty}</p>
        <button type="button" className="btn btn--primary" onClick={onManage}>{t.habits.firstHabit}</button>
      </div>
    );
  }

  const report = habitReport(data.habits, data.checks, data.rest, from, to, todayKey);
  const y = parseDayKey(from).getFullYear();
  const label = kind === 'week' ? `${shortDate(lang, from)} – ${shortDate(lang, to)}`
    : kind === 'month' ? monthLabel(lang, y, parseDayKey(from).getMonth())
    : t.habits.yearLabel(y);

  return (
    <div className="habit-report card" data-testid="habit-report">
      <div role="tablist" aria-label={t.habits.kindsLabel} className="habit-report__kinds">
        {KINDS.map((k) => (
          <button
            key={k} type="button" role="tab" aria-selected={kind === k}
            className={`habit-report__kind${kind === k ? ' is-on' : ''}`}
            onClick={() => { setKind(k); setAnchor(todayKey); }}
          >
            {t.habits.kinds[k]}
          </button>
        ))}
      </div>
      <div className="habit-report__nav">
        <button type="button" className="habit-report__arrow" aria-label={t.habits.prev} onClick={() => setAnchor(shiftPeriod(kind, anchor, -1))}><ChevronIcon dir="left" size={18} /></button>
        <span className="habit-report__label">{label}</span>
        <button type="button" className="habit-report__arrow" aria-label={t.habits.next} disabled={isCurrent} onClick={() => setAnchor(shiftPeriod(kind, anchor, 1))}><ChevronIcon dir="right" size={18} /></button>
      </div>
      {kind === 'week' && <WeekTable report={report} days={data.days} todayKey={todayKey} todayRest={data.rest.has(todayKey)} />}
      {kind === 'month' && <MonthCards report={report} />}
      {kind === 'year' && <YearBars habits={data.habits} checks={data.checks} rest={data.rest} year={y} todayKey={todayKey} />}
      <Stats report={report} />
    </div>
  );
}

function WeekTable({ report, days, todayKey, todayRest }: {
  report: HabitReportResult; days: Map<string, DayRecord>; todayKey: string; todayRest: boolean;
}) {
  const { t, tr, lang } = useI18n();
  const deps = useDeps();
  const [error, setError] = useState<string | null>(null);
  // tick đủ hôm nay ngay trong bảng mà chưa có con → bốc luôn (như màn Hôm nay), để hàng Ngày trọn vẹn hiện được
  const rollToday = report.perfectDays.includes(todayKey) && !days.get(todayKey)?.bugId;
  useEffect(() => {
    if (rollToday) ensureDayBug(deps, todayKey, BUGS).catch(() => {});
  }, [rollToday, deps, todayKey]);
  return (
    <div className="habit-week" role="table">
      {error && <p role="alert" className="error" onClick={() => setError(null)}>{error}</p>}
      <div className="habit-week__row habit-week__row--head" role="row">
        <span role="columnheader" />
        {WEEK_ORDER.map((d, i) => (
          <span key={d} role="columnheader" className={`habit-week__day${report.dates[i] === todayKey ? ' is-today' : ''}`}>
            {t.templateForm.dayShort[d]}
          </span>
        ))}
        <span role="columnheader" />
      </div>
      {report.rows.map((row) => (
        <div key={row.habit.id} className="habit-week__row" role="row" style={colorVar(row.habit)}>
          <span role="rowheader" className="habit-week__name"><span aria-hidden="true">{row.habit.icon}</span> {row.habit.name}</span>
          {row.cells.map((c) => c.date === todayKey && !todayRest && isScheduled(row.habit, c.date) ? (
            <span key={c.date} role="cell" className="habit-week__cell">
              <TodayCell habit={row.habit} date={c.date} state={c.state} onError={(e) => setError(errorText(e, t))} />
            </span>
          ) : (
            <span
              key={c.date} role="cell" className={`habit-cell${c.date === todayKey ? ' is-today' : ''}`}
              data-testid={`habit-cell-${row.habit.id}-${c.date}`} data-state={c.state}
              title={t.habits.cellLabel(row.habit.name, c.date)}
            />
          ))}
          <span role="cell" />
        </div>
      ))}
      <div className="habit-week__row habit-week__row--perfect" role="row">
        <span role="rowheader" className="habit-week__name">{t.habits.perfectRow}</span>
        {report.dates.map((d) => {
          // ngày trọn vẹn → côn trùng ghé cây hôm đó (cùng con với Lịch / Hôm nay)
          const bug = report.perfectDays.includes(d) ? getBug(dayBugId(days.get(d), d, todayKey, BUGS)) : null;
          return (
            <span key={d} role="cell" className="habit-week__bug">
              {bug && (
                <svg
                  viewBox="-16 -16 32 32" role="img" data-testid={`habit-day-bug-${d}`} data-bug={bug.id}
                  aria-label={t.habits.dayBug(shortDate(lang, d), tr(bug.name))}
                ><bug.Art animate={false} /></svg>
              )}
            </span>
          );
        })}
        <span role="cell" className="habit-week__badge">{report.perfectPeriod && <span aria-label={t.habits.perfectWeek}>👑</span>}</span>
      </div>
    </div>
  );
}

/** Ô hôm nay của thói quen có lịch hôm nay: chạm để tick / bỏ tick (như chip ở màn Hôm nay), đổi ngay không chờ DB. */
function TodayCell({ habit, date, state, onError }: { habit: Habit; date: string; state: HabitCellState; onError: (e: Error) => void }) {
  const { t } = useI18n();
  const deps = useDeps();
  const { on, toggle } = useOptimisticToggle(state === 'done', async () => { await toggleHabit(deps, habit.id); }, onError);
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={t.habits.checkToday(habit.name)}
      className="habit-cell is-today is-tappable"
      data-testid={`habit-cell-${habit.id}-${date}`} data-state={on ? 'done' : 'pending'}
      onClick={() => toggle()}
    />
  );
}

function MonthCards({ report }: { report: HabitReportResult }) {
  const { t } = useI18n();
  // ô trống đầu tháng để ngày 1 rơi đúng cột (T2 đầu tuần)
  const lead = (parseDayKey(report.from).getDay() + 6) % 7;
  return (
    <div className="habit-months">
      {report.rows.map((row) => (
        <section key={row.habit.id} className="habit-month" data-testid={`habit-month-${row.habit.id}`} style={colorVar(row.habit)}>
          <header className="habit-month__head">
            <span aria-hidden="true">{row.habit.icon}</span>
            <span className="habit-month__name">{row.habit.name}</span>
            <span className="habit-month__rate">{row.rate === null ? '–' : `${row.rate}%`}</span>
          </header>
          <div className="habit-month__grid">
            {WEEK_ORDER.map((d) => <span key={`h${d}`} className="habit-month__dow">{t.templateForm.dayShort[d]}</span>)}
            {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
            {row.cells.map((c) => (
              <span key={c.date} className="habit-cell habit-cell--mini" data-state={c.state} title={t.habits.cellLabel(row.habit.name, c.date)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function YearBars({ habits, checks, rest, year, todayKey }: {
  habits: Habit[]; checks: Parameters<typeof habitReport>[1]; rest: Set<string>; year: number; todayKey: string;
}) {
  const { t } = useI18n();
  const months = Array.from({ length: 12 }, (_, m) => {
    const { from, to } = periodRange('month', `${year}-${String(m + 1).padStart(2, '0')}-01`);
    return habitReport(habits, checks, rest, from, to, todayKey).rows;
  });
  return (
    <div className="habit-years">
      {habits.map((h, i) => (
        <section key={h.id} className="habit-year" data-testid={`habit-year-${h.id}`} style={colorVar(h)}>
          <header className="habit-month__head">
            <span aria-hidden="true">{h.icon}</span>
            <span className="habit-month__name">{h.name}</span>
          </header>
          <div className="habit-year__bars">
            {months.map((rows, m) => {
              const rate = rows[i].rate;
              return (
                <span key={m} className="habit-year__col" data-month={m} data-rate={rate ?? ''} title={`${t.habits.monthShort[m]}: ${rate ?? '–'}%`}>
                  <span className="habit-year__track"><span className="habit-year__fill" style={{ height: `${rate ?? 0}%` }} /></span>
                  <span className="habit-year__m">{t.habits.monthShort[m]}</span>
                </span>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Stats({ report }: { report: HabitReportResult }) {
  const { t } = useI18n();
  const s = report.stats;
  const items: { value: string; unit?: string; label: string; tone: string }[] = [
    { value: s.metPct === null ? '–' : String(s.metPct), unit: s.metPct === null ? undefined : '%', label: t.habits.stats.met, tone: 'peach' },
    { value: String(s.perfectDays), unit: t.habits.dayUnit, label: t.habits.stats.perfectDays, tone: 'sky' },
    { value: String(s.totalDone), label: t.habits.stats.totalDone, tone: 'mint' },
    { value: String(s.bestStreak), unit: t.habits.dayUnit, label: t.habits.stats.bestStreak, tone: 'butter' },
  ];
  return (
    <dl className="habit-stats" data-testid="habit-stats">
      {items.map((it) => (
        <div key={it.label} className={`habit-stats__item habit-stats__item--${it.tone}`}>
          <dt>{it.label}</dt>
          <dd><b>{it.value}</b>{it.unit && <small>{it.unit}</small>}</dd>
        </div>
      ))}
    </dl>
  );
}
