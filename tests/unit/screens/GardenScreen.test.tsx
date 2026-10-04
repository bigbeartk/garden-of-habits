import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import { getSetting } from '../../../src/db/settings';

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
  renderWithDeps(<CalendarScreen />, deps);
  const btn = await screen.findByRole('button', { name: 'Khu vườn' });
  expect(btn.querySelector('svg[data-icon="garden"]')).not.toBeNull();
  await user.click(btn);
  const garden = await screen.findByTestId('garden');
  return { deps, user, garden };
}

const countOf = (garden: HTMLElement, id: string) => within(garden).getByTestId(`garden-plant-${id}`).querySelector('.garden__count')!.textContent;

describe('Khu vườn (báo cáo từ ngày tới ngày)', () => {
  it('nút Khu vườn ở màn Lịch mở báo cáo; mặc định từ đầu tháng tới hôm nay', async () => {
    const { garden } = await openGarden();
    expect(within(garden).getByRole('heading', { name: 'Khu vườn' })).toBeInTheDocument();
    expect(within(garden).getByLabelText('Từ ngày')).toHaveValue('2026-10-01');
    expect(within(garden).getByLabelText('Đến ngày')).toHaveValue('2026-10-15');
    expect(screen.queryByTestId('calendar-card')).not.toBeInTheDocument();
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
    expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('1 ngày ra hoa');
  });

  it('có luống Cây héo (ngày bỏ lỡ) và Ngày nghỉ ở cuối vườn, ngày nghỉ không tính cho cây', async () => {
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
    // hai luống đặc biệt đứng sau mọi loài cây
    const beds = within(garden).getAllByRole('listitem');
    expect(beds.slice(-2).map((b) => b.getAttribute('data-testid'))).toEqual(['garden-wilted', 'garden-rest']);
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

  it('nút Quay lại Lịch trở về lưới lịch', async () => {
    const { user, garden } = await openGarden();
    await user.click(within(garden).getByRole('button', { name: 'Quay lại Lịch' }));
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
  });
});
