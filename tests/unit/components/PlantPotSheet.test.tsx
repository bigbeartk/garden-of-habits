import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PlantPotSheet } from '../../../src/components/PlantPotSheet';
import { CATALOG } from '../../../src/content/catalog';
import { handleBack } from '../../../src/app/back';
import { setSetting } from '../../../src/db/settings';
import { DepsProvider } from '../../../src/app/deps';
import { NavContext } from '../../../src/app/nav';
import { I18nProvider } from '../../../src/i18n/I18nProvider';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import type { DayRecord } from '../../../src/domain/types';

/** chờ useLiveQuery đọc xong số ngày ra hoa: chạy cả bộ (hoặc trên CI) có thể lâu hơn 1 giây mặc định */
const LIVE = { timeout: 3000 };

const blooms = (plantId: string, n: number) =>
  Array.from({ length: n }, (_, i) => makeDay({ date: `2026-08-${String(i + 1).padStart(2, '0')}`, plantId, finalStage: 'bloom' }));

function setup(current = { id: 'sunflower', special: null as string | null, style: 'base' }, extra: Partial<DayRecord> = {}) {
  const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const onPickPlant = vi.fn();
  const onPickPot = vi.fn();
  const onClose = vi.fn();
  const user = userEvent.setup();
  const day = makeDay({ date: '2026-10-02', plantId: current.id, specialId: current.special, styleId: current.style, ...extra });
  const ui = () =>
    renderWithDeps(<PlantPotSheet open day={day} onClose={onClose} onPickPlant={onPickPlant} onPickPot={onPickPot} />, deps);
  return { deps, onPick: onPickPlant, onPickPot, onClose, user, ui };
}

describe('PlantPotSheet: hai tab Cây / Chậu', () => {
  it('mở ở tab Cây; tab có icon + chữ; chuyển sang Chậu thì hiện lưới chậu', async () => {
    const { ui, user } = setup();
    ui();
    const dialog = await screen.findByRole('dialog', { name: 'Đổi cây & chậu' });
    const tabs = within(dialog).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Cây', 'Chậu']);
    expect(tabs[0].querySelector('svg[data-icon="sprout"]')).not.toBeNull();
    expect(tabs[1].querySelector('svg[data-icon="pot"]')).not.toBeNull();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).getByRole('tabpanel')).toHaveAccessibleName('Cây');
    expect(within(dialog).getByRole('button', { name: 'Ngô' })).toBeInTheDocument();
    await user.click(tabs[1]);
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    expect(within(dialog).queryByRole('button', { name: 'Ngô' })).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Gốm mint' })).toBeInTheDocument();
  });

  it('chọn chậu gọi onPickPot; ảnh xem trước vẽ đúng dáng cây hôm nay', async () => {
    const { ui, user, onPickPot } = setup({ id: 'sunflower', special: null, style: 'giant' }, { finalStage: 'bloom' });
    ui();
    await user.click(await screen.findByRole('tab', { name: 'Chậu' }));
    for (const scene of screen.getAllByTestId('picker-scene')) expect(scene).toHaveAttribute('data-style', 'giant');
    await user.click(screen.getByRole('button', { name: 'Gốm mint' }));
    expect(onPickPot).toHaveBeenCalledWith('mint');
  });

  it('ngày tiết kiệm năng lượng: mở thẳng tab Chậu, tab Cây bị khoá', async () => {
    const { ui, user } = setup(undefined, { isRestDay: true });
    ui();
    const plantTab = await screen.findByRole('tab', { name: 'Cây' });
    expect(plantTab).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Chậu' })).toHaveAttribute('aria-selected', 'true');
    await user.click(plantTab);
    expect(screen.queryByRole('button', { name: 'Ngô' })).toBeNull();
  });

  it('màn dáng ẩn hàng tab', async () => {
    const { ui, user } = setup();
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    await screen.findByRole('dialog', { name: 'Dáng của Hướng dương' });
    expect(screen.queryByRole('tablist')).toBeNull();
  });
});

describe('PlantPotSheet: dáng cây', () => {
  it('chỉ loài có dáng mới có nút dáng, ghi số dáng đã mở', async () => {
    const { deps, ui } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    expect(await screen.findByRole('button', { name: 'Dáng cây: Hướng dương (2/3)' }, LIVE)).toBeInTheDocument();
    // loài chưa có dáng (chưa vẽ) thì không có nút: số nút = số loài có styles
    expect(screen.getAllByRole('button', { name: /^Dáng cây:/ })).toHaveLength(CATALOG.plants.filter((p) => p.styles?.length).length);
  });

  it('vừa mở bảng đã ghi đúng số dáng (không nháy 1/3)', async () => {
    const { deps, onPick, onClose } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    const props = { day: makeDay({ date: '2026-10-02', plantId: 'sunflower' }), onClose, onPickPlant: onPick, onPickPot: vi.fn() };
    const { rerender } = renderWithDeps(<PlantPotSheet open={false} {...props} />, deps);
    await new Promise((r) => setTimeout(r, 500));
    rerender(
      <DepsProvider value={deps}>
        <I18nProvider lang="vi">
          <NavContext.Provider value={() => {}}>
            <PlantPotSheet open {...props} />
          </NavContext.Provider>
        </I18nProvider>
      </DepsProvider>,
    );
    expect(screen.getByRole('button', { name: /^Dáng cây: Hướng dương/ })).toHaveAccessibleName('Dáng cây: Hướng dương (2/3)');
  });

  it('màn dáng: dáng đã mở có hình và chọn được; dáng khoá không có hình cây', async () => {
    const { deps, ui, user, onPick } = setup();
    await deps.db.days.bulkPut(blooms('sunflower', 12));
    ui();
    await user.click(await screen.findByRole('button', { name: /^Dáng cây: Hướng dương/ }));
    expect(await screen.findByRole('dialog', { name: 'Dáng của Hướng dương' })).toBeInTheDocument();
    expect(await screen.findByText('Đã ra hoa 12 ngày', {}, LIVE)).toBeInTheDocument();
    expect(screen.getByText('12/20')).toBeInTheDocument();
    const locked = screen.getByTestId('style-mini');
    expect(locked).toHaveAttribute('aria-disabled', 'true');
    expect(within(locked).queryByTestId('picker-scene')).toBeNull();
    expect(within(locked).getByTestId('locked-style-art')).toBeInTheDocument();
    expect(locked).toHaveTextContent('Dáng bí ẩn');
    expect(locked).toHaveTextContent('Ra hoa 20 ngày để mở');
    expect(locked).not.toHaveTextContent('Mặt trời nhỏ');
    await user.click(locked);
    expect(onPick).not.toHaveBeenCalled();
    const giant = screen.getByTestId('style-giant');
    expect(within(giant).getByTestId('picker-scene')).toHaveAttribute('data-style', 'giant');
    await user.click(giant);
    expect(onPick).toHaveBeenCalledWith('sunflower', null, 'giant');
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
