import type { PlantDB } from './db';
import type { CalendarBg, CalendarTheme } from '../domain/types';

export interface SettingsShape {
  calendarBg: CalendarBg;
  calendarTheme: CalendarTheme;
  /** hiện nút tròn đổi hình nền ngay trên trang Lịch (mặc định: có) */
  showCalendarBgButton: boolean;
  /** hiện chấm đỏ ở ô lịch của ngày có ghi chú (mặc định: có) */
  showNoteDot: boolean;
  /** hiện bong bóng lời cây nói của ngày ở màn Hôm nay (mặc định: có) */
  showPlantSpeech: boolean;
  /** màn Khu vườn chỉ hiện luống có ít nhất 1 ngày (mặc định: không) */
  gardenOnlyPlanted: boolean;
  /** màn Khu vườn tách ngày cây đặc biệt thành luống riêng (mặc định: không) */
  gardenSeparateSpecial: boolean;
  lastBackupAt: number;
  /** cây đặc biệt đã tung trúng, dạng 'plantId|specialId'; chọn lại được ở bảng Đổi cây */
  unlockedSpecials: string[];
  /** dáng cây đã mở khoá (đủ ngày ra hoa), dạng 'plantId|styleId'; mở rồi giữ luôn */
  unlockedStyles: string[];
  /** ngày ('YYYY-MM-DD') đã góp vào mở dáng; mỗi ngày chỉ góp một lần dù bỏ tick, đổi loài rồi tick lại */
  styleBloomCredit: string;
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
export const BOOLEAN_SETTINGS = ['showCalendarBgButton', 'showNoteDot', 'showPlantSpeech', 'gardenOnlyPlanted', 'gardenSeparateSpecial'] as const;
export type BooleanSetting = (typeof BOOLEAN_SETTINGS)[number];
