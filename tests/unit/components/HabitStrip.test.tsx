import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { makeDeps, renderWithDeps } from '../helpers';
import { HabitStrip } from '../../../src/components/HabitStrip';
import { addHabit, checksOn } from '../../../src/domain/habitService';

const TODAY = '2026-10-02'; // thứ Sáu (makeDeps mặc định)

describe('HabitStrip', () => {
  it('chưa có thói quen: chỉ chip Thêm thói quen', async () => {
    const { deps } = makeDeps();
    const onManage = vi.fn();
    renderWithDeps(<HabitStrip date={TODAY} isRestDay={false} onChecked={() => {}} onManage={onManage} />, deps);
    fireEvent.click(await screen.findByRole('button', { name: 'Thêm thói quen' }));
    expect(onManage).toHaveBeenCalled();
  });

  it('chỉ hiện thói quen có lịch hôm nay; tick gọi onChecked và lưu', async () => {
    const { deps } = makeDeps();
    await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [5] });
    await addHabit(deps, { name: 'Yoga', icon: '🧘', color: 'mint', weekdays: [1] });
    const onChecked = vi.fn();
    renderWithDeps(<HabitStrip date={TODAY} isRestDay={false} onChecked={onChecked} onManage={() => {}} />, deps);
    const chip = await screen.findByRole('switch', { name: 'Thói quen: Uống nước' });
    expect(screen.queryByRole('switch', { name: 'Thói quen: Yoga' })).toBeNull();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-checked', 'true');
    await waitFor(async () => expect((await checksOn(deps.db, TODAY)).size).toBe(1));
    expect(onChecked).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('1/1')).toBeInTheDocument();
  });

  it('bấm nhanh hai lần: cuối cùng là chưa làm (state cục bộ)', async () => {
    const { deps } = makeDeps();
    await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [5] });
    renderWithDeps(<HabitStrip date={TODAY} isRestDay={false} onChecked={() => {}} onManage={() => {}} />, deps);
    const chip = await screen.findByRole('switch', { name: 'Thói quen: Uống nước' });
    fireEvent.click(chip);
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-checked', 'false');
    await waitFor(async () => expect((await checksOn(deps.db, TODAY)).size).toBe(0));
    expect(chip).toHaveAttribute('aria-checked', 'false');
  });

  it('ngày tiết kiệm năng lượng hoặc không có lịch hôm nay: không hiện gì', async () => {
    const { deps } = makeDeps();
    await addHabit(deps, { name: 'Yoga', icon: '🧘', color: 'mint', weekdays: [1] });
    const { container } = renderWithDeps(<HabitStrip date={TODAY} isRestDay={false} onChecked={() => {}} onManage={() => {}} />, deps);
    await waitFor(() => expect(container.querySelector('[data-testid="habit-strip"]')).toBeNull());
    expect(screen.queryByRole('button', { name: 'Thêm thói quen' })).toBeNull();
  });
});
