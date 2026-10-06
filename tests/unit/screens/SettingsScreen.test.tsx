import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SettingsScreen } from '../../../src/screens/SettingsScreen';
import { createBackup, serializeBackup } from '../../../src/db/backup';
import { getSetting, setSetting } from '../../../src/db/settings';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDb, makeDeps, renderWithDeps } from '../helpers';
import { addReminder } from '../../../src/domain/reminderService';

vi.mock('../../../src/db/share', () => ({ shareOrDownload: vi.fn().mockResolvedValue(undefined) }));

const jsonFile = (text: string) => new File([text], 'backup.json', { type: 'application/json' });

describe('SettingsScreen', () => {
  it('sao lưu thì ghi lại thời điểm sao lưu', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(screen.getByRole('button', { name: '💾 Sao lưu dữ liệu' }));
    expect(await screen.findByText(/Đã tạo file chau-cay-backup-2026-10-02.json/)).toBeInTheDocument();
    expect(await getSetting(deps.db, 'lastBackupAt')).toBe(deps.now().getTime());
  });

  it('file hỏng: báo lỗi, dữ liệu giữ nguyên', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01', note: 'giữ' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile('not json'));
    expect(await screen.findByRole('alert')).toHaveTextContent('File không phải JSON hợp lệ.');
    expect((await deps.db.days.get('2026-10-01'))!.note).toBe('giữ');
  });

  it('khôi phục gộp từ file hợp lệ', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-09-01', note: 'từ file', updatedAt: 5 }));
    const text = serializeBackup(await createBackup(src, 1));
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01', note: 'ở máy' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile(text));
    expect(await screen.findByText(/1 ngày · 0 mẫu/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Gộp với dữ liệu hiện tại' }));
    expect(await screen.findByText(/Đã khôi phục 1 ngày và 0 mẫu/)).toBeInTheDocument();
    await waitFor(async () => expect(await deps.db.days.count()).toBe(2));
  });

  it('thay thế cần xác nhận', async () => {
    const src = makeDb();
    await src.days.put(makeDay({ date: '2026-09-01' }));
    const text = serializeBackup(await createBackup(src, 1));
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.days.put(makeDay({ date: '2026-10-01' }));
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.upload(screen.getByTestId('restore-input'), jsonFile(text));
    await user.click(await screen.findByRole('button', { name: 'Thay thế toàn bộ' }));
    await user.click(screen.getByRole('button', { name: 'Chắc chắn thay thế' }));
    await waitFor(async () => expect((await deps.db.days.toArray()).map((d) => d.date)).toEqual(['2026-09-01']));
  });
});

describe('SettingsScreen nút quay lại', () => {
  it('nút mũi tên quay về Lịch', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const nav = vi.fn();
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps, nav);
    const back = screen.getByRole('button', { name: 'Quay lại Lịch' });
    expect(back.querySelector('svg[data-icon="back"]')).not.toBeNull();
    await user.click(back);
    expect(nav).toHaveBeenCalledWith('calendar');
  });
});

describe('SettingsScreen thứ tự thẻ', () => {
  it('Nhắc việc → Mẫu việc → Lịch → Ngôn ngữ → Sao lưu & khôi phục; hướng dẫn cài app không còn là thẻ', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<SettingsScreen />, deps);
    await screen.findByRole('heading', { name: 'Lịch' });
    const heads = [...document.querySelectorAll('.settings__section > h2')].map((h) => h.textContent);
    expect(heads.slice(0, 5)).toEqual(['Nhắc việc', 'Mẫu việc', 'Lịch', 'Ngôn ngữ · Language', 'Sao lưu & khôi phục']);
    expect(heads).not.toContain('Cài app lên màn hình chính');
  });

  it('nút dấu hỏi ở hàng tiêu đề mở bảng hướng dẫn cài app', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const help = await screen.findByRole('button', { name: 'Hướng dẫn cài app' });
    expect(help.querySelector('svg[data-icon="help"]')).not.toBeNull();
    expect(help.closest('header')).not.toBeNull();
    expect(screen.queryByText(/Thêm vào MH chính/)).not.toBeInTheDocument();
    await user.click(help);
    const dialog = await screen.findByRole('dialog', { name: 'Cài app lên màn hình chính' });
    expect(within(dialog).getByText(/Thêm vào MH chính/)).toBeInTheDocument();
  });
});

