import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { GardenScreen } from '../../../src/screens/GardenScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import { getSetting, setSetting } from '../../../src/db/settings';
import { requestHabitManager } from '../../../src/app/habitIntent';

async function openGarden() {
  const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
  await deps.db.days.bulkPut([
    makeDay({ date: '2026-09-20', plantId: 'rose' }),
    makeDay({ date: '2026-10-01', plantId: 'corn', finalStage: 'bloom' }),
    makeDay({ date: '2026-10-02', plantId: 'corn' }),
    makeDay({ date: '2026-10-05', plantId: 'cactus' }),
    makeDay({ date: '2026-10-06', plantId: 'corn', isRestDay: true }),
    makeDay({ date: '2026-10-10', plantId: 'corn' }),
  ]);
  const user = userEvent.setup();
  const nav = vi.fn();
  renderWithDeps(<GardenScreen />, deps, nav);
  const garden = await screen.findByTestId('garden');
  await within(garden).findByTestId('garden-summary'); // thân màn chờ đọc setting gardenView
  return { deps, user, garden, nav };
}

const countOf = (garden: HTMLElement, id: string) => within(garden).getByTestId(`garden-plant-${id}`).querySelector('.garden__count')!.textContent;

describe('Khu vườn (báo cáo từ ngày tới ngày)', () => {
  it('luống > 0 ngày (kể cả cây héo, ngày nghỉ) đứng trên mọi luống 0 ngày', async () => {
    const { garden } = await openGarden();
    await waitFor(() => expect(countOf(garden, 'corn')).toBe('3'));
    // số ngày cây héo cần thêm truy vấn ngày dùng app đầu tiên: chờ nó về rồi mới đọc thứ tự
    await waitFor(() => expect(within(garden).getByTestId('garden-wilted').querySelector('.garden__count')!.textContent).toBe('9'));
    const ids = within(garden).getAllByRole('listitem').map((li) => li.dataset.testid);
    // 01–15/10: Ngô 3, Xương rồng 1, héo (03, 04, 07–09, 11–14) 9, nghỉ 1; các loài khác 0
    expect(ids.slice(0, 4)).toEqual(['garden-plant-corn', 'garden-plant-cactus', 'garden-wilted', 'garden-rest']);
    expect(ids.slice(4).every((id) => id!.startsWith('garden-plant-'))).toBe(true);
    const empty = within(garden).getAllByRole('listitem').map((li) => li.classList.contains('is-empty'));
    expect(empty.indexOf(true)).toBe(4);
    expect(empty.slice(4).every(Boolean)).toBe(true);
  });

  it('mặc định từ đầu tháng tới hôm nay', async () => {
    const { garden } = await openGarden();
    expect(within(garden).getByRole('heading', { name: 'Khu vườn' })).toBeInTheDocument();
    expect(within(garden).getByLabelText('Từ ngày')).toHaveValue('2026-10-01');
    expect(within(garden).getByLabelText('Đến ngày')).toHaveValue('2026-10-15');
  });

  it('Khu vườn là một tab: màn Lịch không còn nút Khu vườn', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    renderWithDeps(<CalendarScreen />, deps);
    await screen.findByTestId('calendar-card');
    expect(screen.queryByRole('button', { name: 'Khu vườn' })).not.toBeInTheDocument();
  });

  it('mỗi loài cây có số lần được chọn ở bên dưới; loài chưa trồng hiện mờ với số 0', async () => {
    const { garden } = await openGarden();
    await waitFor(() => expect(countOf(garden, 'corn')).toBe('3'));
    expect(countOf(garden, 'cactus')).toBe('1');
    expect(countOf(garden, 'rose')).toBe('0'); // 20/09 nằm ngoài khoảng
    expect(within(garden).getByTestId('garden-plant-rose')).toHaveClass('is-empty');
    expect(within(garden).getByTestId('garden-plant-corn')).not.toHaveClass('is-empty');
    // đủ mọi loài, nhiều nhất đứng đầu, vẽ ở dạng ra hoa
    const tiles = within(garden).getAllByTestId(/^garden-plant-/);
    expect(tiles).toHaveLength(CATALOG.plants.length);
    expect(tiles[0]).toHaveAttribute('data-testid', 'garden-plant-corn');
    expect(within(tiles[0]).getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom');
    expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('5 ngày');
    expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('1 ra hoa');
  });

  it('có luống Cây héo (ngày bỏ lỡ) và Ngày nghỉ, ngày nghỉ không tính cho cây', async () => {
    const { garden } = await openGarden();
    // 01/10 → 15/10 (hôm nay): bỏ lỡ 03, 04, 07, 08, 09, 11, 12, 13, 14 = 9 ngày; nghỉ 06/10
    const wilted = await within(garden).findByTestId('garden-wilted');
    await waitFor(() => expect(wilted.querySelector('.garden__count')!.textContent).toBe('9'));
    expect(within(wilted).getByText('Cây héo')).toBeInTheDocument();
    expect(within(wilted).getByTestId('plant-scene')).toHaveAttribute('data-mode', 'wilted');
    const rest = within(garden).getByTestId('garden-rest');
    expect(rest.querySelector('.garden__count')!.textContent).toBe('1');
    expect(within(rest).getByText('Ngày nghỉ')).toBeInTheDocument();
    expect(within(rest).getByTestId('plant-scene')).toHaveAttribute('data-mode', 'sleeping');
    expect(countOf(garden, 'corn')).toBe('3'); // 01, 02, 10/10; ngày nghỉ 06/10 không tính
    // hai luống riêng đứng sau các loài đã trồng (thứ tự đầy đủ: test "luống > 0 ngày…")
    const ids = within(garden).getAllByRole('listitem').map((b) => b.getAttribute('data-testid'));
    expect(ids.indexOf('garden-wilted')).toBeGreaterThan(ids.indexOf('garden-plant-cactus'));
    expect(ids.indexOf('garden-rest')).toBe(ids.indexOf('garden-wilted') + 1);
  });

  it('đổi ngày hoặc bấm nút nhanh thì báo cáo đổi theo', async () => {
    const { user, garden } = await openGarden();
    await waitFor(() => expect(countOf(garden, 'corn')).toBe('3'));
    fireEvent.change(within(garden).getByLabelText('Từ ngày'), { target: { value: '2026-10-03' } });
    await waitFor(() => expect(countOf(garden, 'corn')).toBe('1'));
    await user.click(within(garden).getByRole('button', { name: 'Tất cả' }));
    expect(within(garden).getByLabelText('Từ ngày')).toHaveValue('2026-09-20');
    await waitFor(() => expect(countOf(garden, 'rose')).toBe('1'));
    await user.click(within(garden).getByRole('button', { name: '30 ngày' }));
    expect(within(garden).getByLabelText('Từ ngày')).toHaveValue('2026-09-16');
    await user.click(within(garden).getByRole('button', { name: 'Tháng này' }));
    expect(within(garden).getByLabelText('Từ ngày')).toHaveValue('2026-10-01');
  });

  it('công tắc "Chỉ hiện cây đã trồng" ẩn mọi luống 0 ngày và được nhớ lại', async () => {
    const { deps, user, garden } = await openGarden();
    await waitFor(() => expect(countOf(garden, 'corn')).toBe('3'));
    await user.click(within(garden).getByRole('button', { name: 'Tuỳ chọn hiển thị' }));
    const toggle = within(garden).getByRole('switch', { name: 'Chỉ hiện cây đã trồng' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(within(garden).getByTestId('garden-plant-rose')).toBeInTheDocument();
    await user.click(toggle);
    await waitFor(() => expect(within(garden).queryByTestId('garden-plant-rose')).not.toBeInTheDocument());
    expect(within(garden).queryByTestId('garden-plant-sunflower')).not.toBeInTheDocument();
    const shown = within(garden).getAllByRole('listitem').map((li) => li.getAttribute('data-testid'));
    expect(shown).toEqual(['garden-plant-corn', 'garden-plant-cactus', 'garden-wilted', 'garden-rest']);
    await waitFor(async () => expect(await getSetting(deps.db, 'gardenOnlyPlanted')).toBe(true));
    // khoảng không có ngày nào thì báo nhẹ thay vì để trống
    fireEvent.change(within(garden).getByLabelText('Từ ngày'), { target: { value: '2026-09-01' } });
    fireEvent.change(within(garden).getByLabelText('Đến ngày'), { target: { value: '2026-09-10' } });
    expect(await within(garden).findByText('Chưa có cây nào trong khoảng này')).toBeInTheDocument();
    expect(within(garden).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('2 công tắc mặc định thu gọn; nút Tuỳ chọn hiển thị xổ ra / thu lại', async () => {
    const { user, garden } = await openGarden();
    const btn = within(garden).getByRole('button', { name: 'Tuỳ chọn hiển thị' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(btn.querySelector('svg[data-icon="options"]')).not.toBeNull();
    expect(within(garden).queryByRole('switch')).not.toBeInTheDocument();
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(within(garden).getByRole('switch', { name: 'Chỉ hiện cây đã trồng' })).toBeInTheDocument();
    expect(within(garden).getByRole('switch', { name: 'Tách riêng cây đặc biệt' })).toBeInTheDocument();
    await user.click(btn);
    expect(within(garden).queryByRole('switch')).not.toBeInTheDocument();
  });

  it('đang lọc mà thu gọn thì nút có chấm báo', async () => {
    const { user, garden } = await openGarden();
    const btn = within(garden).getByRole('button', { name: 'Tuỳ chọn hiển thị' });
    expect(btn.querySelector('.icon-btn__badge')).toBeNull();
    await user.click(btn);
    await user.click(within(garden).getByRole('switch', { name: 'Tách riêng cây đặc biệt' }));
    expect(btn.querySelector('.icon-btn__badge')).toBeNull(); // đang mở thì thấy công tắc rồi
    await user.click(btn);
    await waitFor(() => expect(btn.querySelector('.icon-btn__badge')).not.toBeNull());
  });

  it('nút Quay lại Lịch chuyển về tab Lịch', async () => {
    const { user, garden, nav } = await openGarden();
    await user.click(within(garden).getByRole('button', { name: 'Quay lại Lịch' }));
    expect(nav).toHaveBeenCalledWith('calendar');
  });
});

describe('Khu vườn và cây đặc biệt', () => {
  it('tổng kết có số ngày cây đặc biệt; công tắc tách riêng hiện luống theo loài + hiệu ứng', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await deps.db.days.bulkPut([
      makeDay({ date: '2026-10-01', plantId: 'corn', specialId: 'glow' }),
      makeDay({ date: '2026-10-02', plantId: 'corn' }),
      makeDay({ date: '2026-10-03', plantId: 'cherry', specialId: 'gold' }),
    ]);
    const user = userEvent.setup();
    renderWithDeps(<GardenScreen />, deps);
    const garden = await screen.findByTestId('garden');
    await waitFor(() => expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('✨ 2 đặc biệt'));
    expect(countOf(garden, 'corn')).toBe('2');
    expect(within(garden).queryByTestId(/^garden-special-/)).not.toBeInTheDocument();

    await user.click(within(garden).getByRole('button', { name: 'Tuỳ chọn hiển thị' }));
    const toggle = within(garden).getByRole('switch', { name: 'Tách riêng cây đặc biệt' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    const glow = await within(garden).findByTestId('garden-special-corn-glow');
    expect(glow.querySelector('.garden__count')!.textContent).toBe('1');
    expect(within(glow).getByText('Ngô · Phát sáng')).toBeInTheDocument();
    expect(within(glow).getByTestId('plant-scene')).toHaveAttribute('data-special', 'glow');
    expect(within(garden).getByTestId('garden-special-cherry-gold')).toBeInTheDocument();
    expect(countOf(garden, 'corn')).toBe('1');
    expect(countOf(garden, 'cherry')).toBe('0');
    await waitFor(async () => expect(await getSetting(deps.db, 'gardenSeparateSpecial')).toBe(true));
  });
});

describe('GardenScreen: English', () => {
  it('tóm tắt, nhãn và đơn vị số nhiều bằng English', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.bulkPut([
      makeDay({ date: '2026-10-01', plantId: 'corn', finalStage: 'bloom', todos: [{ id: 'a', text: 'x', done: true, doneAt: 1, order: 0, period: 'morning' }] }),
      makeDay({ date: '2026-10-02', plantId: 'corn' }),
    ]);
    renderWithDeps(<GardenScreen />, deps, undefined, 'en');
    const summary = await screen.findByTestId('garden-summary');
    await waitFor(() => expect(summary).toHaveTextContent(/^2 days · 1 bloom · 1 task · ✨ 0 special$/));
    expect(screen.getByRole('heading', { name: 'Garden' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Display options' })).toBeInTheDocument();
    expect(within(screen.getByTestId('garden-plant-corn')).getByText('days')).toBeInTheDocument();
    expect(within(screen.getByTestId('garden-wilted')).getByText('Wilted')).toBeInTheDocument();
  });
});

describe('Khu vườn: công tắc Cây | Thói quen', () => {
  it('công tắc Cây | Thói quen, nhớ lựa chọn, mở màn quản lý', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<GardenScreen />, deps);
    fireEvent.click(await screen.findByRole('tab', { name: 'Thói quen' }));
    expect(await screen.findByTestId('habit-report')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tuỳ chọn hiển thị' })).toBeNull();
    await waitFor(async () => expect(await getSetting(deps.db, 'gardenView')).toBe('habits'));
    fireEvent.click(screen.getByRole('button', { name: 'Quản lý thói quen' }));
    expect(await screen.findByTestId('habits-screen')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại Khu vườn' }));
    expect(await screen.findByTestId('habit-report')).toBeTruthy();
  });

  it('mở thẳng màn quản lý khi có yêu cầu từ Hôm nay', async () => {
    const { deps } = makeDeps();
    requestHabitManager();
    renderWithDeps(<GardenScreen />, deps);
    expect(await screen.findByTestId('habits-screen')).toBeTruthy();
    expect(screen.queryByLabelText('Tên thói quen')).toBeNull(); // chế độ danh sách
  });

  it('yêu cầu chế độ thêm từ Hôm nay: mở thẳng form thêm', async () => {
    const { deps } = makeDeps();
    requestHabitManager('add');
    renderWithDeps(<GardenScreen />, deps);
    expect(await screen.findByLabelText('Tên thói quen')).toBeTruthy();
  });

  it('trạng thái trống: nút "Thói quen đầu tiên" mở màn quản lý ở chế độ thêm', async () => {
    const { deps } = makeDeps();
    renderWithDeps(<GardenScreen />, deps);
    fireEvent.click(await screen.findByRole('tab', { name: 'Thói quen' }));
    fireEvent.click(await screen.findByRole('button', { name: '＋ Thói quen đầu tiên' }));
    expect(await screen.findByLabelText('Tên thói quen')).toBeTruthy();
  });

  it('đã lưu xem Thói quen: không nháy màn Cây trước khi báo cáo hiện', async () => {
    const { deps } = makeDeps();
    await setSetting(deps.db, 'gardenView', 'habits');
    const seen: string[] = [];
    const obs = new MutationObserver(() => {
      if (document.querySelector('[data-testid="garden-summary"],[data-testid^="garden-plant-"]')) seen.push('plants');
    });
    obs.observe(document.body, { childList: true, subtree: true });
    renderWithDeps(<GardenScreen />, deps);
    expect(document.querySelector('[data-testid="garden-summary"]')).toBeNull();
    expect(await screen.findByTestId('habit-report')).toBeTruthy();
    obs.disconnect();
    expect(seen).toEqual([]);
  });
});
