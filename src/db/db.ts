import Dexie, { type EntityTable } from 'dexie';
import type { DayRecord, Template } from '../domain/types';

export const SCHEMA_VERSION = 1;

export interface SettingRow {
  key: string;
  value: unknown;
}

export class PlantDB extends Dexie {
  days!: EntityTable<DayRecord, 'date'>;
  templates!: EntityTable<Template, 'id'>;
  settings!: EntityTable<SettingRow, 'key'>;

  constructor(name = 'chau-cay-chibi') {
    super(name);
    // Khi đổi cấu trúc: thêm this.version(2).stores(...).upgrade(...) — KHÔNG sửa version(1).
    this.version(SCHEMA_VERSION).stores({
      days: 'date',
      templates: 'id, createdAt',
      settings: 'key',
    });
  }
}

export const db = new PlantDB();
