import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { makeDeps, renderWithDeps } from '../helpers';
import { HabitsScreen } from '../../../src/screens/HabitsScreen';
import { addHabit, isStopped, listHabits } from '../../../src/domain/habitService';

describe('HabitsScreen', () => {
  it('thêm thói quen: tên, emoji, màu, thứ', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<HabitsScreen onBack={() => {}} />, deps);
    fireEvent.click(screen.getByRole('button', { name: '＋ Thói quen mới' }));
    fireEvent.change(screen.getByLabelText('Tên thói quen'), { target: { value: 'Yoga' } });
    fireEvent.click(screen.getByRole('radio', { name: '🧘' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Oải hương' }));
    fireEvent.click(screen.getByRole('button', { name: 'Thứ Ba' })); // tắt T3 (mặc định bật đủ 7)
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thói quen' }));
    await waitFor(async () => expect(await listHabits(deps.db)).toHaveLength(1));
    expect((await listHabits(deps.db))[0]).toMatchObject({ name: 'Yoga', icon: '🧘', color: 'lavender', weekdays: [0, 1, 3, 4, 5, 6] });
    expect(await screen.findByText('Yoga')).toBeInTheDocument();
  });

  it('nộp form hai lần liên tiếp chỉ tạo một thói quen', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<HabitsScreen onBack={() => {}} startAdding />, deps);
    fireEvent.change(screen.getByLabelText('Tên thói quen'), { target: { value: 'Yoga' } });
    const form = screen.getByRole('button', { name: 'Lưu thói quen' }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    await waitFor(async () => expect(await listHabits(deps.db)).toHaveLength(1));
    await new Promise((r) => setTimeout(r, 50));
    expect(await listHabits(deps.db)).toHaveLength(1);
  });

  it('nút Lưu tắt khi tên rỗng hoặc không chọn thứ nào', () => {
    const { deps } = makeDeps();
    renderWithDeps(<HabitsScreen onBack={() => {}} startAdding />, deps);
    const save = screen.getByRole('button', { name: 'Lưu thói quen' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Tên thói quen'), { target: { value: 'A' } });
    expect(save).toBeEnabled();
    for (const d of ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']) fireEvent.click(screen.getByRole('button', { name: d }));
    expect(save).toBeDisabled();
  });

  it('thẻ ghi lịch; sửa; xoá có xác nhận', async () => {
    const { deps } = makeDeps();
    await addHabit(deps, { name: 'Đi bộ', icon: '🚶', color: 'mint', weekdays: [1, 3] });
    await addHabit(deps, { name: 'Uống nước', icon: '💧', color: 'sky', weekdays: [0, 1, 2, 3, 4, 5, 6] });
    renderWithDeps(<HabitsScreen onBack={() => {}} />, deps);
    expect(await screen.findByText('T2 · T4')).toBeInTheDocument();
    expect(screen.getByText('Mỗi ngày')).toBeInTheDocument();
    for (const [name, icon] of [['Sửa: Đi bộ', 'pencil'], ['Dừng: Đi bộ', 'pause'], ['Xoá: Đi bộ', 'remove']]) {
      const btn = screen.getByRole('button', { name });
      expect(btn.querySelector(`svg[data-icon="${icon}"]`)).not.toBeNull();
      expect(btn.textContent).toBe(''); // chỉ có icon
    }
    fireEvent.click(screen.getByRole('button', { name: 'Sửa: Đi bộ' }));
    fireEvent.change(screen.getByLabelText('Tên thói quen'), { target: { value: 'Đi bộ 30 phút' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thói quen' }));
    expect(await screen.findByText('Đi bộ 30 phút')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xoá: Đi bộ 30 phút' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xoá cả lịch sử' }));
    await waitFor(async () => expect(await listHabits(deps.db)).toHaveLength(1));
  });

  it('nút Quay lại Khu vườn gọi onBack', () => {
    const { deps } = makeDeps();
    const onBack = vi.fn();
    renderWithDeps(<HabitsScreen onBack={onBack} />, deps);
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại Khu vườn' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('Dừng chuyển thói quen xuống mục Đã dừng (giữ lịch sử); Tiếp tục đưa lại lên', async () => {
    const { deps, clock } = makeDeps();
    await addHabit(deps, { name: 'Yoga', icon: '🧘', color: 'mint', weekdays: [1] });
    clock.current = new Date(2026, 9, 5, 10);
    renderWithDeps(<HabitsScreen onBack={() => {}} />, deps);
    fireEvent.click(await screen.findByRole('button', { name: 'Dừng: Yoga' }));
    const stopped = await screen.findByTestId('habits-stopped');
    expect(within(stopped).getByText('Yoga')).toBeInTheDocument();
    expect(within(stopped).getByText('Đã dừng từ 05/10')).toBeInTheDocument();
    expect(within(stopped).queryByRole('button', { name: 'Sửa: Yoga' })).not.toBeInTheDocument();
    expect(within(stopped).getByRole('button', { name: 'Tiếp tục: Yoga' }).querySelector('svg[data-icon="play"]')).not.toBeNull();
    expect(within(stopped).getByRole('button', { name: 'Xoá: Yoga' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dừng: Yoga' })).not.toBeInTheDocument();
    expect(isStopped((await listHabits(deps.db))[0])).toBe(true);

    clock.current = new Date(2026, 9, 7, 10);
    fireEvent.click(within(stopped).getByRole('button', { name: 'Tiếp tục: Yoga' }));
    expect(await screen.findByRole('button', { name: 'Dừng: Yoga' })).toBeInTheDocument();
    expect(screen.queryByTestId('habits-stopped')).not.toBeInTheDocument();
    expect((await listHabits(deps.db))[0].pauses).toEqual([{ from: '2026-10-05', to: '2026-10-07' }]);
  });
});
