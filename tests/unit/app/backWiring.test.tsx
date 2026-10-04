import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { App } from '../../../src/app/App';
import { handleBack } from '../../../src/app/back';
import { BottomSheet } from '../../../src/components/BottomSheet';
import { CATALOG } from '../../../src/content/catalog';
import { ensureToday, markGreeted } from '../../../src/domain/dayService';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { SettingsScreen } from '../../../src/screens/SettingsScreen';
import { makeDeps, renderWithDeps } from '../helpers';

const back = () => act(() => { handleBack(); });

describe('nút Back của Android', () => {
  it('đóng bảng (BottomSheet) đang mở', () => {
    const onClose = vi.fn();
    const { unmount } = render(<BottomSheet open title="Ghi chú" onClose={onClose}><p>x</p></BottomSheet>);
    back();
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
    expect(handleBack()).toBe(false);
  });

  it('ở tab khác Lịch thì về Lịch; đang ở Lịch thì không còn gì để lùi (thoát app)', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<App />, deps); // lần đầu trong ngày: tự sang tab Hôm nay
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    back();
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
    expect(handleBack()).toBe(false);
  });

  it('menu nổi đang mở thì Back thu menu lại trước', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await markGreeted(deps, (await ensureToday(deps)).date);
    renderWithDeps(<App />, deps);
    const toggle = await screen.findByRole('button', { name: 'Mở menu' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    back();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByTestId('calendar-card')).toBeInTheDocument();
  });

  it('ngày tương lai → quay lại lưới Lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-10'));
    expect(await screen.findByTestId('future-day')).toBeInTheDocument();
    back();
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
  });

  it('màn Mẫu → quay lại Cài đặt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(await screen.findByRole('button', { name: 'Quản lý mẫu' }));
    expect(await screen.findByRole('button', { name: 'Quay lại Cài đặt' })).toBeInTheDocument();
    back();
    expect(await screen.findByRole('button', { name: '💾 Sao lưu dữ liệu' })).toBeInTheDocument();
  });

  it('đang soạn mẫu → huỷ soạn, vẫn ở màn Mẫu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(await screen.findByRole('button', { name: 'Quản lý mẫu' }));
    await user.click(await screen.findByRole('button', { name: '＋ Mẫu mới' }));
    expect(await screen.findByLabelText('Tên mẫu')).toBeInTheDocument();
    back();
    expect(screen.queryByLabelText('Tên mẫu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quay lại Cài đặt' })).toBeInTheDocument();
  });
});
