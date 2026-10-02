import { z } from 'zod';
import { SCHEMA_VERSION, type PlantDB } from './db';
import { deleteSetting, getSetting, setSetting } from './settings';
import { GROWTH_STAGES } from '../domain/growth';
import { formatDate } from '../domain/dayKey';

export const BACKUP_FORMAT = 'chau-cay-chibi-backup';
export const BACKUP_REMIND_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean(),
  doneAt: z.number().nullable(),
  order: z.number(),
});

const DaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plantId: z.string(),
  potId: z.string(),
  specialId: z.string().nullable(),
  isRestDay: z.boolean(),
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
  items: z.array(z.string()),
  isDefault: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const BackupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.number(),
  days: z.array(DaySchema),
  templates: z.array(TemplateSchema),
  calendarBg: z.object({ mime: z.string(), base64: z.string() }).nullable(),
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
  return db.transaction('r', db.days, db.templates, db.settings, async () => {
    const days = await db.days.orderBy('date').toArray();
    const templates = await db.templates.orderBy('createdAt').toArray();
    const bg = await getSetting(db, 'calendarBg');
    return {
      format: BACKUP_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: now,
      days,
      templates,
      calendarBg: bg ? { mime: bg.mime, base64: bytesToBase64(bg.data) } : null,
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
    return { ok: false, error: 'Đây không phải file sao lưu của Chậu Cây Chibi.' };
  }
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  if (typeof version === 'number' && version > SCHEMA_VERSION) {
    return { ok: false, error: 'File sao lưu được tạo từ phiên bản app mới hơn. Hãy cập nhật app rồi thử lại.' };
  }
  const result = BackupSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { ok: false, error: `File sao lưu bị lỗi ở "${issue.path.join('.')}": ${issue.message}` };
  }
  return { ok: true, backup: result.data };
}

export async function restoreBackup(db: PlantDB, backup: BackupFile, mode: RestoreMode): Promise<{ days: number; templates: number }> {
  const bg = backup.calendarBg ? { mime: backup.calendarBg.mime, data: base64ToBytes(backup.calendarBg.base64) } : null;
  return db.transaction('rw', db.days, db.templates, db.settings, async () => {
    let days = 0;
    let templates = 0;
    if (mode === 'replace') {
      await db.days.clear();
      await db.templates.clear();
      await db.days.bulkPut(backup.days);
      await db.templates.bulkPut(backup.templates);
      if (bg) await setSetting(db, 'calendarBg', bg);
      else await deleteSetting(db, 'calendarBg');
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
      if (bg && !(await getSetting(db, 'calendarBg'))) await setSetting(db, 'calendarBg', bg);
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
