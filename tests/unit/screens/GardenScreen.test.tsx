import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

async function openGarden() {
  const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
  await deps.db.days.bulkPut([
    makeDay({ date: '2026-09-20', plantId: 'rose' }),
    makeDay({ date: '2026-10-01', plantId: 'corn', finalStage: 'bloom' }),
    makeDay({ date: '2026-10-02', plantId: 'corn' }),
    makeDay({ date: '2026-10-05', plantId: 'cactus' }),
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
    expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('4 ngày');
    expect(within(garden).getByTestId('garden-summary')).toHaveTextContent('1 ngày ra hoa');
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

  it('nút Quay lại Lịch trở về lưới lịch', async () => {
    const { user, garden } = await openGarden();
    await user.click(within(garden).getByRole('button', { name: 'Quay lại Lịch' }));
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
  });
});
