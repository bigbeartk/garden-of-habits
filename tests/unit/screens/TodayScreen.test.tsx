import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TodayScreen } from '../../../src/screens/TodayScreen';
import { CATALOG } from '../../../src/content/catalog';
import { BLOOM_PRAISES, COMMON_PRAISES } from '../../../src/content/praises';
import { COMMON_SAYINGS } from '../../../src/content/sayings';
import { COMMON_TAPS, SLEEPY_TAPS } from '../../../src/content/taps';
import { getSpecies } from '../../../src/content/plants/registry';
import { makeDay, makeDeps, renderWithDeps } from '../helpers';
import { getSetting, setSetting } from '../../../src/db/settings';

/** Bấm ＋ ở hàng tiêu đề của buổi rồi gõ vào dòng việc trống vừa hiện. */
async function addTodoInline(user: ReturnType<typeof userEvent.setup>, text: string, period: 'Sáng' | 'Chiều' | 'Tối' = 'Sáng') {
  await user.click(await screen.findByRole('button', { name: `Thêm việc buổi ${period}` }));
  await user.type(screen.getByLabelText(`Việc mới buổi ${period}`), `${text}{Enter}`);
}

const setup = () => {
  const { deps, clock } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
  const user = userEvent.setup();
  const nav = vi.fn();
  renderWithDeps(<TodayScreen />, deps, nav);
  return { deps, clock, user, nav };
};

