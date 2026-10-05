import { deleteSetting, getSetting, setSetting } from '../../../src/db/settings';
import { firstDayKey, listDaysInRange, oldestCreatedAt } from '../../../src/db/queries';
import { makeDay, makeDb } from '../helpers';
import { SCHEMA_VERSION } from '../../../src/db/db';

describe('db', () => {
  it('lưu và đọc settings, kể cả ArrayBuffer', async () => {
    const db = makeDb();
    expect(await getSetting(db, 'calendarBg')).toBeUndefined();
    await setSetting(db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([1, 2, 3]).buffer });
    const bg = await getSetting(db, 'calendarBg');
    expect(bg?.mime).toBe('image/jpeg');
    expect([...new Uint8Array(bg!.data)]).toEqual([1, 2, 3]);
    await deleteSetting(db, 'calendarBg');
    expect(await getSetting(db, 'calendarBg')).toBeUndefined();
  });

  it('listDaysInRange bao gồm cả hai đầu', async () => {
    const db = makeDb();
    await db.days.bulkPut(['2026-09-30', '2026-10-01', '2026-10-31', '2026-11-01'].map((date) => makeDay({ date })));
    const days = await listDaysInRange(db, '2026-10-01', '2026-10-31');
    expect(days.map((d) => d.date)).toEqual(['2026-10-01', '2026-10-31']);
  });

  it('firstDayKey và oldestCreatedAt', async () => {
    const db = makeDb();
    expect(await firstDayKey(db)).toBeNull();
    expect(await oldestCreatedAt(db)).toBeNull();
    await db.days.bulkPut([makeDay({ date: '2026-10-05', createdAt: 500 }), makeDay({ date: '2026-10-02', createdAt: 200 })]);
    expect(await firstDayKey(db)).toBe('2026-10-02');
    expect(await oldestCreatedAt(db)).toBe(200);
  });
});

describe('DB v5: bảng nhắc việc', () => {
  it('SCHEMA_VERSION là 5 và lưu/đọc được việc nhắc', async () => {
    expect(SCHEMA_VERSION).toBe(5);
    const db = makeDb();
    await db.reminders.put({ id: 'r1', text: 'Mua quà', autoToday: false, doneAt: null, createdAt: 1, updatedAt: 1 });
    expect((await db.reminders.get('r1'))?.text).toBe('Mua quà');
  });
});
