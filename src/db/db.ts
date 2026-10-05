import Dexie, { type EntityTable } from 'dexie';
import type { DayRecord, PlannedGoal, PlannedTodo, Reminder, Template } from '../domain/types';

export const SCHEMA_VERSION = 5;

export interface SettingRow {
  key: string;
  value: unknown;
}

export class PlantDB extends Dexie {
  days!: EntityTable<DayRecord, 'date'>;
  templates!: EntityTable<Template, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;
  planned!: EntityTable<PlannedTodo, 'id'>;
  plannedGoals!: EntityTable<PlannedGoal, 'date'>;
  reminders!: EntityTable<Reminder, 'id'>;

  constructor(name = 'chau-cay-chibi') {
    super(name);
    // Khi đổi cấu trúc: thêm this.version(N+1).stores(...).upgrade(...) — KHÔNG sửa các version cũ.
    this.version(1).stores({
      days: 'date',
      templates: 'id, createdAt',
      settings: 'key',
    });
    // v2: việc và mẫu có buổi (sáng/chiều/tối); dữ liệu cũ được xếp vào buổi sáng.
    this.version(2)
      .stores({ days: 'date', templates: 'id, createdAt', settings: 'key' })
      .upgrade(async (tx) => {
        await tx
          .table('days')
          .toCollection()
          .modify((day: { todos: { period?: string }[] }) => {
            for (const todo of day.todos) todo.period ??= 'morning';
          });
        await tx
          .table('templates')
          .toCollection()
          .modify((t: { items: unknown[] }) => {
            t.items = t.items.map((item) => (typeof item === 'string' ? { text: item, period: 'morning' } : item));
          });
      });
    // v3: bảng việc đã lên lịch cho ngày tương lai.
    this.version(3).stores({ days: 'date', templates: 'id, createdAt', settings: 'key', planned: 'id, date' });
    // v4: bảng mục tiêu đặt trước cho ngày tương lai.
    this.version(4).stores({ days: 'date', templates: 'id, createdAt', settings: 'key', planned: 'id, date', plannedGoals: 'date' });
    // v5: bảng việc nhắc (việc dài hạn, màn Nhắc việc).
    this.version(5).stores({ days: 'date', templates: 'id, createdAt', settings: 'key', planned: 'id, date', plannedGoals: 'date', reminders: 'id' });
  }
}

export const db = new PlantDB();
