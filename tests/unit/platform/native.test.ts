import { vi } from 'vitest';

const writeFile = vi.fn(async () => ({ uri: 'file:///cache/b.json' }));
const share = vi.fn(async (_o: unknown) => ({}));
const openBrowser = vi.fn(async (_o: unknown) => {});
const listeners: Record<string, () => void> = {};
const exitApp = vi.fn();

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/filesystem', () => ({ Filesystem: { writeFile }, Directory: { Cache: 'CACHE' } }));
vi.mock('@capacitor/share', () => ({ Share: { share } }));
vi.mock('@capacitor/browser', () => ({ Browser: { open: openBrowser } }));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(async (name: string, cb: () => void) => {
      listeners[name] = cb;
      return { remove: async () => { delete listeners[name]; } };
    }),
    exitApp,
  },
}));

const platform = await import('../../../src/platform');

describe('platform (Android / Capacitor)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('isNative = true', () => {
    expect(platform.isNative()).toBe(true);
  });

  it('shareFile ghi file vào cache (base64) rồi mở menu Chia sẻ của Android', async () => {
    await platform.shareFile(new File(['{"a":1}'], 'b.json', { type: 'application/json' }));
    expect(writeFile).toHaveBeenCalledWith({ path: 'b.json', data: btoa('{"a":1}'), directory: 'CACHE' });
    expect(share).toHaveBeenCalledWith({ title: 'b.json', files: ['file:///cache/b.json'] });
  });

  it('người dùng huỷ chia sẻ thì ném AbortError (để không ghi nhận đã sao lưu)', async () => {
    share.mockRejectedValueOnce(new Error('Share canceled'));
    await expect(platform.shareFile(new File(['x'], 'b.json'))).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('lỗi khác khi chia sẻ thì ném lại nguyên lỗi', async () => {
    share.mockRejectedValueOnce(new Error('boom'));
    await expect(platform.shareFile(new File(['x'], 'b.json'))).rejects.toThrow('boom');
  });

  it('openExternal mở trình duyệt ngoài', async () => {
    await platform.openExternal('https://paypal.me/x');
    expect(openBrowser).toHaveBeenCalledWith({ url: 'https://paypal.me/x' });
  });

  it('onAppResume gọi lại khi app quay lại, huỷ đăng ký được', async () => {
    const cb = vi.fn();
    const off = platform.onAppResume(cb);
    await vi.waitFor(() => expect(listeners.resume).toBeDefined());
    listeners.resume();
    expect(cb).toHaveBeenCalledTimes(1);
    off();
    await vi.waitFor(() => expect(listeners.resume).toBeUndefined());
  });

  it('onHardwareBack nhận nút Back của Android; exitApp thoát app', async () => {
    const cb = vi.fn();
    platform.onHardwareBack(cb);
    await vi.waitFor(() => expect(listeners.backButton).toBeDefined());
    listeners.backButton();
    expect(cb).toHaveBeenCalledTimes(1);
    platform.exitApp();
    await vi.waitFor(() => expect(exitApp).toHaveBeenCalled());
  });
});
