import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PlantPickerSheet } from '../../../src/components/PlantPickerSheet';
import { CATALOG } from '../../../src/content/catalog';
import { handleBack } from '../../../src/app/back';
import { setSetting } from '../../../src/db/settings';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

/** chờ useLiveQuery đọc xong số ngày ra hoa: chạy cả bộ (hoặc trên CI) có thể lâu hơn 1 giây mặc định */
const LIVE = { timeout: 3000 };

const blooms = (plantId: string, n: number) =>
  Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom' }));

function setup(current = { id: 'sunflower', special: null as string | null, style: 'base' }) {
  const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const onPick = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  const ui = () =>
    renderWithDeps(
      <PlantPickerSheet open currentId={current.id} currentSpecialId={current.special} currentStyleId={current.style} onClose={onClose} onPick={onPick} />,
      deps,
    );
  return { deps, onPick, onClose, user, ui };
}

describe('PlantPickerSheet: dáng cây', () => {
  it('chỉ loài có dáng mới có nút dáng, ghi số dáng đã mở', async () => {
    const { deps, ui } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    expect(await screen.findByRole('button', { name: 'Dáng cây: Hướng dương (2/3)' }, LIVE)).toBeInTheDocument();
    // loài chưa có dáng (chưa vẽ) thì không có nút: số nút = số loài có styles
    expect(screen.getAllByRole('button', { name: /^Dáng cây:/ })).toHaveLength(CATALOG.plants.filter((p) => p.styles?.length).length);
  });

  it('màn dáng: dáng đã mở có hình và chọn được; dáng khoá không có hình cây', async () => {
    const { deps, ui, user, onPick } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    expect(await screen.findByRole('dialog', { name: 'Dáng của Hướng dương' })).toBeInTheDocument();
    expect(await screen.findByText('Đã ra hoa 12 ngày', {}, LIVE)).toBeInTheDocument();
    expect(screen.getByText('12/20')).toBeInTheDocument();
    const locked = screen.getByTestId('style-giant');
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(within(locked).queryByTestId('picker-scene')).toBeNull();
    expect(within(locked).getByTestId('locked-style-art')).toBeInTheDocument();
    expect(locked).toHaveTextContent('Dáng bí ẩn');
    expect(locked).toHaveTextContent('Ra hoa 20 ngày để mở');
    expect(locked).not.toHaveTextContent('Khổng lồ');
    await user.click(locked);
    expect(onPick).not.toHaveBeenCalled();
    const mini = screen.getByTestId('style-mini');
    expect(within(mini).getByTestId('picker-scene')).toHaveAttribute('data-style', 'mini');
    await user.click(mini);
    expect(onPick).toHaveBeenCalledWith('sunflower', null, 'mini');
  });

  it('nút Quay lại chọn cây và nút Back của Android về lưới loài', async () => {
    const { ui, user, onClose } = setup();
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    await user.click(screen.getByRole('button', { name: 'Quay lại chọn cây' }));
    expect(await screen.findByRole('button', { name: 'Hướng dương' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    await screen.findByRole('dialog', { name: 'Dáng của Hướng dương' });
    handleBack();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Dáng của Hướng dương' })).toBeNull());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('chọn loài ở lưới = dáng Gốc; chọn cặp đặc biệt giữ dáng nếu cùng loài', async () => {
    const { deps, ui, user, onPick } = setup({ id: 'sunflower', special: null, style: 'mini' });
    await setSetting(deps.db, 'unlockedSpecials', ['sunflower|glow', 'corn|glow']);
    ui();
    await user.click(await screen.findByRole('button', { name: 'Ngô' }));
    expect(onPick).toHaveBeenLastCalledWith('corn', null, 'base');
    await user.click(await screen.findByRole('button', { name: 'Hướng dương · Phát sáng' }));
    expect(onPick).toHaveBeenLastCalledWith('sunflower', 'glow', 'mini');
    await user.click(screen.getByRole('button', { name: 'Ngô · Phát sáng' }));
    expect(onPick).toHaveBeenLastCalledWith('corn', 'glow', 'base');
  });

  it('đang dùng dáng khác Gốc thì nút dáng của loài đó có chấm', async () => {
    const { ui } = setup({ id: 'sunflower', special: null, style: 'mini' });
    ui();
    const btn = await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ });
    expect(btn.querySelector('.icon-btn__badge')).not.toBeNull();
  });

  it('dáng hôm nay không thuộc loài (vd. từ file sao lưu) thì coi như Gốc khi chọn cặp đặc biệt', async () => {
    const { deps, ui, user, onPick } = setup({ id: 'corn', special: null, style: 'giant' });
    await setSetting(deps.db, 'unlockedSpecials', ['corn|glow']);
    ui();
    await user.click(await screen.findByRole('button', { name: 'Ngô · Phát sáng' }, LIVE));
    expect(onPick).toHaveBeenLastCalledWith('corn', 'glow', 'base');
  });

  it('ô loài đang dùng (dáng nào cũng vậy) có viền chọn', async () => {
    const { ui } = setup({ id: 'sunflower', special: null, style: 'mini' });
    ui();
    expect(await screen.findByRole('button', { name: 'Hướng dương' })).toHaveAttribute('aria-pressed', 'true');
  });
});
