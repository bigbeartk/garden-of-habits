import { createContext, useContext } from 'react';

export type Tab = 'calendar' | 'today' | 'templates' | 'settings';

export const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Lịch', icon: '📅' },
  { id: 'today', label: 'Hôm nay', icon: '🌱' },
  { id: 'templates', label: 'Mẫu', icon: '📝' },
  { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
];

export const NavContext = createContext<(tab: Tab) => void>(() => {});
export const useNav = () => useContext(NavContext);
