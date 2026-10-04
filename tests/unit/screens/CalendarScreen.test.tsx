import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CalendarScreen } from '../../../src/screens/CalendarScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import { setSetting } from '../../../src/db/settings';
import { addPlanned, getPlannedGoal } from '../../../src/domain/plannedService';


async function setup() {
  const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
  await deps.db.days.bulkPut([
    makeDay({ date: '2026-10-02', plantId: 'cherry', potId: 'polka', finalStage: 'bloom', specialId: 'glow', note: 'vui',
      todos: [{ id: 'a', text: 'Tập yoga', done: true, doneAt: 1, order: 0, period: 'morning' }, { id: 'b', text: 'Đọc sách', done: false, doneAt: null, order: 1, period: 'evening' }] }),
    makeDay({ date: '2026-10-03', isRestDay: true }),
  ]);
  const nav = vi.fn();
  const user = userEvent.setup();
  renderWithDeps(<CalendarScreen />, deps, nav);
  return { deps, nav, user };
}

describe('CalendarScreen', () => {
  it('hiển thị trạng thái từng ngày', async () => {
    await setup();
    // danh sách ngày và "ngày đầu tiên" là hai truy vấn riêng, có thể về lệch nhau
    await waitFor(() => {
      expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant');
      expect(screen.getByTestId('day-2026-10-04')).toHaveAttribute('data-status', 'missed');
    });
    expect(screen.getByTestId('day-2026-10-03')).toHaveAttribute('data-status', 'rest');
    expect(screen.getByTestId('day-2026-10-01')).toHaveAttribute('data-status', 'before-start');
    expect(screen.getByTestId('day-2026-10-15')).toHaveAttribute('data-status', 'today-pending');
    expect(screen.getByTestId('day-2026-10-20')).toHaveAttribute('data-status', 'future');
    expect(within(screen.getByTestId('day-2026-10-03')).getByTestId('sleeping-seed')).toBeInTheDocument();
    expect(within(screen.getByTestId('day-2026-10-04')).getByTestId('wilted-plant')).toBeInTheDocument();
  });

  it('chuyển tháng trước và tháng sau (để lên lịch), tối đa 12 tháng tới', async () => {
    const { user } = await setup();
    expect(screen.getByRole('heading', { name: 'Tháng 10, 2026' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tháng trước' }));
    expect(screen.getByRole('heading', { name: 'Tháng 9, 2026' })).toBeInTheDocument();
    for (let i = 0; i < 13; i++) await user.click(screen.getByRole('button', { name: 'Tháng sau' }));
    expect(screen.getByRole('heading', { name: 'Tháng 10, 2027' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tháng sau' })).toBeDisabled();
  });

  it('ngày đã qua: chỉ xem, việc chia theo Sáng/Chiều/Tối, ghi chú không sửa được', async () => {
    const { user } = await setup();
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).getByText(/Cherry · Ra hoa/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Phát sáng/)).toBeInTheDocument();
    expect(within(within(dialog).getByTestId('detail-section-morning')).getByText('Tập yoga')).toBeInTheDocument();
    expect(within(within(dialog).getByTestId('detail-section-evening')).getByText('Đọc sách')).toBeInTheDocument();
    expect(within(within(dialog).getByTestId('detail-section-afternoon')).getByText('Chưa có việc')).toBeInTheDocument();
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Lưu ghi chú' })).not.toBeInTheDocument();
    expect(within(dialog).getByTestId('detail-note')).toHaveTextContent('vui');
  });

  it('chạm vào hôm nay thì chuyển thẳng sang màn Hôm nay (không mở bảng)', async () => {
    const { nav, user } = await setup();
    await user.click(await screen.findByTestId('day-2026-10-15'));
    expect(nav).toHaveBeenCalledWith('today');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('CalendarScreen trong suốt khi có ảnh nền', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:bg' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  });

  it('không có ảnh nền: thẻ lịch giữ nền trắng', async () => {
    await setup();
    await screen.findByTestId('day-2026-10-02');
    expect(screen.getByTestId('calendar-card')).not.toHaveClass('is-glass');
    expect(screen.getByTestId('calendar-head')).not.toHaveClass('is-glass');
  });

  it('có ảnh nền: thẻ tháng và lưới ngày chuyển sang kính mờ trong suốt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([1, 2, 3]).buffer });
    renderWithDeps(<CalendarScreen />, deps);
    await waitFor(() => expect(screen.getByTestId('calendar-card')).toHaveClass('is-glass'));
    expect(screen.getByTestId('calendar-head')).toHaveClass('is-glass');
  });

  it('nền là video: phát bằng thẻ video tự chạy, không tiếng, lặp, phát ngay trong trang', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarBg', { mime: 'video/mp4', data: new Uint8Array([1, 2, 3]).buffer });
    await setSetting(deps.db, 'calendarTheme', 'photo');
    renderWithDeps(<CalendarScreen />, deps);
    const video = (await screen.findByTestId('calendar-video')) as HTMLVideoElement;
    expect(video.tagName).toBe('VIDEO');
    expect(video.muted).toBe(true);
    expect(video.loop).toBe(true);
    expect(video.autoplay).toBe(true);
    expect(video).toHaveAttribute('playsinline');
    expect(video.getAttribute('src')).toMatch(/^blob:/);
    // video thay cho ảnh nền tĩnh
    expect(document.querySelector('.screen--calendar')!.getAttribute('style') ?? '').not.toContain('background-image');
    expect(screen.getByTestId('calendar-card')).toHaveClass('is-glass');
  });

  it('nền là GIF: dùng làm ảnh nền (tự chuyển động), không có thẻ video', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarBg', { mime: 'image/gif', data: new Uint8Array([1, 2, 3]).buffer });
    await setSetting(deps.db, 'calendarTheme', 'photo');
    renderWithDeps(<CalendarScreen />, deps);
    await waitFor(() => expect(document.querySelector('.screen--calendar')!.getAttribute('style') ?? '').toContain('background-image'));
    expect(screen.queryByTestId('calendar-video')).not.toBeInTheDocument();
  });

  it('ô chọn tệp nhận cả ảnh và video', async () => {
    await setup();
    expect(screen.getByTestId('bg-input')).toHaveAttribute('accept', 'image/*,video/*');
  });
});

describe('CalendarScreen tiêu đề ngày', () => {
  it('bảng chi tiết ngày cũ hiện tiêu đề (chỉ để xem)', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', title: 'Đi chơi công viên' }));
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).getByRole('heading', { name: 'Đi chơi công viên' })).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Mục tiêu hôm nay')).not.toBeInTheDocument();
  });
});

describe('CalendarScreen lên lịch việc cho ngày tương lai', () => {
  it('ô ngày tương lai bấm được và hiện số việc đã lên lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await addPlanned(deps, '2026-10-20', 'Khám răng', 'morning');
    await addPlanned(deps, '2026-10-20', 'Mua quà', 'evening');
    renderWithDeps(<CalendarScreen />, deps);
    const cell = await screen.findByTestId('day-2026-10-20');
    expect(cell).toHaveAttribute('data-status', 'future');
    expect(cell).toBeEnabled();
    expect(await within(cell).findByTestId('planned-count')).toHaveTextContent('2');
    expect(cell).toHaveAccessibleName(/2 việc đã lên lịch/);
  });

  it('chạm ngày tương lai: mở màn giống Hôm nay (không phải bảng trên Lịch)', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    const future = await screen.findByTestId('future-day');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('calendar-card')).not.toBeInTheDocument();
    expect(within(future).getByRole('heading', { name: 'Thứ Ba, 20/10/2026' })).toBeInTheDocument();
    expect(within(future).getByTestId('plant-scene')).toHaveAttribute('data-mode', 'sleeping');
    expect(within(future).getByTestId('speech-bubble')).toHaveTextContent('Hẹn gặp bạn vào Thứ Ba nha!');
    for (const p of ['morning', 'afternoon', 'evening']) expect(within(future).getByTestId(`todo-section-${p}`)).toBeInTheDocument();
    expect(within(future).queryByRole('button', { name: 'Đổi cây' })).not.toBeInTheDocument();
  });

  it('màn ngày tương lai: nút ＋ thêm việc theo buổi, sửa, xoá; không có ô tick', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    expect(screen.queryByRole('button', { name: 'Thêm việc mới' })).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Thêm việc buổi Chiều' }));
    await user.type(screen.getByLabelText('Việc mới buổi Chiều'), 'Khám răng{Enter}');
    const afternoon = screen.getByTestId('todo-section-afternoon');
    expect(await within(afternoon).findByText('Khám răng')).toBeInTheDocument();
    expect(screen.getByText('1 việc')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    const saved = await deps.db.planned.toArray();
    expect(saved.map((p) => [p.date, p.text, p.period])).toEqual([['2026-10-20', 'Khám răng', 'afternoon']]);

    await user.click(within(afternoon).getByText('Khám răng'));
    const edit = within(afternoon).getByLabelText('Sửa việc');
    await user.clear(edit);
    await user.type(edit, 'Khám răng 9h{Enter}');
    await waitFor(async () => expect((await deps.db.planned.toArray())[0].text).toBe('Khám răng 9h'));

    await user.click(await within(afternoon).findByRole('button', { name: 'Xoá: Khám răng 9h' }));
    // phải xác nhận mới xoá
    expect(await deps.db.planned.count()).toBe(1);
    await user.click(within(afternoon).getByRole('button', { name: 'Thôi' }));
    expect(within(afternoon).getByText('Khám răng 9h')).toBeInTheDocument();
    await user.click(within(afternoon).getByRole('button', { name: 'Xoá: Khám răng 9h' }));
    await user.click(within(afternoon).getByRole('button', { name: 'Xác nhận xoá: Khám răng 9h' }));
    await waitFor(async () => expect(await deps.db.planned.count()).toBe(0));
  });

  it('nút ‹ Lịch quay lại lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    await user.click(await screen.findByRole('button', { name: 'Quay lại Lịch' }));
    expect(await screen.findByTestId('calendar-card')).toBeInTheDocument();
  });

  it('ngày đã qua và hôm nay không có ô lên lịch', async () => {
    const { user } = await setup();
    await waitFor(() => expect(screen.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'plant'));
    await user.click(screen.getByTestId('day-2026-10-02'));
    const dialog = await screen.findByRole('dialog', { name: 'Thứ Sáu, 02/10/2026' });
    expect(within(dialog).queryByLabelText('Việc cho ngày này')).not.toBeInTheDocument();
  });
});