describe('TodayScreen', () => {
  it('thêm và tick việc làm cây lớn', async () => {
    const { user } = setup();
    await addTodoInline(user, 'Uống nước');
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
    await addTodoInline(user, 'Dọn nhà');
    await screen.findByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' });
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    expect(await screen.findByTestId('rest-message')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Thêm việc/ })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Mục tiêu hôm nay')).not.toBeInTheDocument();
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

  it('chạm vào cây thì cây cười và nói một câu; chạm tiếp thì đổi câu', async () => {
    const { deps, user } = setup();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))?.greetedAt).not.toBeNull());
    const scene = await screen.findByTestId('plant-scene');
    const species = getSpecies(scene.getAttribute('data-plant')!);
    await user.click(screen.getByRole('button', { name: 'Chạm vào cây' }));
    const bubble = await screen.findByTestId('speech-bubble');
    await waitFor(() => expect(bubble).toHaveAttribute('data-kind', 'tap'));
    const first = bubble.textContent!;
    expect([...COMMON_TAPS, ...(species.taps ?? [])]).toContain(first);
    expect(scene).toHaveAttribute('data-mood', 'smile');
    await user.click(screen.getByRole('button', { name: 'Chạm vào cây' }));
    await waitFor(() => expect(screen.getByTestId('speech-bubble').textContent).not.toBe(first));
  });

  it('ngày tiết kiệm năng lượng: chạm cây thì cây vẫn ngủ và nói câu ngái ngủ', async () => {
    const { user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    await screen.findByTestId('rest-message');
    await user.click(screen.getByRole('button', { name: 'Chạm vào cây' }));
    await waitFor(() => expect(SLEEPY_TAPS).toContain(screen.getByTestId('speech-bubble').textContent));
    expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-mood', 'sleep');
  });

  it('chưa gặp cây đặc biệt nào thì bảng chọn cây hiện lời gợi ý', async () => {
    const { user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Đổi cây' }));
    const dialog = await screen.findByRole('dialog', { name: 'Chọn cây hôm nay' });
    expect(within(dialog).getByText(/10% cơ hội gặp cây đặc biệt/)).toBeInTheDocument();
  });

  it('chọn lại cây đặc biệt đã mở khoá, chọn loài thường thì thành cây thường', async () => {
    const { deps, user } = setup();
    await setSetting(deps.db, 'unlockedSpecials', ['corn|glow']);
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Đổi cây' }));
    const dialog = await screen.findByRole('dialog', { name: 'Chọn cây hôm nay' });
    await user.click(await within(dialog).findByRole('button', { name: 'Ngô · Phát sáng' }));
    const scene = screen.getByTestId('plant-scene');
    await waitFor(() => expect(scene).toHaveAttribute('data-special', 'glow'));
    expect(scene).toHaveAttribute('data-plant', 'corn');

    await user.click(screen.getByRole('button', { name: 'Đổi cây' }));
    const again = await screen.findByRole('dialog', { name: 'Chọn cây hôm nay' });
    expect(within(again).getByRole('button', { name: 'Ngô · Phát sáng' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(again).getByRole('button', { name: 'Ngô' })).toHaveAttribute('aria-pressed', 'false');
    await user.click(within(again).getByRole('button', { name: 'Ngô' }));
    await waitFor(() => expect(screen.getByTestId('plant-scene')).toHaveAttribute('data-special', ''));
  });

  it('ghi chú tự lưu khi gõ, không có nút Lưu, gõ tiếp không bị mất chữ', async () => {
    const { deps, user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Ghi chú' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ghi chú hôm nay' });
    expect(within(dialog).queryByRole('button', { name: 'Lưu' })).not.toBeInTheDocument();
    const box = within(dialog).getByLabelText('Nội dung ghi chú');
    await user.type(box, 'Trời đẹp');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('Trời đẹp'));
    await user.type(box, ' quá');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('Trời đẹp quá'));
    expect(box).toHaveValue('Trời đẹp quá');
    expect(screen.getByRole('dialog', { name: 'Ghi chú hôm nay' })).toBeInTheDocument();
  });

  it('đóng ngay sau khi gõ thì ghi chú vẫn được lưu', async () => {
    const { deps, user } = setup();
    await screen.findByTestId('plant-scene');
    await user.click(screen.getByRole('button', { name: 'Ghi chú' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ghi chú hôm nay' });
    await user.type(within(dialog).getByLabelText('Nội dung ghi chú'), 'Vui');
    await user.click(within(dialog).getByRole('button', { name: 'Đóng' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.note).toBe('Vui'));
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
    const input = await screen.findByLabelText('Mục tiêu hôm nay');
    expect(input).toHaveAttribute('placeholder', 'Đặt mục tiêu cho hôm nay…');
    await user.type(input, 'Ngày dọn nhà{Enter}');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.title).toBe('Ngày dọn nhà'));
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(0);
  });

  it('tiêu đề lưu khi chạm ra ngoài ô và hiện lại khi mở màn hình', async () => {
    const { deps, user } = setup();
    await user.type(await screen.findByLabelText('Mục tiêu hôm nay'), 'Thứ Sáu vui vẻ');
    await user.click(screen.getByRole('heading', { name: 'Hôm nay' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.title).toBe('Thứ Sáu vui vẻ'));
  });

  it('Enter lưu việc và mở ngay dòng trống mới để gõ tiếp', async () => {
    const { deps, user } = setup();
    await addTodoInline(user, 'Việc một');
    const draft = screen.getByLabelText('Việc mới buổi Sáng');
    expect(draft).toHaveValue('');
    expect(draft).toHaveFocus();
    await user.type(draft, 'Việc hai{Enter}');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => t.text)).toEqual(['Việc một', 'Việc hai']));
  });

  it('dòng trống bỏ trống rồi chạm ra ngoài thì biến mất, không thêm việc', async () => {
    const { deps, user } = setup();
    await addTodoInline(user, '   ');
    await user.click(screen.getByRole('heading', { name: 'Hôm nay' }));
    expect(screen.queryByLabelText('Việc mới buổi Sáng')).not.toBeInTheDocument();
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(0);
  });

  it('gõ dở rồi chạm ra ngoài thì vẫn lưu việc', async () => {
    const { deps, user } = setup();
    await user.click(await screen.findByRole('button', { name: 'Thêm việc buổi Chiều' }));
    await user.type(screen.getByLabelText('Việc mới buổi Chiều'), 'Đi chợ');
    await user.click(screen.getByRole('heading', { name: 'Hôm nay' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.todos.map((t) => [t.text, t.period])).toEqual([['Đi chợ', 'afternoon']]));
    expect(screen.queryByLabelText('Việc mới buổi Chiều')).not.toBeInTheDocument();
  });

  it('không còn nút ＋ nổi', async () => {
    setup();
    await screen.findByTestId('plant-scene');
    expect(screen.queryByRole('button', { name: 'Thêm việc mới' })).not.toBeInTheDocument();
  });
});

