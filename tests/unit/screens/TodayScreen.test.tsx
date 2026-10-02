import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayScreen } from '../../../src/screens/TodayScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const user = userEvent.setup();
  renderWithDeps(<TodayScreen />, deps);
  return { deps, clock, user };
};

describe('TodayScreen', () => {
  it('thêm và tick việc làm cây lớn', async () => {
    const { user } = setup();
    await user.type(await screen.findByLabelText('Thêm việc cần làm'), 'Uống nước{Enter}');
    const box = await screen.findByRole('checkbox', { name: 'Hoàn thành: Uống nước' });
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'seed');
    await user.click(box);
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom'));
    expect(screen.getByText('1/1 việc')).toBeInTheDocument();
  });

  it('cây chào lần đầu trong ngày và ghi lại đã chào', async () => {
    const { deps } = setup();
    expect(await screen.findByTestId('speech-bubble')).toBeInTheDocument();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))?.greetedAt).not.toBeNull());
  });

  it('ngày tiết kiệm năng lượng: ẩn danh sách, cây ngủ, giữ việc', async () => {
    const { deps, user } = setup();
    await user.type(await screen.findByLabelText('Thêm việc cần làm'), 'Dọn nhà{Enter}');
    await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' });
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    expect(await screen.findByTestId('rest-message')).toBeInTheDocument();
    expect(screen.queryByLabelText('Thêm việc cần làm')).not.toBeInTheDocument();
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-mode', 'sleeping');
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Thức dậy' }));
    expect(await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' })).toBeInTheDocument();
  });

  it('đổi cây qua bảng chọn', async () => {
    const { user } = setup();
    const current = (await screen.findByTestId('plant-scene')).getAttribute('data-plant');
    const [targetName, targetId] = current === 'corn' ? ['Xương rồng', 'cactus'] : ['Ngô', 'corn'];
    await user.click(screen.getByRole('button', { name: 'Đổi cây' }));
    const dialog = await screen.findByRole('dialog', { name: 'Chọn cây hôm nay' });
    await user.click(within(dialog).getByRole('button', { name: targetName }));
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-plant', targetId));
  });

  it('ghi chú cho hôm nay', async () => {
    const { deps, user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Ghi chú' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ghi chú hôm nay' });
    await user.type(within(dialog).getByLabelText('Nội dung ghi chú'), 'Trời đẹp');
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('Trời đẹp'));
  });
});
