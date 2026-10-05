import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { RemindersScreen } from '../../../src/screens/RemindersScreen';
import { CATALOG } from '../../../src/content/catalog';
import { ensureToday } from '../../../src/domain/dayService';
import { addReminder } from '../../../src/domain/reminderService';
import { makeDeps, renderWithDeps } from '../helpers';

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 5, 10, 0), CATALOG);
  const user = userEvent.setup();
  const onBack = vi.fn();
  return { deps, clock, user, onBack, render: () => renderWithDeps(<RemindersScreen onBack={onBack} />, deps) };
};

describe('RemindersScreen', () => {
  it('thêm việc (Enter); rỗng thì không lưu; Escape đóng dòng', async () => {
    const { deps, user, render } = setup();
    render();
    await user.click(screen.getByRole('button', { name: '＋ Việc nhắc mới' }));
    await user.type(screen.getByLabelText('Việc nhắc mới'), 'Mua điện thoại cho mẹ{Enter}');
    const active = await screen.findByTestId('reminders-active');
    await within(active).findByText('Mua điện thoại cho mẹ');
    await user.click(screen.getByRole('button', { name: '＋ Việc nhắc mới' }));
    await user.click(screen.getByRole('button', { name: 'Lưu' }));
    expect(await deps.db.reminders.count()).toBe(1);
    await user.click(screen.getByRole('button', { name: '＋ Việc nhắc mới' }));
    await user.type(screen.getByLabelText('Việc nhắc mới'), 'Bỏ{Escape}');
    expect(screen.queryByLabelText('Việc nhắc mới')).toBeNull();
    expect(await deps.db.reminders.count()).toBe(1);
  });

  it('xếp theo thứ tự thêm, không có cột Hạn', async () => {
    const { deps, render } = setup();
    await addReminder(deps, 'Vẽ tranh');
    await addReminder(deps, 'Mua quần áo');
    render();
    const active = await screen.findByTestId('reminders-active');
    await within(active).findByText('Vẽ tranh');
    const rows = within(active).getAllByRole('listitem');
    expect(rows.map((r) => r.querySelector('.rem__text')?.textContent)).toEqual(['Vẽ tranh', 'Mua quần áo']);
    expect(active).not.toHaveTextContent('Hạn');
    expect(active.querySelector('input[type="date"]')).toBeNull();
  });

  it('bật Hôm nay thì việc vào hôm nay; tick thì xuống mục đã hoàn thành tuần này', async () => {
    const { deps, user, render } = setup();
    await ensureToday(deps);
    await addReminder(deps, 'Mua quà');
    render();
    const sw = await screen.findByRole('switch', { name: 'Thêm vào hôm nay: Mua quà' });
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-05'))!.todos.map((t) => t.text)).toEqual(['Mua quà']));
    await user.click(screen.getByRole('checkbox', { name: 'Hoàn thành nhắc: Mua quà' }));
    const done = screen.getByTestId('reminders-done');
    expect(await within(done).findByText('Mua quà')).toBeInTheDocument();
    expect(within(screen.getByTestId('reminders-active')).queryByText('Mua quà')).toBeNull();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-05'))!.todos[0].done).toBe(true));
  });

  it('mục đã hoàn thành trống thì có lời nhắn; xoá phải xác nhận; nút quay lại gọi onBack', async () => {
    const { deps, user, onBack, render } = setup();
    await addReminder(deps, 'Mua quà');
    render();
    expect(await screen.findByText('Chưa xong việc nào tuần này')).toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Xoá: Mua quà' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá: Mua quà' }));
    await waitFor(async () => expect(await deps.db.reminders.count()).toBe(0));
    await user.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('chạm chữ để sửa, Enter lưu', async () => {
    const { deps, user, render } = setup();
    const r = await addReminder(deps, 'Mua quà');
    render();
    await user.click(await screen.findByRole('button', { name: 'Mua quà' }));
    const input = screen.getByLabelText('Sửa việc nhắc');
    await user.clear(input);
    await user.type(input, 'Mua hoa{Enter}');
    await waitFor(async () => expect((await deps.db.reminders.get(r.id))!.text).toBe('Mua hoa'));
  });
});
