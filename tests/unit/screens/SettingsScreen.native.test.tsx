import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SettingsScreen } from '../../../src/screens/SettingsScreen';
import { CATALOG } from '../../../src/content/catalog';
import { makeDeps, renderWithDeps } from '../helpers';

const openExternal = vi.fn(async (_url: string) => {});
vi.mock('../../../src/platform', async (orig) => ({
  ...(await orig<typeof import('../../../src/platform')>()),
  isNative: () => true,
  openExternal: (url: string) => openExternal(url),
}));
vi.mock('../../../src/db/share', () => ({ shareOrDownload: vi.fn().mockResolvedValue(undefined) }));

describe('SettingsScreen trong app Android', () => {
  it('không có nút hướng dẫn cài app lên màn hình chính', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<SettingsScreen />, deps);
    await screen.findByText('Mẫu việc');
    expect(screen.queryByRole('button', { name: 'Hướng dẫn cài app' })).not.toBeInTheDocument();
  });

  it('dòng phiên bản ghi rõ là bản Android', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    renderWithDeps(<SettingsScreen />, deps);
    expect(await screen.findByTestId('app-version')).toHaveTextContent(/· Android$/);
  });

  it('sao lưu xong thì nhắc lưu vào Google Drive / Tệp (không nhắc iCloud)', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(screen.getByRole('button', { name: '💾 Sao lưu dữ liệu' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Google Drive');
    expect(status).not.toHaveTextContent('iCloud');
  });

  it('link PayPal mở bằng trình duyệt ngoài', async () => {
    const { deps } = makeDeps(new Date(2026, 9, 2, 10, 0), CATALOG);
    const user = userEvent.setup();
    renderWithDeps(<SettingsScreen />, deps);
    await user.click(screen.getByRole('link', { name: 'Ủng hộ qua PayPal' }));
    expect(openExternal).toHaveBeenCalledWith('https://paypal.me/dattruong92');
  });
});
