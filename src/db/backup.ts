import { z } from 'zod';
import { SCHEMA_VERSION, type PlantDB } from './db';
import { deleteSetting, getSetting, setSetting, BOOLEAN_SETTINGS, type BooleanSetting } from './settings';
import { GROWTH_STAGES } from '../domain/growth';
import { PERIODS } from '../domain/period';
import { formatDate } from '../domain/dayKey';

export const BACKUP_FORMAT = 'chau-cay-chibi-backup';
export const BACKUP_REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  doneAt: z.number().nullable(),
  order: z.number(),
  period: z.enum(PERIODS).default('morning'), // file phiên bản 1 chưa có buổi
});

const DaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plantId: z.string(),
  potId: z.string(),
  specialId: z.string().nullable(),
  styleId: z.string().optional(), // dáng cây; file cũ chưa có
  isRestDay: z.boolean(),
  title: z.string().optional(),
  speech: z.string().optional(), // file cũ chưa có
  greetedAt: z.number().nullable(),
  note: z.string(),
  todos: z.array(TodoSchema),
  finalStage: z.enum(GROWTH_STAGES),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(
    z.union([
      z.string().transform((text) => ({ text, period: 'morning' as const })), // file phiên bản 1
      z.object({ text: z.string(), period: z.enum(PERIODS) }),
    ]),
  ),
  isDefault: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const PlannedSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  text: z.string(),
  period: z.enum(PERIODS),
  createdAt: z.number(),
});

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.number(),
  days: z.array(DaySchema),
  templates: z.array(TemplateSchema),
  planned: z.array(PlannedSchema).default([]), // file phiên bản 1–2 chưa có
  plannedGoals: z.array(z.object({ date: z.string(), title: z.string() })).default([]), // file phiên bản 1–3 chưa có
  calendarBg: z.object({ mime: z.string(), base64: z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/) }).nullable(),
  calendarTheme: z.enum(['default', 'cat', 'grass', 'rain', 'gamer', 'photo']).optional(), // file cũ chưa có
  // các công tắc bật/tắt (BOOLEAN_SETTINGS); file cũ có thể chưa có
  showCalendarBgButton: z.boolean().optional(),
  showNoteDot: z.boolean().optional(),
  showPlantSpeech: z.boolean().optional(),
  gardenOnlyPlanted: z.boolean().optional(),
  gardenSeparateSpecial: z.boolean().optional(),
  unlockedSpecials: z.array(z.string()).optional(), // cây đặc biệt đã mở khoá; file cũ chưa có
  unlockedStyles: z.array(z.string()).optional(), // dáng cây đã mở khoá; file cũ chưa có
});

export type BackupFile = z.infer<typeof BackupSchema>;
export type ParseResult = { ok: true; backup: BackupFile } | { ok: false; error: string };
export type RestoreMode = 'replace' | 'merge';

export function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export async function createBackup(db: PlantDB, now: number): Promise<BackupFile> {
  return db.transaction('r', [db.days, db.templates, db.settings, db.planned, db.plannedGoals], async () => {
    const days = await db.days.orderBy('date').toArray();
    const templates = await db.templates.orderBy('createdAt').toArray();
    const planned = await db.planned.orderBy('date').toArray();
    const plannedGoals = await db.plannedGoals.toArray();
    const bg = await getSetting(db, 'calendarBg');
    const calendarTheme = await getSetting(db, 'calendarTheme');
    const unlockedSpecials = await getSetting(db, 'unlockedSpecials');
    const unlockedStyles = await getSetting(db, 'unlockedStyles');
    const switches: Partial<Record<BooleanSetting, boolean>> = {};
    for (const key of BOOLEAN_SETTINGS) {
      const v = await getSetting(db, key);
      if (v !== undefined) switches[key] = v;
    }
    return {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now,
      days,
      templates,
      planned,
      plannedGoals,
      calendarBg: bg ? { mime: bg.mime, base64: bytesToBase64(bg.data) } : null,
      ...(calendarTheme ? { calendarTheme } : {}),
      ...(unlockedSpecials ? { unlockedSpecials } : {}),
      ...(unlockedStyles ? { unlockedStyles } : {}),
      ...switches,
    };
  });
}

