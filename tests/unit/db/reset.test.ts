import { dataSummary, resetAllData } from '../../../src/db/reset';
import { getSetting, setSetting } from '../../../src/db/settings';
import { makeDay, makeDb } from '../helpers';

async function seeded() {
  const db = makeDb();
  await db.days.bulkPut([makeDay({ date: '2026-10-01' }), makeDay({ date: '2026-10-02' })]);
  await db.templates.put({ id: 't', name: 'Sáng', items: [], isDefault: true, createdAt: 1, updatedAt: 1 });
  await db.planned.put({ id: 'p', date: '2026-10-09', text: 'Đi khám', period: 'morning', createdAt: 1 });
  await db.plannedGoals.put({ date: '2026-10-09', title: 'Khoẻ' });
  await db.reminders.put({ id: 'r', text: 'Mua quà', autoToday: false, doneAt: null, createdAt: 1, updatedAt: 1 });
  await db.habits.put({ id: 'h1', name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [1], order: 0, startDate: '2026-10-01', createdAt: 1, updatedAt: 1 });
  await setSetting(db, 'language', 'en');
  await setSetting(db, 'calendarTheme', 'cat');
  await setSetting(db, 'unlockedStyles', ['sunflower|mini']);
  await setSetting(db, 'lastBackupAt', 5);
  return db;
}

describe('resetAllData', () => {
  it('xoá sạch ngày, mẫu, việc đã lên lịch, mục tiêu đặt trước, việc nhắc và mọi cài đặt', async () => {
    const db = await seeded();
    await resetAllData(db);
    expect(await db.days.count()).toBe(0);
    expect(await db.templates.count()).toBe(0);
    expect(await db.planned.count()).toBe(0);
    expect(await db.plannedGoals.count()).toBe(0);
    expect(await db.reminders.count()).toBe(0);
    expect(await getSetting(db, 'calendarTheme')).toBeUndefined();
    expect(await getSetting(db, 'unlockedStyles')).toBeUndefined();
    expect(await getSetting(db, 'lastBackupAt')).toBeUndefined();
  });

  it('giữ lại ngôn ngữ đang dùng', async () => {
    const db = await seeded();
    await resetAllData(db);
    expect(await getSetting(db, 'language')).toBe('en');
    expect(await db.settings.count()).toBe(1);
  });

  it('chưa từng chọn ngôn ngữ thì không tự đặt', async () => {
    const db = makeDb();
    await db.days.put(makeDay({ date: '2026-10-01' }));
    await resetAllData(db);
    expect(await db.settings.count()).toBe(0);
  });
});

describe('dataSummary', () => {
  it('đếm những gì sẽ mất', async () => {
    const db = await seeded();
    expect(await dataSummary(db)).toEqual({ days: 2, templates: 1, reminders: 1, planned: 1, habits: 1 });
  });
});

describe('resetAllData: thói quen', () => {
  it('xoá cả thói quen và lần tick', async () => {
    const db = makeDb();
    await db.habits.add({ id: 'h1', name: 'x', icon: '💧', color: 'sky', weekdays: [1], order: 0, startDate: '2026-10-01', createdAt: 1, updatedAt: 1 });
    await db.habitChecks.add({ habitId: 'h1', date: '2026-10-02', at: 1 });
    await resetAllData(db);
    expect(await db.habits.count()).toBe(0);
    expect(await db.habitChecks.count()).toBe(0);
  });
});
