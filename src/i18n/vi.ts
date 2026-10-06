import type { GrowthStage } from '../domain/growth';
import type { Period } from '../domain/period';

/** Nguồn chuẩn mọi chữ giao diện. Thêm chuỗi mới: thêm ở đây và ở en.ts (tsc báo nếu thiếu). */
export const vi = {
  nav: {
    tabs: { calendar: 'Lịch', today: 'Hôm nay', garden: 'Khu vườn', settings: 'Cài đặt' },
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    backToCalendar: 'Quay lại Lịch',
    backToSettings: 'Quay lại Cài đặt',
  },
  language: { title: 'Ngôn ngữ · Language' },
  period: { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' } as Record<Period, string>,
  stage: { seed: 'Hạt giống', sprout: 'Nảy mầm', bud: 'Ra chồi', bloom: 'Ra hoa' } as Record<GrowthStage, string>,
  calendar: {
    weekdaysShort: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    prevMonth: 'Tháng trước',
    nextMonth: 'Tháng sau',
  },
};

export type Messages = typeof vi;
