import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useDeps } from './deps';
import { NavContext, TABS, type Tab } from './nav';
import { TabBar } from './TabBar';
import { dayKey } from '../domain/dayKey';
import { ensureToday } from '../domain/dayService';
import { useNow } from '../hooks/useNow';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

type Direction = 'forward' | 'back';

/** Màn mới trượt vào từ phải (tab đứng sau) hoặc từ trái (tab đứng trước), kèm mờ dần. */
const SLIDE: Variants = {
  enter: (dir: Direction) => ({ x: dir === 'forward' ? 48 : -48, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: Direction) => ({ x: dir === 'forward' ? -32 : 32, opacity: 0, scale: 0.98 }),
};

const tabIndex = (t: Tab) => TABS.findIndex((x) => x.id === t);

export function App() {
  const deps = useDeps();
  const todayKey = dayKey(useNow());
  const [{ tab, dir }, setNav] = useState<{ tab: Tab; dir: Direction }>({ tab: 'calendar', dir: 'forward' });

  const goTo = useCallback((next: Tab) => {
    setNav((cur) => (cur.tab === next ? cur : { tab: next, dir: tabIndex(next) >= tabIndex(cur.tab) ? 'forward' : 'back' }));
  }, []);

  // Chạy khi mở app và mỗi khi sang ngày mới (kể cả khi app để mở qua 4:00 rồi quay lại).
  useEffect(() => {
    let alive = true;
    ensureToday(deps)
      .then((day) => {
        if (alive && day.greetedAt === null) goTo('today');
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [deps, todayKey, goTo]);

  return (
    <NavContext.Provider value={goTo}>
      <div className="app">
        <main className="app__main">
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={tab}
              className="tab-screen"
              data-testid="tab-screen"
              data-tab={tab}
              data-direction={dir}
              custom={dir}
              variants={SLIDE}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'calendar' && <CalendarScreen />}
              {tab === 'today' && <TodayScreen />}
              {tab === 'templates' && <TemplatesScreen />}
              {tab === 'settings' && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
        <TabBar current={tab} onChange={goTo} />
      </div>
    </NavContext.Provider>
  );
}
