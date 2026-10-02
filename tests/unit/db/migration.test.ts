import Dexie from 'dexie';
import { PlantDB } from '../../../src/db/db';

describe('nâng cấp dữ liệu từ phiên bản 1', () => {
  it('việc và mẫu cũ được xếp vào buổi sáng', async () => {
    const name = `test-mig-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(1).stores({ days: 'date', templates: 'id, createdAt', settings: 'key' });
    await old.table('days').put({
      date: '2026-10-01', plantId: 'corn', potId: 'rattan', specialId: null, isRestDay: false, greetedAt: 1, note: '',
      todos: [{ id: 'a', text: 'Việc cũ', done: true, doneAt: 1, order: 0 }], finalStage: 'bloom', createdAt: 1, updatedAt: 1,
    });
    await old.table('templates').put({ id: 't', name: 'Mẫu cũ', items: ['Tập thể dục', 'Ăn sáng'], isDefault: true, createdAt: 1, updatedAt: 1 });
    old.close();

    const db = new PlantDB(name);
    expect((await db.days.get('2026-10-01'))!.todos[0]).toMatchObject({ text: 'Việc cũ', period: 'morning' });
    expect((await db.templates.get('t'))!.items).toEqual([
      { text: 'Tập thể dục', period: 'morning' },
      { text: 'Ăn sáng', period: 'morning' },
    ]);
  });
});

describe('nâng cấp dữ liệu từ phiên bản 2', () => {
  it('giữ nguyên dữ liệu cũ và có bảng việc đã lên lịch', async () => {
    const name = `test-mig2-${crypto.randomUUID()}`;
    const old = new Dexie(name);
    old.version(2).stores({ days: 'date', templates: 'id, createdAt', settings: 'key' });
    await old.table('days').put({
      date: '2026-10-01', plantId: 'corn', potId: 'rattan', specialId: null, isRestDay: false, greetedAt: 1, note: 'giữ',
      todos: [{ id: 'a', text: 'Việc', done: false, doneAt: null, order: 0, period: 'evening' }], finalStage: 'seed', createdAt: 1, updatedAt: 1,
    });
    old.close();
    const db = new PlantDB(name);
    expect((await db.days.get('2026-10-01'))!.note).toBe('giữ');
    await db.planned.put({ id: 'p', date: '2026-10-09', text: 'Mới', period: 'morning', createdAt: 1 });
    expect(await db.planned.where('date').equals('2026-10-09').count()).toBe(1);
  });
});
