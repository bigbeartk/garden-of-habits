import { createContext, useContext, type FC } from 'react';
import { CalendarIcon, GardenIcon, GearIcon, SproutIcon } from '../components/icons';

export type Tab = 'calendar' | 'today' | 'garden' | 'settings';

export const TABS: { id: Tab; label: string; Icon: FC<{ size?: number }> }[] = [
  { id: 'calendar', label: 'Lịch', Icon: CalendarIcon },
  { id: 'today', label: 'Hôm nay', Icon: SproutIcon },
  { id: 'garden', label: 'Khu vườn', Icon: GardenIcon },
  { id: 'settings', label: 'Cài đặt', Icon: GearIcon },
];

export const NavContext = createContext<(tab: Tab) => void>(() => {});
export const useNav = () => useContext(NavContext);
