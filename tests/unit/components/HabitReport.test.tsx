import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { makeDeps, renderWithDeps } from '../helpers';
import { HabitReport } from '../../../src/components/HabitReport';
import { addHabit, toggleHabit } from '../../../src/domain/habitService';

// 2026-10-08 10:00 là thứ Năm; tuần 05/10 → 11/10
const start = new Date(2026, 9, 8, 10);

describe('HabitReport', () => {
  it('chưa có thói quen: nút Thói quen đầu tiên', async () => {
    const { deps } = makeDeps(start);
    const onManage = vi.fn();
    renderWithDeps(<HabitReport onManage={onManage} />, deps);
    fireEvent.click(await screen.findByRole('button', { name: '＋ Thói quen đầu tiên' }));
    expect(onManage).toHaveBeenCalled();
  });

  it('bảng tuần: trạng thái ô, số tổng, chuyển kỳ', async () => {
    const { deps, clock } = makeDeps(new Date(2026, 9, 6, 10)); // tạo thứ Ba 06/10
    const h = await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6] });
    await toggleHabit(deps, h.id); // 06/10
    clock.current = start; // 08/10, chưa tick
    renderWithDeps(<HabitReport onManage={() => {}} />, deps);
    const report = await screen.findByTestId('habit-report');
    expect(within(report).getByText('05/10 – 11/10')).toBeTruthy(); // nhãn kỳ
    await waitFor(() => expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-06`)).toHaveAttribute('data-state', 'done'));
    expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-05`)).toHaveAttribute('data-state', 'off');
    expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-07`)).toHaveAttribute('data-state', 'missed');
    expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-08`)).toHaveAttribute('data-state', 'pending');
    expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-09`)).toHaveAttribute('data-state', 'future');
    const stats = screen.getByTestId('habit-stats');
    expect(stats.textContent).toContain('33'); // 1/3
    expect(screen.getByRole('button', { name: 'Kỳ sau' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Kỳ trước' }));
    expect(await screen.findByText('28/09 – 04/10')).toBeTruthy();
  });

  it('Tháng và Năm', async () => {
    const { deps } = makeDeps(start);
    const h = await addHabit(deps, { name: 'Yoga', icon: '🧘', color: 'mint', weekdays: [4] });
    await toggleHabit(deps, h.id);
    renderWithDeps(<HabitReport onManage={() => {}} />, deps);
    fireEvent.click(await screen.findByRole('tab', { name: 'Tháng' }));
    expect(await screen.findByTestId(`habit-month-${h.id}`)).toBeTruthy();
    expect(screen.getByText('Tháng 10, 2026')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Năm' }));
    const year = await screen.findByTestId(`habit-year-${h.id}`);
    expect(year.querySelectorAll('[data-month]')).toHaveLength(12);
    expect(year.querySelector('[data-month="9"]')).toHaveAttribute('data-rate', '100');
  });
});
