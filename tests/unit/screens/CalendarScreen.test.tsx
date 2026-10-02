import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import { setSetting } from '../../../src/db/settings';

async function setup() {
  const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
  await deps.db.days.bulkPut([
    makeDay({ date: '2026-10-02', plantId: 'cherry', potId: 'polka', finalStage: 'bloom', specialId: 'glow', note: 'vui',
      todos: [{ id: 'a', text: 'Tập yoga', done: true, doneAt: 1, order: 0 }] }),
    makeDay({ date: '2026-10-03', isRestDay: true }),
  ]);
  const nav = vi.fn();
  const user = userEvent.setup();
  renderWithDeps(<CalendarScreen />, deps, nav);
  return { deps, nav, user };
}

describe('CalendarScreen', () => {
  it('hiển thị trạng thái từng ngày', async () => {
    await setup();
    // danh sách ngày và "ngày đầu tiên" là hai truy vấn riêng, có thể về lệch nhau
    await waitFor(() => {
      expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant');
      expect(screen.getByTestId('day-2026-10-04')).toHaveAttribute('data-status', 'missed');
    });
    expect(screen.getByTestId('day-2026-10-03')).toHaveAttribute('data-status', 'rest');
    expect(screen.getByTestId('day-2026-10-01')).toHaveAttribute('data-status', 'before-start');
    expect(screen.getByTestId('day-2026-10-15')).toHaveAttribute('data-status', 'today-pending');
    expect(screen.getByTestId('day-2026-10-20')).toHaveAttribute('data-status', 'future');
    expect(within(screen.getByTestId('day-2026-10-03')).getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(within(screen.getByTestId('day-2026-10-04')).getByTestId('wilted-plant')).toBeInTheDocument();
  });

  it('chuyển sang tháng trước; không đi quá tháng hiện tại', async () => {
    const { user } = await setup();
    expect(screen.getByRole('heading', { name: 'Tháng 10, 2026' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Tháng trước' }));
    expect(screen.getByRole('heading', { name: 'Tháng 9, 2026' })).toBeInTheDocument();
  });

  it('xem chi tiết ngày cũ: việc chỉ đọc, ghi chú sửa được', async () => {
    const { deps, user } = await setup();
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).getByText('Tập yoga')).toBeInTheDocument();
    expect(within(dialog).getByText(/Cherry · Ra hoa/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Phát sáng/)).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    const note = within(dialog).getByLabelText('Ghi chú ngày này');
    await user.clear(note);
    await user.type(note, 'vui lắm');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu ghi chú' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('vui lắm'));
  });

  it('chạm vào hôm nay thì có nút đi tới màn Hôm nay', async () => {
    const { nav, user } = await setup();
    await user.click(await screen.findByTestId('day-2026-10-15'));
    await user.click(await screen.findByRole('button', { name: 'Đi tới Hôm nay 🌱' }));
    expect(nav).toHaveBeenCalledWith('today');
  });
});

describe('CalendarScreen trong suốt khi có ảnh nền', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:bg' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  });

  it('không có ảnh nền: thẻ lịch giữ nền trắng', async () => {
    await setup();
    await screen.findByTestId('day-2026-10-02');
    expect(screen.getByTestId('calendar-card')).not.toHaveClass('is-glass');
    expect(screen.getByTestId('calendar-head')).not.toHaveClass('is-glass');
  });

  it('có ảnh nền: thẻ tháng và lưới ngày chuyển sang kính mờ trong suốt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([1, 2, 3]).buffer });
    renderWithDeps(<CalendarScreen />, deps);
    await waitFor(() => expect(screen.getByTestId('calendar-card')).toHaveClass('is-glass'));
    expect(screen.getByTestId('calendar-head')).toHaveClass('is-glass');
  });
});

describe('CalendarScreen tiêu đề ngày', () => {
  it('bảng chi tiết ngày cũ hiện tiêu đề (chỉ để xem)', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', title: 'Đi chơi công viên' }));
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).getByRole('heading', { name: 'Đi chơi công viên' })).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Tiêu đề hôm nay')).not.toBeInTheDocument();
  });
});
