import type { CalendarTheme } from '../domain/types';
import type { TimeOfDay } from '../domain/timeOfDay';
import type { CellStatus } from '../domain/calendar';
import type { ErrorParams } from '../domain/errors';
import type { GrowthStage } from '../domain/growth';
import type { Period } from '../domain/period';

const PERIOD_VI: Record<Period, string> = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' };

/** Nguồn chuẩn mọi chữ giao diện. Thêm chuỗi mới: thêm ở đây và ở en.ts (tsc báo nếu thiếu). */
export const vi = {
  nav: {
    tabs: { calendar: 'Lịch', today: 'Hôm nay', garden: 'Khu vườn', settings: 'Cài đặt' },
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    backToCalendar: 'Quay lại Lịch',
    backToSettings: 'Quay lại Cài đặt',
    label: 'Điều hướng',
  },
  language: { title: 'Ngôn ngữ · Language' },
  period: PERIOD_VI,
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
    videoTooLarge: (_p: ErrorParams) => 'Video quá lớn, tối đa 25 MB. Thử cắt ngắn hoặc chọn tệp khác nhé.',
    gifTooLarge: (_p: ErrorParams) => 'Ảnh động quá lớn, tối đa 25 MB. Thử cắt ngắn hoặc chọn tệp khác nhé.',
  },
  backup: {
    errors: {
      notJson: (_path?: string) => 'File không phải JSON hợp lệ.',
      wrongFormat: (_path?: string) => 'Đây không phải file sao lưu của Garden of Habits.',
      tooNew: (_path?: string) => 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.',
      corrupt: (path?: string) => `File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "${path ?? ''}").`,
    },
  },
  common: {
    close: 'Đóng',
    cancel: 'Thôi',
    cancelForm: 'Huỷ',
    deleteShort: 'Xoá',
    delete: (text: string) => `Xoá: ${text}`,
    confirmDelete: (text: string) => `Xác nhận xoá: ${text}`,
    editTask: 'Sửa việc',
    noTasks: 'Chưa có việc',
    processing: 'Đang xử lý…',
  },
  todo: {
    addTask: (p: Period) => `Thêm việc buổi ${PERIOD_VI[p]}`,
    newTask: (p: Period) => `Việc mới buổi ${PERIOD_VI[p]}`,
    draftPlaceholder: 'Việc cần làm…',
    complete: (text: string) => `Hoàn thành: ${text}`,
    uncomplete: (text: string) => `Bỏ hoàn thành: ${text}`,
    fromReminder: 'Từ Nhắc việc',
    emptyHint: 'Bấm ＋ để thêm việc và tưới cây nhé 💧',
    plannedHint: 'Bấm ＋ để lên lịch việc cho ngày này 🌱',
  },
  dayCell: {
    status: { plant: '', rest: 'ngày tiết kiệm năng lượng', missed: 'cây héo', 'today-pending': 'hôm nay', future: 'chưa tới', 'before-start': '' } as Record<CellStatus, string>,
    planned: (n: number) => `${n} việc đã lên lịch`,
  },
  detail: {
    special: (name: string) => `✨ Cây đặc biệt: ${name}`,
    rest: '💤 Ngày tiết kiệm năng lượng',
    missed: 'Hôm đó cây chưa được chăm sóc 🥀',
    done: 'Đã xong',
    notDone: 'Chưa xong',
    note: 'Ghi chú',
  },
  mini: { sleeping: 'Ngủ ngon', wilted: 'Cây héo' },
  note: {
    title: 'Ghi chú hôm nay',
    label: 'Nội dung ghi chú',
    placeholder: 'Hôm nay thế nào nè?',
    hint: 'Ghi chú được tự động lưu',
  },
  picker: {
    choosePlant: 'Chọn cây hôm nay',
    choosePot: 'Chọn chậu',
    stylesOf: (name: string) => `Dáng của ${name}`,
    styleButton: (name: string, n: number) => `Dáng cây: ${name} (${n}/3)`,
    specialsHeading: '✨ Cây đặc biệt đã gặp',
    specialsHint: 'Mỗi ngày có 10% cơ hội gặp cây đặc biệt — gặp rồi sẽ chọn lại được ở đây.',
    backToPlants: 'Quay lại chọn cây',
    bloomedDays: (n: number) => `Đã ra hoa ${n} ngày`,
    progressLabel: 'Tiến độ mở dáng',
    allUnlocked: 'Đã mở hết dáng!',
    base: 'Gốc',
    mystery: 'Dáng bí ẩn',
    mysteryLabel: (n: number) => `Dáng bí ẩn, ra hoa ${n} ngày để mở`,
    unlockAt: (n: number) => `Ra hoa ${n} ngày để mở`,
  },
  sky: { morning: 'Buổi sáng', noon: 'Buổi trưa', afternoon: 'Buổi chiều', evening: 'Buổi tối' } as Record<TimeOfDay, string>,
  speech: {
    label: 'Lời cây nói',
    placeholder: 'Cây sẽ nói gì hôm nay?',
    edit: 'Sửa lời cây nói',
    empty: 'Chạm để viết lời cây nói ✎',
  },
  templateForm: {
    name: 'Tên mẫu',
    namePlaceholder: 'Ví dụ: Ngày đi làm',
    periodTasks: (p: Period) => `Việc buổi ${PERIOD_VI[p]}`,
    onePerLine: '(mỗi dòng một việc)',
    itemsPlaceholder: 'Mỗi dòng một việc…',
    save: 'Lưu mẫu',
  },
  background: {
    options: { default: 'Mặc định', cat: 'Mèo vươn vai', grass: 'Cỏ nở', rain: 'Mưa chill', gamer: 'Gaming pixel', photo: 'Ảnh của bạn' } as Record<CalendarTheme, string>,
    toggle: (name: string) => `Đổi hình nền lịch (đang dùng: ${name})`,
    title: 'Hình nền lịch',
    readFailed: 'Không đọc được tệp này, thử ảnh hoặc video khác nhé.',
    chooseOther: 'Chọn ảnh khác',
    processingImage: 'Đang xử lý ảnh…',
  },
  support: {
    title: 'Ủng hộ tôi',
    text: 'Nếu bạn thích khu vườn nhỏ này, có thể mời mình một ly cà phê nha ☕🌱',
    qrAlt: 'Mã QR chuyển khoản TPBank',
    hint: 'Lưu mã QR rồi mở trong app ngân hàng để quét.',
    saveQr: 'Lưu mã QR',
    paypal: 'Ủng hộ qua PayPal',
    saveFailed: 'Không lưu được mã QR, thử chụp màn hình nhé.',
  },
};

export type Messages = typeof vi;
