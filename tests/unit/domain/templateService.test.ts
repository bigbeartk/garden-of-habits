import {
  createTemplate, deleteTemplate, listTemplates, parseItems, setDefaultTemplate, updateTemplate,
} from '../../../src/domain/templateService';
import { makeDb } from '../helpers';

describe('templateService', () => {
  it('parseItems tách dòng, bỏ dòng trống', () => {
    expect(parseItems('  Tập thể dục \r\n\nĂn sáng\n   ')).toEqual(['Tập thể dục', 'Ăn sáng']);
  });

  it('createTemplate làm sạch dữ liệu và từ chối tên rỗng', async () => {
    const db = makeDb();
    const t = await createTemplate(db, '  Buổi sáng ', [{ text: ' A ', period: 'morning' }, { text: '', period: 'morning' }, { text: 'B', period: 'evening' }], 100);
    expect(t).toMatchObject({ name: 'Buổi sáng', items: [{ text: 'A', period: 'morning' }, { text: 'B', period: 'evening' }], isDefault: false, createdAt: 100, updatedAt: 100 });
    await expect(createTemplate(db, '  ', [{ text: 'A', period: 'morning' }], 100)).rejects.toThrow('Tên mẫu không được để trống');
  });

  it('listTemplates theo thứ tự tạo', async () => {
    const db = makeDb();
    await createTemplate(db, 'Hai', [], 200);
    await createTemplate(db, 'Một', [], 100);
    expect((await listTemplates(db)).map((t) => t.name)).toEqual(['Một', 'Hai']);
  });

  it('setDefaultTemplate chỉ giữ một mẫu mặc định và có thể bỏ chọn', async () => {
    const db = makeDb();
    const a = await createTemplate(db, 'A', [], 1);
    const b = await createTemplate(db, 'B', [], 2);
    await setDefaultTemplate(db, a.id, 10);
    await setDefaultTemplate(db, b.id, 11);
    const all = await listTemplates(db);
    expect(all.filter((t) => t.isDefault).map((t) => t.name)).toEqual(['B']);
    await setDefaultTemplate(db, null, 12);
    expect((await listTemplates(db)).some((t) => t.isDefault)).toBe(false);
    await expect(setDefaultTemplate(db, 'missing', 13)).rejects.toThrow('Không tìm thấy mẫu');
  });

  it('updateTemplate và deleteTemplate', async () => {
    const db = makeDb();
    const a = await createTemplate(db, 'A', [{ text: 'x', period: 'morning' }], 1);
    const updated = await updateTemplate(db, a.id, { name: 'A2', items: [{ text: 'y', period: 'afternoon' }, { text: ' ', period: 'morning' }] }, 5);
    expect(updated).toMatchObject({ name: 'A2', items: [{ text: 'y', period: 'afternoon' }], updatedAt: 5, createdAt: 1 });
    await deleteTemplate(db, a.id);
    expect(await listTemplates(db)).toEqual([]);
  });
});
