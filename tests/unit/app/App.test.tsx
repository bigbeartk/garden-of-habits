import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { App } from '../../../src/app/App';
import { CATALOG } from '../../../src/content/catalog';
import { markGreeted, ensureToday } from '../../../src/domain/dayService';
import { makeDeps, renderWithDeps } from '../helpers';
import { setSetting } from '../../../src/db/settings';

/** Tab đang chọn: mở menu nổi (nếu đang thu gọn) rồi đọc nút có aria-current. */
async function currentTabButton(name: string) {
  const toggle = await screen.findByRole('button', { name: /menu/ });
  if (toggle.getAttribute('aria-expanded') === 'false') fireEvent.click(toggle);
  return screen.findByRole('button', { name });
}

describe('App', () => {
  it('lần đầu mở trong ngày thì tự chuyển sang tab Hôm nay để cây chào', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<App />, deps);
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    expect(await currentTabButton('Hôm nay')).toHaveAttribute('aria-current', 'page');
  });

  it('đã chào rồi thì mở màn Lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
    expect(await currentTabButton('Lịch')).toHaveAttribute('aria-current', 'page');
  });
});

describe('App qua 4:00 sáng', () => {
  it('đang ở tab Lịch, quay lại app sau 4:00 thì tạo ngày mới và chuyển sang Hôm nay để chào', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 2, 22, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
    expect(await currentTabButton('Lịch')).toHaveAttribute('aria-current', 'page');
    clock.current = new Date(2026, 9, 3, 8, 0);
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    expect(await currentTabButton('Hôm nay')).toHaveAttribute('aria-current', 'page');
    expect(await deps.db.days.get('2026-10-03')).toBeDefined();
  });
});

describe('App chuyển tab không có hiệu ứng', () => {
  it('đổi màn ngay, không có khung chuyển cảnh', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    await screen.findByTestId('calendar-card');
    expect(screen.queryByTestId('tab-screen')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Khu vườn' }));
    // không chờ hiệu ứng: màn Khu vườn có ngay, màn Lịch biến mất ngay
    expect(screen.getByTestId('garden')).toBeInTheDocument();
    expect(screen.queryByTestId('calendar-card')).not.toBeInTheDocument();
  });

  it('không còn tab Mẫu; Mẫu mở từ Cài đặt và quay lại Cài đặt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    await screen.findByTestId('calendar-card');
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    expect(screen.queryByRole('button', { name: 'Mẫu' })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Cài đặt' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Quản lý mẫu' }));
    expect(await screen.findByRole('heading', { name: 'Mẫu việc cần làm' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(await screen.findByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Mẫu việc cần làm' })).not.toBeInTheDocument();
  });
});

describe('App: nút menu theo hình nền lịch', () => {
  it('đổi hình nền Cún thì nút menu thành icon cún, ở mọi tab', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    await setSetting(deps.db, 'calendarTheme', 'dog');
    renderWithDeps(<App />, deps);
    await screen.findByTestId('calendar-card');
    const toggle = screen.getByRole('button', { name: 'Mở menu' });
    await waitFor(() => expect(toggle.querySelector('[data-icon="menu-dog"]')).not.toBeNull());
    fireEvent.click(toggle);
    fireEvent.click(await screen.findByRole('button', { name: 'Cài đặt' }));
    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mở menu' }).querySelector('[data-icon="menu-dog"]')).not.toBeNull());
  });

  it('chọn icon riêng trong Cài đặt thì không theo hình nền nữa', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    await setSetting(deps.db, 'calendarTheme', 'dog');
    await setSetting(deps.db, 'menuIcon', 'rain');
    renderWithDeps(<App />, deps);
    await screen.findByTestId('calendar-card');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mở menu' }).querySelector('[data-icon="menu-rain"]')).not.toBeNull());
  });
});
