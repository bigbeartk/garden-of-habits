import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TabBar } from '../../../src/app/TabBar';

const TAB_NAMES = ['Lịch', 'Hôm nay', 'Khu vườn', 'Cài đặt'];

describe('TabBar (menu nổi thu gọn)', () => {
  it('mặc định chỉ hiện nút menu, chưa hiện 4 tab', () => {
    render(<TabBar current="calendar" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Mở menu' })).toHaveAttribute('aria-expanded', 'false');
    for (const name of TAB_NAMES) expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  });

  it('bấm nút menu thì hiện 4 tab, đánh dấu tab hiện tại; bấm lần nữa thì thu lại', async () => {
    const user = userEvent.setup();
    render(<TabBar current="today" onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    for (const name of TAB_NAMES) expect(screen.getByRole('button', { name })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hôm nay' })).toHaveAttribute('aria-current', 'page');
    const toggle = screen.getByRole('button', { name: 'Đóng menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Lịch' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeInTheDocument();
  });

  it('chọn tab thì chuyển màn và dải tab vẫn mở', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<TabBar current="calendar" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    await user.click(screen.getByRole('button', { name: 'Khu vườn' }));
    expect(onChange).toHaveBeenCalledWith('garden');
    expect(screen.getByRole('button', { name: 'Cài đặt' })).toBeInTheDocument();
  });

  it('chạm ra ngoài menu thì dải tab tự thu lại; chạm trong dải thì không', async () => {
    const user = userEvent.setup();
    render(
      <>
        <p>nội dung màn hình</p>
        <TabBar current="calendar" onChange={() => {}} />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    await user.click(screen.getByRole('button', { name: 'Khu vườn' }));
    expect(screen.getByRole('button', { name: 'Đóng menu' })).toBeInTheDocument();
    await user.click(screen.getByText('nội dung màn hình'));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Lịch' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Mở menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('icon tab và nút menu là SVG tự vẽ, không phải emoji', async () => {
    const user = userEvent.setup();
    render(<TabBar current="calendar" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Mở menu' }).querySelector('svg[data-icon="menu"]')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mở menu' }));
    for (const [name, icon] of [['Lịch', 'calendar'], ['Hôm nay', 'sprout'], ['Khu vườn', 'garden'], ['Cài đặt', 'gear']]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.querySelector(`svg[data-icon="${icon}"]`)).not.toBeNull();
      expect(btn.textContent).toBe(name);
    }
    expect(within(screen.getByRole('button', { name: 'Đóng menu' })).getByTestId('icon-close')).toBeInTheDocument();
  });
});
