import {
  BACKUP_FORMAT, BACKUP_REMIND_AFTER_MS, backupFileName, base64ToBytes, bytesToBase64, createBackup,
  needsBackupReminder, parseBackup, restoreBackup, serializeBackup,
} from '../../../src/db/backup';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDb } from '../helpers';

const tpl = (id: string, isDefault: boolean, updatedAt: number) => ({
  id, name: id, items: ['x'], isDefault, createdAt: 1, updatedAt,
});

async function seeded() {
  const db = makeDb();
  await db.days.bulkPut([
    makeDay({ date: '2026-10-01', note: 'một', updatedAt: 10 }),
    makeDay({ date: '2026-10-02', todos: [{ id: 't', text: 'A', done: true, doneAt: 5, order: 0 }], finalStage: 'bloom', updatedAt: 20 }),
  ]);
  await db.templates.put(tpl('sang', true, 3));
  await setSetting(db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([9, 8, 7]).buffer });
  return db;
}

describe('backup', () => {
  it('base64 khứ hồi', () => {
    const bytes = new Uint8Array(70000).map((_, i) => i % 256);
    expect([...new Uint8Array(base64ToBytes(bytesToBase64(bytes.buffer)))]).toEqual([...bytes]);
  });

  it('sao lưu rồi khôi phục (thay thế) ra dữ liệu giống hệt', async () => {
    const src = await seeded();
    const text = serializeBackup(await createBackup(src, 1000));
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const dst = makeDb();
    await dst.days.put(makeDay({ date: '2020-01-01' }));
    const res = await restoreBackup(dst, parsed.backup, 'replace');
    expect(res).toEqual({ days: 2, templates: 1 });
    expect(await dst.days.toArray()).toEqual(await src.days.toArray());
    expect(await dst.templates.toArray()).toEqual(await src.templates.toArray());
    expect([...new Uint8Array((await getSetting(dst, 'calendarBg'))!.data)]).toEqual([9, 8, 7]);
  });

  it('parseBackup: JSON hỏng', () => {
    expect(parseBackup('{oops')).toEqual({ ok: false, error: 'File không phải JSON hợp lệ.' });
  });

  it('parseBackup: file không phải của app', () => {
    const r = parseBackup(JSON.stringify({ hello: 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('không phải file sao lưu');
  });

  it('parseBackup: phiên bản mới hơn', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 999 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('phiên bản app mới hơn');
  });

  it('parseBackup: thiếu trường thì báo vị trí lỗi', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, days: [{ date: 'x' }], templates: [], calendarBg: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('days.0');
  });

  it('gộp: bản mới hơn thắng, giữ dữ liệu chỉ có ở máy', async () => {
    const src = await seeded();
    const backup = await createBackup(src, 1000);
    const dst = makeDb();
    await dst.days.bulkPut([
      makeDay({ date: '2026-10-01', note: 'mới hơn ở máy', updatedAt: 99 }),
      makeDay({ date: '2026-10-02', note: 'cũ ở máy', updatedAt: 1 }),
      makeDay({ date: '2026-09-30', note: 'chỉ ở máy' }),
    ]);
    const res = await restoreBackup(dst, backup, 'merge');
    expect(res).toEqual({ days: 1, templates: 1 });
    expect((await dst.days.get('2026-10-01'))!.note).toBe('mới hơn ở máy');
    expect((await dst.days.get('2026-10-02'))!.finalStage).toBe('bloom');
    expect((await dst.days.get('2026-09-30'))!.note).toBe('chỉ ở máy');
  });

  it('gộp: chỉ còn một mẫu mặc định (mẫu sửa gần nhất)', async () => {
    const src = makeDb();
    await src.templates.put(tpl('tu-file', true, 50));
    const backup = await createBackup(src, 1000);
    const dst = makeDb();
    await dst.templates.put(tpl('o-may', true, 10));
    await restoreBackup(dst, backup, 'merge');
    const defaults = (await dst.templates.toArray()).filter((t) => t.isDefault).map((t) => t.id);
    expect(defaults).toEqual(['tu-file']);
  });

  it('backupFileName', () => {
    expect(backupFileName(new Date(2026, 9, 2))).toBe('chau-cay-backup-2026-10-02.json');
  });

  it('needsBackupReminder', () => {
    const now = 100 * BACKUP_REMIND_AFTER_MS;
    expect(needsBackupReminder(null, null, now)).toBe(false);
    expect(needsBackupReminder(null, now - BACKUP_REMIND_AFTER_MS - 1, now)).toBe(true);
    expect(needsBackupReminder(now - 1000, now - 10 * BACKUP_REMIND_AFTER_MS, now)).toBe(false);
    expect(needsBackupReminder(now - BACKUP_REMIND_AFTER_MS - 1, 0, now)).toBe(true);
  });
});

describe('parseBackup báo lỗi tiếng Việt', () => {
  it('trường sai kiểu không lộ thông báo tiếng Anh của zod', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, days: 'x', templates: [], calendarBg: null }));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe('File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "days").');
    }
  });

  it('ảnh nền hỏng bị phát hiện ngay khi đọc file', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, days: [], templates: [], calendarBg: { mime: 'image/jpeg', base64: '%%%không phải base64%%%' } }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('File sao lưu bị hỏng hoặc thiếu dữ liệu (ở "calendarBg.base64").');
  });
});

describe('tương thích file sao lưu cũ', () => {
  it('ngày không có trường title (bản app cũ) vẫn khôi phục được', async () => {
    const day = makeDay({ date: '2026-10-01', note: 'cũ' }) as unknown as Record<string, unknown>;
    delete day.title;
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, days: [day], templates: [], calendarBg: null }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const db = makeDb();
    await restoreBackup(db, r.backup, 'replace');
    expect((await db.days.get('2026-10-01'))!.note).toBe('cũ');
  });

  it('tiêu đề được giữ khi sao lưu rồi khôi phục', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-10-01', title: 'Ngày đẹp' }));
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    expect(r.ok && r.backup.days[0].title).toBe('Ngày đẹp');
  });
});