describe('màn ngày tương lai: nút quay lại và mục tiêu', () => {
  it('nút quay lại chỉ có mũi tên', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    const back = await screen.findByRole('button', { name: 'Quay lại Lịch' });
    expect(back.querySelector('svg[data-icon="back"]')).not.toBeNull();
    expect(back.textContent).toBe('');
  });

  it('đặt mục tiêu cho ngày tương lai, mở lại vẫn còn', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    await user.click(await screen.findByTestId('day-2026-10-20'));
    const input = await screen.findByLabelText('Mục tiêu ngày này');
    expect(input).toHaveAttribute('placeholder', 'Đặt mục tiêu cho ngày này…');
    await user.type(input, 'Đi khám răng{Enter}');
    await waitFor(async () => expect(await getPlannedGoal(deps.db, '2026-10-20')).toBe('Đi khám răng'));
    await user.click(screen.getByRole('button', { name: 'Quay lại Lịch' }));
    await user.click(await screen.findByTestId('day-2026-10-20'));
    const reopened = await screen.findByLabelText('Mục tiêu ngày này');
    await waitFor(() => expect(reopened).toHaveValue('Đi khám răng'));
  });
});

describe('CalendarScreen hình nền', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:bg' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  });

  it('màn Lịch có nút đổi hình nền chỉ là icon (không chữ), bấm mở bảng chọn', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<CalendarScreen />, deps);
    const toggle = await screen.findByRole('button', { name: /Đổi hình nền lịch/ });
    expect(toggle.textContent).toBe('');
    expect(screen.queryByRole('radiogroup', { name: 'Hình nền lịch' })).not.toBeInTheDocument();
    await user.click(toggle);
    expect(await screen.findByRole('radiogroup', { name: 'Hình nền lịch' })).toBeInTheDocument();
  });

  it.each(['cat', 'grass', 'rain', 'gamer'] as const)('nền động %s hiện sau lịch, thẻ lịch kính mờ', async (theme) => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarTheme', theme);
    renderWithDeps(<CalendarScreen />, deps);
    expect(await screen.findByTestId(`calendar-theme-${theme}`)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('calendar-card')).toHaveClass('is-glass'));
  });

  it('mặc định: không có nền động, thẻ lịch trắng', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarTheme', 'default');
    renderWithDeps(<CalendarScreen />, deps);
    await screen.findByTestId('calendar-card');
    expect(screen.queryByTestId(/calendar-theme-/)).not.toBeInTheDocument();
    expect(screen.getByTestId('calendar-card')).not.toHaveClass('is-glass');
  });
});

describe('CalendarScreen ẩn nút đổi hình nền theo cài đặt', () => {
  it('cài đặt tắt thì trang Lịch không có nút đổi hình nền', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await setSetting(deps.db, 'showCalendarBgButton', false);
    renderWithDeps(<CalendarScreen />, deps);
    await screen.findByTestId('calendar-card');
    await waitFor(() => expect(screen.queryByRole('button', { name: /Đổi hình nền lịch/ })).not.toBeInTheDocument());
  });
});

describe('CalendarScreen chấm đỏ ngày có ghi chú', () => {
  it('mặc định hiện chấm; cài đặt tắt thì ẩn', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 15, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-03', note: 'Vui' }));
    renderWithDeps(<CalendarScreen />, deps);
    const cell = await screen.findByTestId('day-2026-10-03');
    await waitFor(() => expect(within(cell).getByTestId('note-dot')).toBeInTheDocument());
    await setSetting(deps.db, 'showNoteDot', false);
    await waitFor(() => expect(within(cell).queryByTestId('note-dot')).not.toBeInTheDocument());
  });
});
