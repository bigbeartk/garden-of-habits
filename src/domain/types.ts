import type { GrowthStage } from './growth';

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  doneAt: number | null;
  order: number;
}

export interface DayRecord {
  /** 'YYYY-MM-DD' theo mốc 4:00 sáng */
  date: string;
  plantId: string;
  potId: string;
  specialId: string | null;
  isRestDay: boolean;
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
  items: string[];
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
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
