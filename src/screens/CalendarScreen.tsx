import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { useDeps } from '../app/deps';
import { useNav } from '../app/nav';
import { BackgroundPicker } from '../components/BackgroundPicker';
import { DayCell } from '../components/DayCell';
import { DayDetailSheet } from '../components/DayDetailSheet';
import { firstDayKey, listDaysInRange } from '../db/queries';
import { getSetting } from '../db/settings';
import { plannedCountsInRange } from '../domain/plannedService';
import { FutureDayScreen } from './FutureDayScreen';

const MAX_MONTHS_AHEAD = 12;
import { WEEKDAY_SHORT, buildMonthGrid, dayCellStatus, monthLabel, shiftMonth } from '../domain/calendar';
import { dayKey, formatDate, parseDayKey } from '../domain/dayKey';
import { useCalendarBg, useCalendarTheme } from '../hooks/useCalendarBg';
import { isVideoMime } from '../utils/image';
import { CatStretchScene } from '../components/backgrounds/CatStretchScene';
import { GrassBloomScene } from '../components/backgrounds/GrassBloomScene';
import { PixelGamingRoomScene } from '../components/backgrounds/PixelGamingRoomScene';
import { RainChillScene } from '../components/backgrounds/RainChillScene';
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
  /** ngày tương lai đang mở (màn giống Hôm nay để lên lịch việc) */
  const [futureDate, setFutureDate] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthGrid(view.year, view.month), [view]);
  const from = formatDate(new Date(view.year, view.month, 1));
  const to = formatDate(new Date(view.year, view.month + 1, 0));
  const days = useLiveQuery(() => listDaysInRange(deps.db, from, to), [deps.db, from, to]) ?? [];
  const plannedCounts = useLiveQuery(() => plannedCountsInRange(deps.db, from, to), [deps.db, from, to]) ?? {};
  const firstKey = useLiveQuery(() => firstDayKey(deps.db), [deps.db]) ?? null;
  const userBg = useCalendarBg();
  const theme = useCalendarTheme();
  const showBgButton = useLiveQuery(async () => (await getSetting(deps.db, 'showCalendarBgButton')) !== false, [deps.db], true);
  const showNoteDot = useLiveQuery(async () => (await getSetting(deps.db, 'showNoteDot')) !== false, [deps.db], true);
  const photo = theme === 'photo' ? userBg : null;
  // ảnh tĩnh / GIF: làm ảnh nền (GIF tự chuyển động); video: phát bằng thẻ video phía sau
  const videoUrl = photo && isVideoMime(photo.mime) ? photo.url : null;
  const photoUrl = photo && !videoUrl ? photo.url : null;
  const glass = theme !== 'default' ? ' is-glass' : '';
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  const byKey = new Map(days.map((d) => [d.date, d]));
  // Đi tới tối đa 12 tháng sau để lên lịch việc tương lai
  const monthsAhead = (view.year - today.getFullYear()) * 12 + (view.month - today.getMonth());
  const atLastMonth = monthsAhead >= MAX_MONTHS_AHEAD;
  const go = (delta: number) => {
    if (delta > 0 && atLastMonth) return;
    setView((v) => shiftMonth(v.year, v.month, delta));
  };
  const selectedStatus = selected ? dayCellStatus(selected, byKey.get(selected), todayKey, firstKey) : null;

  /** Ngày đã qua: xem chi tiết (chỉ xem). Hôm nay: sang tab Hôm nay. Tương lai: màn lên lịch. */
  const selectDay = (key: string) => {
    if (key === todayKey) nav('today');
    else if (key > todayKey) setFutureDate(key);
    else setSelected(key);
  };

  if (futureDate) return <FutureDayScreen date={futureDate} onBack={() => setFutureDate(null)} />;

  return (
    <section
      className="screen screen--calendar"
      style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
      data-has-bg={theme !== 'default' ? 'true' : 'false'}
      data-theme={theme}
    >
      {theme === 'cat' && <CatStretchScene />}
      {theme === 'grass' && <GrassBloomScene />}
      {theme === 'rain' && <RainChillScene />}
      {theme === 'gamer' && <PixelGamingRoomScene />}
      {videoUrl && (
        <div className="bg-scene" aria-hidden="true">
          {/* Safari iOS chỉ tự phát video khi không tiếng + playsInline; giảm chuyển động thì đứng ở khung đầu */}
          <video
            className="bg-scene__video"
            data-testid="calendar-video"
            src={videoUrl}
            autoPlay={!reducedMotion}
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
      )}
      <header className={`cal__head card${glass}`} data-testid="calendar-head">
        <button type="button" className="btn btn--round" aria-label="Tháng trước" onClick={() => go(-1)}>‹</button>
        <h1 className="screen__title" aria-live="polite">{monthLabel(view.year, view.month)}</h1>
        <button type="button" className="btn btn--round" aria-label="Tháng sau" onClick={() => go(1)} disabled={atLastMonth}>›</button>
      </header>

      <motion.div
        className={`cal card${glass}`}
        data-testid="calendar-card"
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
          {cells.map((c, i) => {
            const key = c.key;
            return key && c.day ? (
              <DayCell
                key={key}
                dateKey={key}
                day={c.day}
                status={dayCellStatus(key, byKey.get(key), todayKey, firstKey)}
                record={byKey.get(key)}
                plannedCount={plannedCounts[key] ?? 0}
                isToday={key === todayKey}
                showNoteDot={showNoteDot}
                onSelect={() => selectDay(key)}
              />
            ) : (
              <span key={`pad-${i}`} className="cal__pad" />
            );
          })}
        </div>
      </motion.div>

      <div className="cal__footer">
        {showBgButton && <BackgroundPicker />}
      </div>

      <DayDetailSheet
        dateKey={selected}
        status={selectedStatus}
        record={selected ? byKey.get(selected) : undefined}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
