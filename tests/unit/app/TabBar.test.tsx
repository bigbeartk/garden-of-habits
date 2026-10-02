import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TabBar } from '../../../src/app/TabBar';

describe('TabBar', () => {
  it('hiển thị 4 tab và đánh dấu tab hiện tại', () => {
    render(<TabBar current="calendar" onChange={() => {}} />);
    for (const name of ['Lịch', 'Hôm nay', 'Mẫu', 'Cài đặt']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Lịch' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Hôm nay' })).not.toHaveAttribute('aria-current');
  });

  it('gọi onChange với tab được chọn', async () => {
    const onChange = vi.fn();
    render(<TabBar current="calendar" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hôm nay' }));
    expect(onChange).toHaveBeenCalledWith('today');
  });
});
