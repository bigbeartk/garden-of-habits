import type { PlantDB } from './db';
import type { CalendarBg, CalendarTheme } from '../domain/types';

export interface SettingsShape {
  calendarBg: CalendarBg;
  calendarTheme: CalendarTheme;
  /** hiện nút tròn đổi hình nền ngay trên trang Lịch (mặc định: có) */
  showCalendarBgButton: boolean;
  /** hiện chấm đỏ ở ô lịch của ngày có ghi chú (mặc định: có) */
  showNoteDot: boolean;
  /** cây nói ghi chú hôm nay trong bong bóng thoại (mặc định: không) */
  plantSaysNote: boolean;
  /** màn Khu vườn chỉ hiện luống có ít nhất 1 ngày (mặc định: không) */
  gardenOnlyPlanted: boolean;
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

/** Các công tắc bật/tắt; đều có trong file sao lưu (tuỳ chọn, file cũ có thể thiếu). */
export const BOOLEAN_SETTINGS = ['showCalendarBgButton', 'showNoteDot', 'plantSaysNote', 'gardenOnlyPlanted'] as const;
export type BooleanSetting = (typeof BOOLEAN_SETTINGS)[number];
