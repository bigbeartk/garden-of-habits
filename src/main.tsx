import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/baloo-2/600.css';
import '@fontsource/baloo-2/700.css';
import '@fontsource/quicksand/500.css';
import '@fontsource/quicksand/600.css';
import '@fontsource/quicksand/700.css';
import './app/theme.css';
import { App } from './app/App';
import { I18nProvider } from './i18n/I18nProvider';
import { isNative, setupNativeShell } from './platform';

if (isNative()) {
  // App Android: mọi file đã đóng gói trong APK, không cần service worker; bản mới = cài APK mới.
  void setupNativeShell();
} else {
  // Kiểm tra bản mới mỗi khi quay lại app (PWA trên iPhone thường chỉ được "tiếp tục", không tải lại),
  // và định kỳ 30 phút; autoUpdate sẽ tự tải lại trang khi bản mới sẵn sàng.
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      setInterval(check, 30 * 60 * 1000);
    },
  });
  void navigator.storage?.persist?.();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <App />
      </I18nProvider>
    </MotionConfig>
  </StrictMode>,
);