export function serializeBackup(backup: BackupFile): string {
  return JSON.stringify(backup);
}

export function backupFileName(date: Date): string {
  return `chau-cay-backup-${formatDate(date)}.json`;
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File không phải JSON hợp lệ.' };
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Đây không phải file sao lưu của Garden of Habits.' };
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, error: 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.' };
  }
  const result = BackupSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "${issue.path.join(".")}").` };
  }
  return { ok: true, backup: result.data };
}

export async function restoreBackup(db: PlantDB, backup: BackupFile, mode: RestoreMode): Promise<{ days: number; templates: number }> {
  const bg = backup.calendarBg ? { mime: backup.calendarBg.mime, data: base64ToBytes(backup.calendarBg.base64) } : null;
  return db.transaction('rw', [db.days, db.templates, db.settings, db.planned, db.plannedGoals], async () => {
    let days = 0;
    let templates = 0;
    if (mode === 'replace') {
      await db.days.clear();
      await db.templates.clear();
      await db.planned.clear();
      await db.plannedGoals.clear();
      await db.days.bulkPut(backup.days);
      await db.templates.bulkPut(backup.templates);
      await db.planned.bulkPut(backup.planned);
      await db.plannedGoals.bulkPut(backup.plannedGoals);
      if (bg) await setSetting(db, 'calendarBg', bg);
      else await deleteSetting(db, 'calendarBg');
      if (backup.calendarTheme) await setSetting(db, 'calendarTheme', backup.calendarTheme);
      else await deleteSetting(db, 'calendarTheme');
      if (backup.unlockedSpecials) await setSetting(db, 'unlockedSpecials', backup.unlockedSpecials);
      else await deleteSetting(db, 'unlockedSpecials');
      if (backup.unlockedStyles) await setSetting(db, 'unlockedStyles', backup.unlockedStyles);
      else await deleteSetting(db, 'unlockedStyles');
      for (const key of BOOLEAN_SETTINGS) {
        const v = backup[key];
        if (v !== undefined) await setSetting(db, key, v);
        else await deleteSetting(db, key);
      }
      days = backup.days.length;
      templates = backup.templates.length;
    } else {
      for (const d of backup.days) {
        const cur = await db.days.get(d.date);
        if (!cur || d.updatedAt > cur.updatedAt) {
          await db.days.put(d);
          days++;
        }
      }
      for (const t of backup.templates) {
        const cur = await db.templates.get(t.id);
        if (!cur || t.updatedAt > cur.updatedAt) {
          await db.templates.put(t);
          templates++;
        }
      }
      for (const p of backup.planned) {
        if (!(await db.planned.get(p.id))) await db.planned.put(p);
      }
      for (const g of backup.plannedGoals) {
        if (!(await db.plannedGoals.get(g.date))) await db.plannedGoals.put(g);
      }
      if (bg && !(await getSetting(db, 'calendarBg'))) await setSetting(db, 'calendarBg', bg);
      if (backup.calendarTheme && !(await getSetting(db, 'calendarTheme'))) await setSetting(db, 'calendarTheme', backup.calendarTheme);
      if (backup.unlockedSpecials) {
        const mine = (await getSetting(db, 'unlockedSpecials')) ?? [];
        await setSetting(db, 'unlockedSpecials', [...new Set([...mine, ...backup.unlockedSpecials])]);
      }
      if (backup.unlockedStyles) {
        const mine = (await getSetting(db, 'unlockedStyles')) ?? [];
        await setSetting(db, 'unlockedStyles', [...new Set([...mine, ...backup.unlockedStyles])]);
      }
      for (const key of BOOLEAN_SETTINGS) {
        const v = backup[key];
        if (v !== undefined && (await getSetting(db, key)) === undefined) await setSetting(db, key, v);
      }
    }
    const defaults = (await db.templates.toArray())
      .filter((t) => t.isDefault)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    for (const t of defaults.slice(1)) await db.templates.put({ ...t, isDefault: false });
    return { days, templates };
  });
}

export function needsBackupReminder(lastBackupAt: number | null, oldestDataAt: number | null, now: number): boolean {
  if (oldestDataAt === null) return false;
  const reference = lastBackupAt ?? oldestDataAt;
  return now - reference > BACKUP_REMIND_AFTER_MS;
}
