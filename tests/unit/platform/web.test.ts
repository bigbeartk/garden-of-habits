import { vi } from 'vitest';
import { exitApp, isNative, onAppResume, onHardwareBack } from '../../../src/platform';

describe('platform (web / PWA)', () => {
  it('isNative = false trong trình duyệt', () => {
    expect(isNative()).toBe(false);
  });

  it('onAppResume nghe visibilitychange + focus', () => {
    const cb = vi.fn();
    const off = onAppResume(cb);
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    window.dispatchEvent(new Event('focus'));
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('web không có nút Back cứng: onHardwareBack / exitApp không làm gì', () => {
    const off = onHardwareBack(() => {});
    expect(() => { off(); exitApp(); }).not.toThrow();
  });
});