describe('TodayScreen chia việc theo buổi', () => {
  it('luôn hiện đủ 3 mục Sáng, Chiều, Tối; mục trống ghi "Chưa có việc"', async () => {
    setup();
    for (const p of ['morning', 'afternoon', 'evening']) {
      const section = await screen.findByTestId(`todo-section-${p}`);
      expect(within(section).getByText('Chưa có việc')).toBeInTheDocument();
    }
    expect(within(screen.getByTestId('todo-section-morning')).getByRole('heading', { name: /Sáng/ })).toBeInTheDocument();
    expect(within(screen.getByTestId('todo-section-afternoon')).getByRole('heading', { name: /Chiều/ })).toBeInTheDocument();
    expect(within(screen.getByTestId('todo-section-evening')).getByRole('heading', { name: /Tối/ })).toBeInTheDocument();
  });

  it('mỗi buổi có nút ＋ ở cuối hàng tiêu đề; việc vào đúng buổi và mỗi mục đếm riêng', async () => {
    const { deps, user } = setup();
    for (const [p, label] of [['morning', 'Sáng'], ['afternoon', 'Chiều'], ['evening', 'Tối']]) {
      const head = within(await screen.findByTestId(`todo-section-${p}`)).getByRole('heading', { name: new RegExp(label) }).closest('header')!;
      const add = within(head).getByRole('button', { name: `Thêm việc buổi ${label}` });
      expect(head.lastElementChild).toBe(add); // ngoài cùng bên phải
    }
    await addTodoInline(user, 'Ăn sáng');
    await addTodoInline(user, 'Đọc truyện', 'Tối');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(2));
    const morning = screen.getByTestId('todo-section-morning');
    const evening = screen.getByTestId('todo-section-evening');
    expect(within(morning).getByRole('checkbox', { name: 'Hoàn thành: Ăn sáng' })).toBeInTheDocument();
    expect(await within(evening).findByRole('checkbox', { name: 'Hoàn thành: Đọc truyện' })).toBeInTheDocument();
    expect(within(evening).getByText('0/1')).toBeInTheDocument();
  });
});

describe('TodayScreen cây khen', () => {
  it('xong một việc thì cây nói lời khen', async () => {
    const { user } = setup();
    await addTodoInline(user, 'Việc A');
    await addTodoInline(user, 'Việc B');
    await user.click(await screen.findByRole('checkbox', { name: 'Hoàn thành: Việc A' }));
    const species = getSpecies(screen.getByTestId('plant-scene').getAttribute('data-plant')!);
    const pool = [...COMMON_PRAISES, ...(species.praises ?? [])];
    await waitFor(() => expect(pool).toContain(screen.getByTestId('speech-bubble').textContent));
  });

  it('xong việc cuối cùng (ra hoa) thì khen đặc biệt', async () => {
    const { user } = setup();
    await addTodoInline(user, 'Việc duy nhất');
    await user.click(await screen.findByRole('checkbox', { name: 'Hoàn thành: Việc duy nhất' }));
    await waitFor(() => expect(BLOOM_PRAISES).toContain(screen.getByTestId('speech-bubble').textContent));
  });
});

describe('TodayScreen icon dưới chậu cây', () => {
  it('4 nút dùng icon SVG tự vẽ, không dùng emoji', async () => {
    const { user } = setup();
    await screen.findByTestId('plant-scene');
    const expected: [string, string][] = [['Đổi cây', 'plant-swap'], ['Đổi chậu', 'pot'], ['Ghi chú', 'note'], ['Ngày tiết kiệm năng lượng', 'sleep-seed']];
    for (const [name, icon] of expected) {
      const btn = screen.getByRole('button', { name });
      expect(btn.querySelector(`svg[data-icon="${icon}"]`)).not.toBeNull();
      expect(btn.textContent).toBe('');
    }
    await user.click(screen.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }));
    expect((await screen.findByRole('button', { name: 'Thức dậy' })).querySelector('svg[data-icon="sun"]')).not.toBeNull();
  });
});

