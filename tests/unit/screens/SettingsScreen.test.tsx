import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SettingsScreen } from '../../../src/screens/SettingsScreen';
import { createBackup, serializeBackup } from '../../../src/db/backup';
import { getSetting, setSetting } from '../../../src/db/settings';
import { CATALOG } from '../../../src/content/catalog';
import { makeDay, makeDb, makeDeps, renderWithDeps } from '../helpers';

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
