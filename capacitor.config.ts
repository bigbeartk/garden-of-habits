import type { CapacitorConfig } from '@capacitor/cli';

// appId là mã gói trên CH Play: KHÔNG đổi sau khi đã phát hành (đổi = app khác, mất dữ liệu).
const config: CapacitorConfig = {
  appId: 'io.github.bigbeartk.gardenofhabits',
  appName: 'Garden of Habits',
  webDir: 'dist',
  backgroundColor: '#FFF8F0',
  // WebView thấp hơn bản này thiếu CSS app dùng (dvh, translate, :has) → hiện trang nhắc cập nhật thay vì giao diện vỡ.
  // Giữ khớp build.target (chrome111) trong vite.config.ts.
  android: { minWebViewVersion: 111 },
  server: { errorPath: 'webview-update.html' },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#FFF8F0', showSpinner: false },
    // Android 15+ luôn tràn viền: app tự chừa chỗ bằng safe-area. 'css' bơm biến --safe-area-inset-*
    // (CSS dùng var(--safe-area-inset-x, env(safe-area-inset-x)) vì WebView cũ trả env() = 0).
    // style LIGHT = biểu tượng tối trên nền sáng.
    SystemBars: { insetsHandling: 'css', style: 'LIGHT' },
  },
};

export default config;
