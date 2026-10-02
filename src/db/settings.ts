import type { PlantDB } from './db';
import type { CalendarBg, CalendarTheme } from '../domain/types';

export interface SettingsShape {
  calendarBg: CalendarBg;
  calendarTheme: CalendarTheme;
  lastBackupAt: number;
}

export async function getSetting<K extends keyof SettingsShape>(db: PlantDB, key: K): Promise<SettingsShape[K] | undefined> {
  const row = await db.settings.get(key);
  return row?.value as SettingsShape[K] | undefined;
}

export async function setSetting<K extends keyof SettingsShape>(db: PlantDB, key: K, value: SettingsShape[K]): Promise<void> {
  await db.settings.put({ key, value });
}

export async function deleteSetting(db: PlantDB, key: keyof SettingsShape): Promise<void> {
  await db.settings.delete(key);
}
