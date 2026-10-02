import { useEffect, useState } from 'react';
import { useDeps } from './deps';
import { NavContext, type Tab } from './nav';
import { TabBar } from './TabBar';
import { dayKey } from '../domain/dayKey';
import { ensureToday } from '../domain/dayService';
import { useNow } from '../hooks/useNow';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export function App() {
  const deps = useDeps();
  const todayKey = dayKey(useNow());
  const [tab, setTab] = useState<Tab>('calendar');

  // Chạy khi mở app và mỗi khi sang ngày mới (kể cả khi app để mở qua 4:00 rồi quay lại).
  useEffect(() => {
    let alive = true;
    ensureToday(deps)
      .then((day) => {
        if (alive && day.greetedAt === null) setTab('today');
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [deps, todayKey]);

  return (
    <NavContext.Provider value={setTab}>
      <div className="app">
        <main className="app__main">
          {tab === 'calendar' && <CalendarScreen />}
          {tab === 'today' && <TodayScreen />}
          {tab === 'templates' && <TemplatesScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
        <TabBar current={tab} onChange={setTab} />
      </div>
    </NavContext.Provider>
  );
}