describe('SettingsScreen thẻ Mẫu việc', () => {
  it('thẻ Mẫu việc ghi mẫu mặc định; Quản lý mẫu mở màn Mẫu, nút quay lại về Cài đặt', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await deps.db.templates.put({ id: 't', name: 'Sáng sớm', items: [], isDefault: true, createdAt: 1, updatedAt: 1 });
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const card = (await screen.findByRole('heading', { name: 'Mẫu việc' })).closest('.card') as HTMLElement;
    expect(await within(card).findByText(/Đang dùng: Sáng sớm/)).toBeInTheDocument();
    expect(document.querySelectorAll('.settings__section')[1]).toBe(card); // ngay sau thẻ Nhắc việc
    await user.click(within(card).getByRole('button', { name: 'Quản lý mẫu' }));
    expect(await screen.findByRole('heading', { name: 'Mẫu việc cần làm' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(await screen.findByRole('heading', { name: 'Mẫu việc' })).toBeInTheDocument();
  });

  it('chưa có mẫu mặc định thì ghi rõ', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<SettingsScreen />, deps);
    expect(await screen.findByText('Chưa có mẫu mặc định')).toBeInTheDocument();
  });
});

describe('SettingsScreen chọn hình nền lịch', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:bg' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  });

  async function openPicker(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole('button', { name: /Đổi hình nền lịch/ }));
    return screen.findByRole('radiogroup', { name: 'Hình nền lịch' });
  }

  it('có 6 lựa chọn; chọn nền thì lưu và bảng tự đóng', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    let picker = await openPicker(user);
    expect(within(picker).getAllByRole('radio')).toHaveLength(6);
    expect(within(picker).getByRole('radio', { name: /Mặc định/ })).toHaveAttribute('aria-checked', 'true');
    for (const [name, id] of [[/Mèo vươn vai/, 'cat'], [/Cỏ nở/, 'grass'], [/Mưa chill/, 'rain'], [/Gaming pixel/, 'gamer'], [/Mặc định/, 'default']] as const) {
      await user.click(within(picker).getByRole('radio', { name }));
      await waitFor(async () => expect(await getSetting(deps.db, 'calendarTheme')).toBe(id));
      await waitFor(() => expect(screen.queryByRole('radiogroup', { name: 'Hình nền lịch' })).not.toBeInTheDocument());
      picker = await openPicker(user);
      expect(within(picker).getByRole('radio', { name })).toHaveAttribute('aria-checked', 'true');
    }
  });

  it('đã có ảnh (bản cũ) thì đang chọn Ảnh của bạn; đổi sang nền động vẫn giữ ảnh', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await setSetting(deps.db, 'calendarBg', { mime: 'image/jpeg', data: new Uint8Array([1]).buffer });
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const picker = await openPicker(user);
    await waitFor(() => expect(within(picker).getByRole('radio', { name: /Ảnh của bạn/ })).toHaveAttribute('aria-checked', 'true'));
    await user.click(within(picker).getByRole('radio', { name: /Cỏ nở/ }));
    await waitFor(async () => expect(await getSetting(deps.db, 'calendarTheme')).toBe('grass'));
    expect(await getSetting(deps.db, 'calendarBg')).toBeDefined();
  });
});

describe('SettingsScreen phiên bản app', () => {
  it('hiện mã phiên bản đang chạy', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<SettingsScreen />, deps);
    expect(await screen.findByTestId('app-version')).toHaveTextContent(/^Phiên bản \S+/);
  });
});

describe('SettingsScreen công tắc nút đổi hình nền ở trang Lịch', () => {
  it('mặc định bật; tắt thì lưu false, bật lại thì lưu true', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const toggle = await screen.findByRole('switch', { name: 'Hiện nút đổi hình nền ở trang Lịch' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    await waitFor(async () => expect(await getSetting(deps.db, 'showCalendarBgButton')).toBe(false));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true'); // đổi ngay trên giao diện, không chờ DB
    await waitFor(async () => expect(await getSetting(deps.db, 'showCalendarBgButton')).toBe(true));
  });
});

describe('SettingsScreen công tắc chấm đỏ ngày có ghi chú', () => {
  it('mặc định bật; tắt thì lưu false, bật lại thì lưu true', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const toggle = await screen.findByRole('switch', { name: 'Hiện chấm đỏ ở ngày có ghi chú' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await user.click(toggle);
    await waitFor(async () => expect(await getSetting(deps.db, 'showNoteDot')).toBe(false));
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'false'));
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await waitFor(async () => expect(await getSetting(deps.db, 'showNoteDot')).toBe(true));
  });
});

