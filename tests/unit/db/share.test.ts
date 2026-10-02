import { vi } from 'vitest';
import { shareOrDownload } from '../../../src/db/share';

const file = () => new File(['{}'], 'b.json', { type: 'application/json' });

describe('shareOrDownload', () => {
  afterEach(() => vi.restoreAllMocks());

  function mockShare(error: Error) {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    Object.defineProperty(navigator, 'share', { configurable: true, value: () => Promise.reject(error) });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: () => 'blob:x' });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: () => {} });
    return vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  }

  it('Safari chặn menu Chia sẻ (NotAllowedError) thì tải file xuống thay thế', async () => {
    const click = mockShare(new DOMException('blocked', 'NotAllowedError'));
    await expect(shareOrDownload(file())).resolves.toBeUndefined();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('người dùng tự huỷ (AbortError) thì không tải và báo huỷ', async () => {
    const click = mockShare(new DOMException('cancel', 'AbortError'));
    await expect(shareOrDownload(file())).rejects.toMatchObject({ name: 'AbortError' });
    expect(click).not.toHaveBeenCalled();
  });
});
