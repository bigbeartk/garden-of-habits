import type { GrowthStage } from './growth';
import type { Period } from './period';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: number | null;
  order: number;
  /** buổi của việc: sáng / chiều / tối */
  period: Period;
  /** việc đến từ màn Nhắc việc (id của `Reminder`); không có = việc thường */
  reminderId?: string;
}

/** Id dáng gốc của mọi loài (dáng luôn có, không cần mở khoá). */
export const BASE_STYLE_ID = 'base';

export interface DayRecord {
  /** 'YYYY-MM-DD' theo mốc 4:00 sáng */
  date: string;
  plantId: string;
  potId: string;
  specialId: string | null;
  /** dáng cây của ngày; không có (bản ghi cũ) = 'base' */
  styleId?: string;
  isRestDay: boolean;
  /** tiêu đề do người dùng đặt cho ngày; bản ghi cũ (trước khi có tính năng) không có trường này */
  title?: string;
  /** câu cây nói cả ngày (chọn ngẫu nhiên lần đầu mở Hôm nay, sửa được); bản ghi cũ không có → chọn khi mở. Rỗng = không nói */
  speech?: string;
  greetedAt: number | null;
  note: string;
  /** luôn được lưu theo thứ tự `order` tăng dần */
  todos: Todo[];
  finalStage: GrowthStage;
  createdAt: number;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  items: TemplateItem[];
  isDefault: boolean;
  /** thứ trong tuần (0 = CN … 6 = T7, như getDay) mà mẫu tự thêm vào ngày mới; không có = không tự thêm */
  weekdays?: number[];
  createdAt: number;
  updatedAt: number;
}

export interface TemplateItem {
  text: string;
  period: Period;
}

/** Việc đã lên lịch cho một ngày tương lai; đến ngày đó sẽ được chuyển vào danh sách todo. */
export interface PlannedTodo {
  id: string;
  /** 'YYYY-MM-DD', luôn sau hôm nay lúc tạo */
  date: string;
  text: string;
  period: Period;
  createdAt: number;
}

/** Mục tiêu đặt trước cho một ngày tương lai; đến ngày đó thành `DayRecord.title`. */
export interface PlannedGoal {
  date: string;
  title: string;
}

/** Việc dài hạn ở màn Nhắc việc; bật `autoToday` thì mỗi ngày tự vào buổi Sáng của hôm nay cho tới khi xong. */
export interface Reminder {
  id: string;
  text: string;
  /** công tắc "Hôm nay" */
  autoToday: boolean;
  /** ms; null = chưa xong */
  doneAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** 8 màu pastel của thói quen; mã hex ở content/habits.ts */
export type HabitColor = 'peach' | 'mint' | 'butter' | 'lavender' | 'sky' | 'rose' | 'sage' | 'cocoa';

/** Thói quen: điểm danh riêng, không phải todo, không làm cây lớn. */
export interface Habit {
  id: string;
  name: string;
  icon: string;          // emoji do người dùng chọn (HABIT_ICONS)
  color: HabitColor;
  weekdays: number[];    // 0 = CN … 6 = T7, đã cleanWeekdays, không rỗng
  order: number;         // thứ tự hiển thị = thứ tự tạo
  startDate: string;     // dayKey lúc tạo; ngày trước đó không tính
  pauses?: HabitPause[]; // các khoảng đã dừng, theo thứ tự; không có = chưa dừng lần nào
  createdAt: number;
  updatedAt: number;
}

/** Khoảng dừng thói quen: từ `from` (tính) tới `to` (không tính, ngày tiếp tục); `to: null` = đang dừng. */
export interface HabitPause { from: string; to: string | null }

/** Có bản ghi = thói quen `habitId` đã làm ngày `date`. */
export interface HabitCheck { habitId: string; date: string; at: number }

/** Khu vườn đang xem cây hay thói quen. */
export type GardenView = 'plants' | 'habits';

/** Kiểu hình nền màn Lịch: mặc định, nền động (mèo vươn vai / cỏ nở) hoặc ảnh người dùng chọn. */
export type CalendarTheme = 'default' | 'cat' | 'dog' | 'grass' | 'rain' | 'gamer' | 'photo';

/** Icon vẽ trên nút menu nổi. */
export type MenuIconKind = 'flower' | 'cat' | 'dog' | 'grass' | 'rain' | 'gamer' | 'heart';
/** Lựa chọn icon nút menu trong Cài đặt: 'auto' = theo hình nền lịch. */
export type MenuIconChoice = 'auto' | MenuIconKind;

export interface CalendarBg {
  mime: string;
  data: ArrayBuffer;
}

/** Phần dữ liệu nội dung mà tầng domain cần (không phụ thuộc React). */
export interface Catalog {
  plants: { id: string; defaultPotId: string; styles?: { id: string; unlockAt: number }[] }[];
  potIds: string[];
  specials: { id: string; weight: number }[];
}
