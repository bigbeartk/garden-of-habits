import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodayScreen } from '../../../src/screens/TodayScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';

async function addTodoViaPopup(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(await screen.findByRole('button', { name: 'Thêm việc mới' }));
  const dialog = await screen.findByRole('dialog', { name: 'Thêm việc cần làm' });
  await user.type(within(dialog).getByLabelText('Nội dung việc'), `${text}{Enter}`);
  return dialog;
}

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const user = userEvent.setup();
  renderWithDeps(<TodayScreen />, deps);
  return { deps, clock, user };
};

describe('TodayScreen', () => {
  it('thêm và tick việc làm cây lớn', async () => {
    const { user } = setup();
    await addTodoViaPopup(user, 'Uống nước');
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
    await addTodoViaPopup(user, 'Dọn nhà');
    await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' });
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    expect(await screen.findByTestId('rest-message')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thêm việc mới' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tiêu đề hôm nay')).not.toBeInTheDocument();
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

describe('TodayScreen cây đặc biệt', () => {
  it('lần đầu mở ngày có cây đặc biệt thì có hiệu ứng ✨ chào', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', plantId: 'cherry', potId: 'polka', specialId: 'glow' }));
    renderWithDeps(<TodayScreen />, deps);
    expect(await screen.findByTestId('special-intro')).toHaveTextContent('Phát sáng');
  });
});

describe('TodayScreen tiêu đề ngày và nút thêm việc', () => {
  it('ô ở đầu danh sách là tiêu đề ngày, lưu khi Enter', async () => {
    const { deps, user } = setup();
    const input = await screen.findByLabelText('Tiêu đề hôm nay');
    expect(input).toHaveAttribute('placeholder', 'Đặt tiêu đề cho hôm nay…');
    await user.type(input, 'Ngày dọn nhà{Enter}');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.title).toBe('Ngày dọn nhà'));
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(0);
  });

  it('tiêu đề lưu khi chạm ra ngoài ô và hiện lại khi mở màn hình', async () => {
    const { deps, user } = setup();
    await user.type(await screen.findByLabelText('Tiêu đề hôm nay'), 'Thứ Sáu vui vẻ');
    await user.click(screen.getByRole('heading', { name: 'Hôm nay' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.title).toBe('Thứ Sáu vui vẻ'));
  });

  it('popup thêm việc vẫn mở để thêm liên tiếp nhiều việc', async () => {
    const { deps, user } = setup();
    const dialog = await addTodoViaPopup(user, 'Việc một');
    await user.type(within(dialog).getByLabelText('Nội dung việc'), 'Việc hai');
    await user.click(within(dialog).getByRole('button', { name: 'Thêm' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => t.text)).toEqual(['Việc một', 'Việc hai']));
    expect(within(dialog).getByLabelText('Nội dung việc')).toHaveValue('');
    expect(screen.getByRole('dialog', { name: 'Thêm việc cần làm' })).toBeInTheDocument();
  });

  it('nội dung trống thì không thêm việc', async () => {
    const { deps, user } = setup();
    await addTodoViaPopup(user, '   ');
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(0);
  });
});
