import { useState } from 'react';
import { NavContext, type Tab } from './nav';
import { TabBar } from './TabBar';
import { CalendarScreen } from '../screens/CalendarScreen';
import { TodayScreen } from '../screens/TodayScreen';
import { TemplatesScreen } from '../screens/TemplatesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export function App() {
  const [tab, setTab] = useState<Tab>('calendar');
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