describe('TodayScreen nút quay lại', () => {
  it('góc trái trên có nút mũi tên (không chữ) quay về Lịch', async () => {
    const { user, nav } = setup();
    const back = await screen.findByRole('button', { name: 'Quay lại Lịch' });
    expect(back.querySelector('svg[data-icon="back"]')).not.toBeNull();
    expect(back.textContent).toBe('');
    await user.click(back);
    expect(nav).toHaveBeenCalledWith('calendar');
  });
});

describe('TodayScreen xoá việc cần xác nhận', () => {
  it('bấm × chưa xoá; bấm Thôi thì giữ; bấm Xoá mới xoá', async () => {
    const { deps, user } = setup();
    await addTodoInline(user, 'Rửa bát');
    await user.click(await screen.findByRole('button', { name: 'Xoá: Rửa bát' }));
    expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Thôi' }));
    expect(screen.getByRole('checkbox', { name: 'Hoàn thành: Rửa bát' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xoá: Rửa bát' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận xoá: Rửa bát' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.todos).toHaveLength(0));
  });
});

describe('TodayScreen lời cây nói của ngày', () => {
  const setupDay = async (extra: Partial<Parameters<typeof makeDay>[0]> = {}) => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-02', greetedAt: 1, ...extra }));
    const user = userEvent.setup();
    renderWithDeps(<TodayScreen />, deps);
    await screen.findByTestId('plant-scene');
    return { deps, user };
  };

  it('ngày chưa có câu thì cây tự chọn một câu, lưu lại và nói cả ngày', async () => {
    const { deps } = setup();
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))?.speech).toBeTruthy());
    const day = (await deps.db.days.get('2026-10-02'))!;
    expect([...COMMON_SAYINGS, ...(getSpecies(day.plantId).sayings ?? [])]).toContain(day.speech);
    await waitFor(() => expect(screen.getByTestId('speech-bubble')).toHaveTextContent(day.speech!));
    expect(screen.getByTestId('speech-bubble')).toHaveAttribute('data-kind', 'daily');
  });

  it('đã có câu (kể cả rỗng) thì không chọn lại', async () => {
    const { deps } = await setupDay({ speech: 'Câu của mình' });
    expect(await screen.findByTestId('speech-bubble')).toHaveTextContent('Câu của mình');
    await deps.db.days.update('2026-10-02', { speech: '' });
    await waitFor(() => expect(screen.getByTestId('speech-bubble')).toHaveAttribute('data-empty', 'true'));
    expect((await deps.db.days.get('2026-10-02'))!.speech).toBe('');
  });

  it('chạm bong bóng để sửa: Enter thì lưu, Escape thì huỷ', async () => {
    const { deps, user } = await setupDay({ speech: 'Câu cũ' });
    await user.click(await screen.findByRole('button', { name: 'Sửa lời cây nói' }));
    const box = screen.getByLabelText('Lời cây nói');
    expect(box).toHaveFocus();
    await user.clear(box);
    await user.type(box, 'Cố lên nhé{Enter}');
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.speech).toBe('Cố lên nhé'));
    await waitFor(() => expect(screen.getByTestId('speech-bubble')).toHaveTextContent('Cố lên nhé'));
    await user.click(screen.getByRole('button', { name: 'Sửa lời cây nói' }));
    await user.type(screen.getByLabelText('Lời cây nói'), ' bỏ{Escape}');
    expect(screen.queryByLabelText('Lời cây nói')).not.toBeInTheDocument();
    expect(screen.getByTestId('speech-bubble')).toHaveTextContent('Cố lên nhé');
    expect((await deps.db.days.get('2026-10-02'))!.speech).toBe('Cố lên nhé');
  });

  it('rời ô thì lưu', async () => {
    const { deps, user } = await setupDay({ speech: 'A' });
    await user.click(await screen.findByRole('button', { name: 'Sửa lời cây nói' }));
    await user.type(screen.getByLabelText('Lời cây nói'), 'B');
    await user.click(screen.getByRole('button', { name: 'Đổi chậu' }));
    await waitFor(async () => expect((await deps.db.days.get('2026-10-02'))!.speech).toBe('AB'));
  });

  it('nút ẩn/hiện lời cây nói được nhớ lại', async () => {
    const { deps, user } = await setupDay({ speech: 'Xin chào' });
    expect(await screen.findByTestId('speech-bubble')).toHaveTextContent('Xin chào');
    const hide = screen.getByRole('button', { name: 'Ẩn lời cây nói' });
    expect(hide.querySelector('svg[data-icon="speech"]')).not.toBeNull();
    await user.click(hide);
    await waitFor(() => expect(screen.queryByTestId('speech-bubble')).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(async () => expect(await getSetting(deps.db, 'showPlantSpeech')).toBe(false));
    await user.click(screen.getByRole('button', { name: 'Hiện lời cây nói' }));
    expect(await screen.findByTestId('speech-bubble')).toHaveTextContent('Xin chào');
    await waitFor(async () => expect(await getSetting(deps.db, 'showPlantSpeech')).toBe(true));
  });

  it('đang ẩn thì câu khi chạm cây vẫn hiện tạm', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await setSetting(deps.db, 'showPlantSpeech', false);
    await deps.db.days.put(makeDay({ date: '2026-10-02', greetedAt: 1, speech: 'Xin chào' }));
    const user = userEvent.setup();
    renderWithDeps(<TodayScreen />, deps);
    await screen.findByRole('button', { name: 'Hiện lời cây nói' });
    expect(screen.queryByTestId('speech-bubble')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Chạm vào cây' }));
    expect(await screen.findByTestId('speech-bubble')).toHaveAttribute('data-kind', 'tap');
  });

  it('ngày tiết kiệm năng lượng: không nói câu của ngày, không có nút ẩn/hiện', async () => {
    await setupDay({ speech: 'Xin chào', isRestDay: true });
    expect(screen.queryByTestId('speech-bubble')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ẩn lời cây nói' })).not.toBeInTheDocument();
  });

  it('bảng ghi chú không còn công tắc Cây nói ghi chú', async () => {
    const { user } = await setupDay({ speech: 'Xin chào' });
    await user.click(screen.getByRole('button', { name: 'Ghi chú' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ghi chú hôm nay' });
    expect(within(dialog).queryByRole('switch')).not.toBeInTheDocument();
  });

  it('câu khen hiện tạm rồi cây quay lại nói câu của ngày', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'], shouldAdvanceTime: true });
    try {
      const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
      await deps.db.days.put(makeDay({
        date: '2026-10-02', greetedAt: 1, speech: 'Trời đẹp',
        todos: [{ id: 'a', text: 'A', done: false, doneAt: null, order: 0, period: 'morning' }, { id: 'b', text: 'B', done: false, doneAt: null, order: 1, period: 'morning' }],
      }));
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderWithDeps(<TodayScreen />, deps);
      expect(await screen.findByTestId('speech-bubble')).toHaveTextContent('Trời đẹp');
      await user.click(screen.getByRole('checkbox', { name: 'Hoàn thành: A' }));
      await waitFor(() => expect(screen.getByTestId('speech-bubble')).toHaveAttribute('data-kind', 'praise'));
      await vi.advanceTimersByTimeAsync(4000);
      await waitFor(() => expect(screen.getByTestId('speech-bubble')).toHaveAttribute('data-kind', 'daily'));
      expect(screen.getByTestId('speech-bubble')).toHaveTextContent('Trời đẹp');
    } finally {
      vi.useRealTimers();
    }
  });
});
