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
    expect(screen.getByTestId('habit-empty-art').querySelector('[data-mode="sleeping"]')).not.toBeNull();
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

  it('bảng tuần: chạm ô hôm nay để tick / bỏ tick; ô ngày khác và thói quen không có lịch hôm nay thì không bấm được', async () => {
    const { deps } = makeDeps(start);
    const h = await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6] });
    const off = await addHabit(deps, { name: 'Yoga', icon: '🧘', color: 'mint', weekdays: [1] }); // chỉ thứ Hai
    renderWithDeps(<HabitReport onManage={() => {}} />, deps);
    const sw = await screen.findByRole('switch', { name: 'Điểm danh hôm nay: Uống nước' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveAttribute('data-testid', `habit-cell-${h.id}-2026-10-08`);
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true'); // đổi ngay, không chờ DB
    await waitFor(async () => expect(await deps.db.habitChecks.get([h.id, '2026-10-08'])).toBeTruthy());
    await waitFor(() => expect(sw).toHaveAttribute('data-state', 'done'));
    await waitFor(() => expect(screen.getByTestId('habit-stats').textContent).toContain('100'));
    fireEvent.click(sw);
    await waitFor(async () => expect(await deps.db.habitChecks.get([h.id, '2026-10-08'])).toBeUndefined());
    await waitFor(() => expect(sw).toHaveAttribute('data-state', 'pending'));
    // chỉ một công tắc: ô Yoga hôm nay (không có lịch) và ô các ngày khác chỉ để xem
    expect(screen.getAllByRole('switch')).toHaveLength(1);
    expect(screen.getByTestId(`habit-cell-${off.id}-2026-10-08`).tagName).toBe('SPAN');
    expect(screen.getByTestId(`habit-cell-${h.id}-2026-10-07`).tagName).toBe('SPAN');
  });

  it('bảng tuần: ngày tiết kiệm năng lượng không có ô bấm được', async () => {
    const { deps } = makeDeps(start);
    await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6] });
    await deps.db.days.put({ date: '2026-10-08', plantId: 'sunflower', potId: 'terracotta', specialId: null, isRestDay: true, greetedAt: 1, note: '', todos: [], finalStage: 'seed', createdAt: 0, updatedAt: 0 });
    renderWithDeps(<HabitReport onManage={() => {}} />, deps);
    await screen.findByTestId('habit-stats');
    expect(screen.queryByRole('switch')).toBeNull();
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
