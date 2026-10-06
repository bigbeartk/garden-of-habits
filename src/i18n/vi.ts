import type { ErrorParams } from '../domain/errors';
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
  errors: {
    dayLocked: (p: ErrorParams) => `Ngày ${p.date} đã qua, chỉ có thể sửa ghi chú.`,
    dayNotFound: (p: ErrorParams) => `Không tìm thấy ngày ${p.date}`,
    todoNotFound: (_p: ErrorParams) => 'Không tìm thấy việc cần làm',
    emptyTask: (_p: ErrorParams) => 'Nội dung việc cần làm không được để trống',
    emptyReminder: (_p: ErrorParams) => 'Nội dung việc nhắc không được để trống',
    emptyTemplateName: (_p: ErrorParams) => 'Tên mẫu không được để trống',
    templateNotFound: (_p: ErrorParams) => 'Không tìm thấy mẫu',
    reminderNotFound: (_p: ErrorParams) => 'Không tìm thấy việc nhắc',
    plannedNotFuture: (_p: ErrorParams) => 'Chỉ lên lịch được cho ngày sau hôm nay',
    specialLocked: (_p: ErrorParams) => 'Cây đặc biệt này chưa mở khoá',
    styleLocked: (_p: ErrorParams) => 'Dáng cây này chưa mở khoá',
    unknownPlant: (p: ErrorParams) => `Không có loại cây "${p.id}"`,
    unknownPot: (p: ErrorParams) => `Không có loại chậu "${p.id}"`,
    unknownStyle: (p: ErrorParams) => `Không có dáng "${p.id}"`,
  },
  backup: {
    errors: {
      notJson: (_path?: string) => 'File không phải JSON hợp lệ.',
      wrongFormat: (_path?: string) => 'Đây không phải file sao lưu của Garden of Habits.',
      tooNew: (_path?: string) => 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.',
      corrupt: (path?: string) => `File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "${path ?? ''}").`,
    },
  },
};

export type Messages = typeof vi;
