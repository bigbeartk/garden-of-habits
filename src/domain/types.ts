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
}

export interface DayRecord {
  /** 'YYYY-MM-DD' theo mốc 4:00 sáng */
  date: string;
  plantId: string;
  potId: string;
  specialId: string | null;
  isRestDay: boolean;
  /** tiêu đề do người dùng đặt cho ngày; bản ghi cũ (trước khi có tính năng) không có trường này */
  title?: string;
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

export interface CalendarBg {
  mime: string;
  data: ArrayBuffer;
}

/** Phần dữ liệu nội dung mà tầng domain cần (không phụ thuộc React). */
export interface Catalog {
  plants: { id: string; defaultPotId: string }[];
  potIds: string[];
  specials: { id: string; weight: number }[];
}
