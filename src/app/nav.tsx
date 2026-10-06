import { createContext, useContext, type FC } from 'react';
import { CalendarIcon, GardenIcon, GearIcon, SproutIcon } from '../components/icons';

export type Tab = 'calendar' | 'today' | 'garden' | 'settings';

/** Nhãn tab ở `t.nav.tabs[id]`. */
export const TABS: { id: Tab; Icon: FC<{ size?: number }> }[] = [
  { id: 'calendar', Icon: CalendarIcon },
  { id: 'today', Icon: SproutIcon },
  { id: 'garden', Icon: GardenIcon },
  { id: 'settings', Icon: GearIcon },
];

export const NavContext = createContext<(tab: Tab) => void>(() => {});
export const useNav = () => useContext(NavContext);
