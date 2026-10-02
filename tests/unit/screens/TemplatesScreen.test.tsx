import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplatesScreen } from '../../../src/screens/TemplatesScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';

async function createViaForm(user: ReturnType<typeof userEvent.setup>, name: string, items: string) {
  await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
  await user.type(screen.getByLabelText('Tên mẫu'), name);
  await user.type(screen.getByLabelText('Các việc (mỗi dòng một việc)'), items);
  await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
}

describe('TemplatesScreen', () => {
  it('tạo mẫu, đặt mặc định, chuyển mặc định sang mẫu khác', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
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
    renderWithDeps(<TemplatesScreen />, deps);
    await user.click(screen.getByRole('button', { name: '＋ Mẫu mới' }));
    await user.click(screen.getByRole('button', { name: 'Lưu mẫu' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Tên mẫu không được để trống');
  });

  it('thêm mẫu vào hôm nay', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await createViaForm(user, 'Buổi sáng', 'Tập thể dục{Enter}Ăn sáng');
    const card = (await screen.findByRole('heading', { name: 'Buổi sáng' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Thêm vào hôm nay' }));
    expect(await screen.findByText(/Đã thêm 2 việc vào hôm nay/)).toBeInTheDocument();
    expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => t.text)).toEqual(['Tập thể dục', 'Ăn sáng']);
  });

  it('xoá mẫu cần xác nhận', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<TemplatesScreen />, deps);
    await createViaForm(user, 'Tạm', 'x');
    const card = (await screen.findByRole('heading', { name: 'Tạm' })).closest('li')!;
    await user.click(within(card).getByRole('button', { name: 'Xoá' }));
    await user.click(within(card).getByRole('button', { name: 'Chắc chắn xoá' }));
    await waitFor(async () => expect(await deps.db.templates.count()).toBe(0));
  });
});
