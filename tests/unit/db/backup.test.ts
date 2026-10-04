import {
  BACKUP_FORMAT, BACKUP_REMIND_AFTER_MS, backupFileName, base64ToBytes, bytesToBase64, createBackup,
  needsBackupReminder, parseBackup, restoreBackup, serializeBackup,
} from '../../../src/db/backup';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDb } from '../helpers';

const tpl = (id: string, isDefault: boolean, updatedAt: number) => ({
  id, name: id, items: [{ text: 'x', period: 'morning' as const }], isDefault, createdAt: 1, updatedAt,
});

async function seeded() {
  const db = makeDb();
  await db.days.bulkPut([
    makeDay({ date: '2026-10-01', note: 'một', updatedAt: 10 }),
    makeDay({ date: '2026-10-02', todos: [{ id: 't', text: 'A', done: true, doneAt: 5, order: 0, period: 'evening' }], finalStage: 'bloom', updatedAt: 20 }),
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

describe('file sao lưu phiên bản 1 (chưa có buổi)', () => {
  it('việc và mẫu cũ được xếp vào buổi sáng khi khôi phục', async () => {
    const r = parseBackup(JSON.stringify({
      format: BACKUP_FORMAT, schemaVersion: 1, exportedAt: 1, calendarBg: null,
      days: [{ ...makeDay({ date: '2026-10-01' }), todos: [{ id: 'a', text: 'Cũ', done: false, doneAt: null, order: 0 }] }],
      templates: [{ id: 't', name: 'Mẫu', items: ['A'], isDefault: true, createdAt: 1, updatedAt: 1 }],
    }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.backup.days[0].todos[0].period).toBe('morning');
    expect(r.backup.templates[0].items).toEqual([{ text: 'A', period: 'morning' }]);
  });

  it('file mới ghi schemaVersion hiện tại (3)', async () => {
    expect((await createBackup(makeDb(), 1)).schemaVersion).toBe(4);
  });
});

describe('sao lưu việc đã lên lịch', () => {
  const planned = { id: 'p1', date: '2026-10-09', text: 'Khám răng', period: 'afternoon' as const, createdAt: 5 };

  it('sao lưu rồi khôi phục giữ việc đã lên lịch', async () => {
    const src = makeDb();
    await src.planned.put(planned);
    const backup = await createBackup(src, 1);
    expect(backup.schemaVersion).toBe(4);
    const r = parseBackup(serializeBackup(backup));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const dst = makeDb();
    await dst.planned.put({ ...planned, id: 'cu', text: 'Sẽ bị xoá khi thay thế' });
    await restoreBackup(dst, r.backup, 'replace');
    expect(await dst.planned.toArray()).toEqual([planned]);
  });

  it('gộp: thêm việc đã lên lịch chưa có, giữ việc của máy', async () => {
    const src = makeDb();
    await src.planned.put(planned);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await dst.planned.put({ ...planned, id: 'may', text: 'Của máy' });
    await restoreBackup(dst, r.backup, 'merge');
    expect((await dst.planned.toArray()).map((p) => p.id).sort()).toEqual(['may', 'p1']);
  });

  it('file cũ không có việc đã lên lịch vẫn khôi phục được', () => {
    const r = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 2, exportedAt: 1, days: [], templates: [], calendarBg: null }));
    expect(r.ok && r.backup.planned).toEqual([]);
  });
});

describe('sao lưu mục tiêu ngày tương lai', () => {
  it('khôi phục giữ mục tiêu; file cũ không có thì coi là rỗng', async () => {
    const src = makeDb();
    await src.plannedGoals.put({ date: '2026-10-09', title: 'Đi khám răng' });
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await dst.plannedGoals.toArray()).toEqual([{ date: '2026-10-09', title: 'Đi khám răng' }]);
    const old = parseBackup(JSON.stringify({ format: BACKUP_FORMAT, schemaVersion: 3, exportedAt: 1, days: [], templates: [], planned: [], calendarBg: null }));
    expect(old.ok && old.backup.plannedGoals).toEqual([]);
  });
});

describe('sao lưu kiểu hình nền lịch', () => {
  it('giữ calendarTheme khi khôi phục', async () => {
    const src = makeDb();
    await setSetting(src, 'calendarTheme', 'cat');
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'calendarTheme')).toBe('cat');
  });
});

describe('sao lưu nền mới', () => {
  it('nhận calendarTheme rain và gamer', async () => {
    for (const theme of ['rain', 'gamer'] as const) {
      const src = makeDb();
      await setSetting(src, 'calendarTheme', theme);
      const r = parseBackup(serializeBackup(await createBackup(src, 1)));
      expect(r.ok && r.backup.calendarTheme).toBe(theme);
    }
  });
});

describe('sao lưu công tắc nút hình nền', () => {
  it('giữ showCalendarBgButton khi khôi phục', async () => {
    const src = makeDb();
    await setSetting(src, 'showCalendarBgButton', false);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'showCalendarBgButton')).toBe(false);
  });
});

describe('sao lưu công tắc chấm ghi chú', () => {
  it('giữ showNoteDot khi khôi phục (thay thế và gộp)', async () => {
    const src = makeDb();
    await setSetting(src, 'showNoteDot', false);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'showNoteDot')).toBe(false);
    const dst2 = makeDb();
    await restoreBackup(dst2, r.backup, 'merge');
    expect(await getSetting(dst2, 'showNoteDot')).toBe(false);
  });
});

describe('sao lưu công tắc cây nói ghi chú', () => {
  it('giữ plantSaysNote khi khôi phục (thay thế và gộp)', async () => {
    const src = makeDb();
    await setSetting(src, 'plantSaysNote', true);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'plantSaysNote')).toBe(true);
    const dst2 = makeDb();
    await restoreBackup(dst2, r.backup, 'merge');
    expect(await getSetting(dst2, 'plantSaysNote')).toBe(true);
  });
});

describe('sao lưu công tắc Khu vườn', () => {
  it('giữ gardenOnlyPlanted khi khôi phục', async () => {
    const src = makeDb();
    await setSetting(src, 'gardenOnlyPlanted', true);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'gardenOnlyPlanted')).toBe(true);
  });
});

describe('sao lưu công tắc tách riêng cây đặc biệt', () => {
  it('giữ gardenSeparateSpecial khi khôi phục', async () => {
    const src = makeDb();
    await setSetting(src, 'gardenSeparateSpecial', true);
    const r = parseBackup(serializeBackup(await createBackup(src, 1)));
    if (!r.ok) throw new Error(r.error);
    const dst = makeDb();
    await restoreBackup(dst, r.backup, 'replace');
    expect(await getSetting(dst, 'gardenSeparateSpecial')).toBe(true);
  });
});
