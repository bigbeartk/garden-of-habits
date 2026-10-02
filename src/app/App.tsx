import { useEffect, useState } from 'react';
import { useDeps } from './deps';
import { NavContext, type Tab } from './nav';
import { TabBar } from './TabBar';
import { ensureToday } from '../domain/dayService';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export function App() {
  const deps = useDeps();
  const [tab, setTab] = useState<Tab>('calendar');

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
  }, [deps]);

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
