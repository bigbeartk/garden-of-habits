import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { App } from '../../../src/app/App';
import { CATALOG } from '../../../src/content/catalog';
import { markGreeted, ensureToday } from '../../../src/domain/dayService';
import { makeDeps, renderWithDeps } from '../helpers';

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

describe('App hiệu ứng chuyển tab', () => {
  it('màn hình nằm trong khung chuyển cảnh, đổi đúng tab và hướng trượt theo thứ tự tab', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const day = await ensureToday(deps);
    await markGreeted(deps, day.date);
    renderWithDeps(<App />, deps);
    const first = await screen.findByTestId('tab-screen');
    expect(first).toHaveAttribute('data-tab', 'calendar');
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mẫu' }));
    await waitFor(() => expect(screen.getByTestId('tab-screen')).toHaveAttribute('data-tab', 'templates'));
    expect(screen.getByTestId('tab-screen')).toHaveAttribute('data-direction', 'forward');
    fireEvent.click(screen.getByRole('button', { name: 'Lịch' }));
    await waitFor(() => expect(screen.getByTestId('tab-screen')).toHaveAttribute('data-tab', 'calendar'));
    expect(screen.getByTestId('tab-screen')).toHaveAttribute('data-direction', 'back');
  });
});