describe('SettingsScreen mục Ủng hộ tôi', () => {
  it('có mã QR chuyển khoản, nút lưu mã QR và nút PayPal', async () => {
    const { shareOrDownload } = await import('../../../src/db/share');
    vi.mocked(shareOrDownload).mockClear();
    // thân Response là byte thô: Blob của jsdom không có .stream() nên Response của Node 20 (CI) báo lỗi
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/jpeg' } }));
    try {
      const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
      const user = userEvent.setup();
      renderWithDeps(<SettingsScreen />, deps);
      const section = (await screen.findByRole('heading', { name: 'Ủng hộ tôi' })).closest('section')!;
      const qr = within(section).getByRole('img', { name: 'Mã QR chuyển khoản TPBank' });
      expect(qr.getAttribute('src')).toMatch(/support\/qr-tpbank\.jpg$/);
      const paypal = within(section).getByRole('link', { name: /PayPal/ });
      expect(paypal).toHaveAttribute('href', 'https://paypal.me/dattruong92');
      expect(paypal).toHaveAttribute('target', '_blank');
      expect(paypal.getAttribute('rel')).toContain('noopener');
      await user.click(within(section).getByRole('button', { name: 'Lưu mã QR' }));
      await waitFor(() => expect(shareOrDownload).toHaveBeenCalledTimes(1));
      const file = vi.mocked(shareOrDownload).mock.calls[0][0];
      expect(file.name).toBe('ma-qr-ung-ho.jpg');
      expect(file.type).toBe('image/jpeg');
    } finally {
      fetchMock.mockRestore();
    }
  });
});

describe('SettingsScreen — Nhắc việc', () => {
  it('thẻ Nhắc việc đứng đầu, đếm việc đang theo dõi và mở màn Nhắc việc', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    await addReminder(deps, 'Mua quà');
    await addReminder(deps, 'Vẽ tranh');
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 2)).toEqual(['Nhắc việc', 'Mẫu việc']);
    expect(await screen.findByText('2 việc đang theo dõi')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mở nhắc việc' }));
    expect(await screen.findByRole('heading', { name: 'Nhắc việc', level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại Cài đặt' }));
    expect(await screen.findByRole('heading', { name: 'Cài đặt' })).toBeInTheDocument();
  });
});

describe('SettingsScreen: ngôn ngữ', () => {
  it('thẻ Ngôn ngữ đổi giao diện sang English và lưu lại', async () => {
    const { deps } = makeDeps();
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    const select = screen.getByRole('combobox', { name: 'Ngôn ngữ · Language' });
    expect(select).toHaveValue('vi');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual(['Tiếng Việt', 'English']);
    await user.selectOptions(select, 'en');
    expect(screen.getByRole('combobox', { name: 'Ngôn ngữ · Language' })).toHaveValue('en');
    expect(screen.getByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
    await waitFor(async () => expect(await getSetting(deps.db, 'language')).toBe('en'));
  });

  it('thẻ Ngôn ngữ đứng sau thẻ Lịch, trước Sao lưu', () => {
    const { deps } = makeDeps();
    renderWithDeps(<SettingsScreen />, deps);
    const heads = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(heads.indexOf('Ngôn ngữ · Language')).toBe(heads.indexOf('Lịch') + 1);
    expect(heads.indexOf('Sao lưu & khôi phục')).toBe(heads.indexOf('Ngôn ngữ · Language') + 1);
  });
});

it('file sao lưu hỏng báo lỗi tiếng Anh khi đang dùng English', async () => {
  const { deps } = makeDeps();
  const user = userEvent.setup();
  renderWithDeps(<SettingsScreen />, deps, undefined, 'en');
  await user.upload(screen.getByTestId('restore-input'), jsonFile('{'));
  expect(await screen.findByText("This file isn't valid JSON.")).toBeInTheDocument();
});

it('Cài đặt bằng English', async () => {
  const { deps } = makeDeps();
  renderWithDeps(<SettingsScreen />, deps, undefined, 'en');
  expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeInTheDocument();
  for (const name of ['💾 Back up data', 'Manage templates', 'Open reminders', 'Install guide']) {
    expect(screen.getByRole('button', { name })).toBeInTheDocument();
  }
  expect(screen.getByText("You haven't backed up yet.")).toBeInTheDocument();
});

it('khôi phục file có ngôn ngữ khác thì giao diện đổi theo ngay', async () => {
  const { deps } = makeDeps();
  const user = userEvent.setup();
  const file = { ...(await createBackup(makeDb(), 1)), language: 'vi' as const };
  renderWithDeps(<SettingsScreen />, deps, undefined, 'en');
  await user.upload(screen.getByTestId('restore-input'), jsonFile(serializeBackup(file)));
  await user.click(await screen.findByRole('button', { name: 'Replace everything' }));
  await user.click(screen.getByRole('button', { name: 'Yes, replace' }));
  expect(await screen.findByRole('heading', { name: 'Cài đặt', level: 1 })).toBeInTheDocument();
});
