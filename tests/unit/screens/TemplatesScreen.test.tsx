import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TemplatesScreen } from '../../../src/screens/TemplatesScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';
import { createTemplate } from '../../../src/domain/templateService';

async function createViaForm(user: ReturnType<typeof userEvent.setup>, name: string, items: string) {
  await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
  await user.type(screen.getByLabelText('Tên mẫu'), name);
  await user.type(screen.getByLabelText('Việc buổi Sáng (mỗi dòng một việc)'), items);
  await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
}

describe('TemplatesScreen', () => {
  it('tạo mẫu, đặt mặc định, chuyển mặc định sang mẫu khác', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    await createViaForm(user, 'Buổi sáng', 'Tập thể dục{Enter}Ăn sáng');
    await createViaForm(user, 'Cuối tuần', 'Dọn nhà');
    expect(await screen.findByRole('heading', { name: 'Buổi sáng' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đặt làm mặc định: Buổi sáng' }));
    await waitFor(async () => expect((await deps.db.templates.toArray()).find((t) => t.isDefault)?.name).toBe('Buổi sáng'));
    await user.click(await screen.findByRole('button', { name: 'Đặt làm mặc định: Cuối tuần' }));
    await waitFor(async () => {
      const defaults = (await deps.db.templates.toArray()).filter((t) => t.isDefault);
      expect(defaults.map((t) => t.name)).toEqual(['Cuối tuần']);
    });
  });

  it('tên trống thì báo lỗi', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
    await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tên mẫu không được để trống');
  });

  it('thêm mẫu vào hôm nay', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    await createViaForm(user, 'Buổi sáng', 'Tập thể dục{Enter}Ăn sáng');
    const card = (await screen.findByRole('heading', { name: 'Buổi sáng' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Thêm vào hôm nay' }));
    expect(await screen.findByText(/Đã thêm 2 việc vào hôm nay/)).toBeInTheDocument();
    expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => t.text)).toEqual(['Tập thể dục', 'Ăn sáng']);
  });

  it('xoá mẫu cần xác nhận', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    await createViaForm(user, 'Tạm', 'x');
    const card = (await screen.findByRole('heading', { name: 'Tạm' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Xoá' }));
    await user.click(within(card).getByRole('button', { name: 'Chắc chắn xoá' }));
    await waitFor(async () => expect(await deps.db.templates.count()).toBe(0));
  });
});

describe('TemplatesScreen mẫu theo buổi', () => {
  it('mẫu có 3 ô Sáng/Chiều/Tối; áp dụng thì việc vào đúng buổi', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
    await user.type(screen.getByLabelText('Tên mẫu'), 'Cả ngày');
    await user.type(screen.getByLabelText('Việc buổi Sáng (mỗi dòng một việc)'), 'Tập thể dục');
    await user.type(screen.getByLabelText('Việc buổi Chiều (mỗi dòng một việc)'), 'Đi chợ');
    await user.type(screen.getByLabelText('Việc buổi Tối (mỗi dòng một việc)'), 'Đọc sách{Enter}Thiền');
    await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
    const card = (await screen.findByRole('heading', { name: 'Cả ngày' })).closest('li')!;
    expect(within(card).getByText('Đi chợ')).toBeInTheDocument();
    await user.click(within(card).getByRole('button', { name: 'Thêm vào hôm nay' }));
    await screen.findByText(/Đã thêm 4 việc vào hôm nay/);
    expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => [t.text, t.period])).toEqual([
      ['Tập thể dục', 'morning'], ['Đi chợ', 'afternoon'], ['Đọc sách', 'evening'], ['Thiền', 'evening'],
    ]);
  });

  it('sửa mẫu hiện lại đúng việc trong từng ô', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await createTemplate(deps.db, 'Mẫu', [{ text: 'A', period: 'morning' }, { text: 'B', period: 'evening' }], 1);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    const card = (await screen.findByRole('heading', { name: 'Mẫu' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Sửa' }));
    expect(screen.getByLabelText('Việc buổi Sáng (mỗi dòng một việc)')).toHaveValue('A');
    expect(screen.getByLabelText('Việc buổi Chiều (mỗi dòng một việc)')).toHaveValue('');
    expect(screen.getByLabelText('Việc buổi Tối (mỗi dòng một việc)')).toHaveValue('B');
  });
});

describe('TemplatesScreen nút quay lại và ngôi sao tự vẽ', () => {
  it('nút mũi tên quay về Cài đặt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const onBack = vi.fn();
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen onBack={onBack} />, deps);
    const back = screen.getByRole('button', { name: 'Quay lại Cài đặt' });
    expect(back.querySelector('svg[data-icon="back"]')).not.toBeNull();
    expect(back.textContent).toBe('');
    await user.click(back);
    expect(onBack).toHaveBeenCalled();
  });

  it('nút mặc định dùng ngôi sao SVG, không dùng ký tự ☆/⭐', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await createTemplate(deps.db, 'Mẫu A', [{ text: 'x', period: 'morning' }], 1);
    renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps);
    const star = await screen.findByRole('button', { name: 'Đặt làm mặc định: Mẫu A' });
    expect(star.querySelector('svg[data-icon="star"]')).not.toBeNull();
    expect(star.textContent ?? '').not.toMatch(/[☆⭐★]/);
  });
});

it('Mẫu bằng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<TemplatesScreen onBack={() => {}} />, deps, undefined, 'en');
  expect(await screen.findByRole('button', { name: '＋ New template' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Task templates' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Back to Settings' })).toBeInTheDocument();
});
