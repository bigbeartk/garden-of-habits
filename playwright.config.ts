import { defineConfig, devices, type Project } from '@playwright/test';

/** PW_CHANNEL=chrome dùng Chrome cài sẵn trên máy khi chưa tải được trình duyệt của Playwright. */
const channel = process.env.PW_CHANNEL;

/**
 * Ma trận cỡ máy cho tests/e2e/layout.spec.ts. safeArea giả tai thỏ / Dynamic Island / Android tràn viền
 * qua biến --safe-area-inset-* (CSS đọc biến trước env()).
 */
const iphone = (name: string, width: number, height: number, top: number, bottom: number): Project => ({
  name,
  testMatch: /layout\.spec\.ts/,
  metadata: { safeArea: { top, bottom } },
  use: channel
    ? { ...devices['iPhone 13'], viewport: { width, height }, defaultBrowserType: 'chromium', browserName: 'chromium', channel }
    : { ...devices['iPhone 13'], viewport: { width, height } },
});
const android = (name: string, width: number, height: number, top: number, bottom: number): Project => ({
  name,
  testMatch: /layout\.spec\.ts/,
  metadata: { safeArea: { top, bottom } },
  use: { ...devices['Pixel 7'], viewport: { width, height }, ...(channel ? { channel } : {}) },
});

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    channel
      ? { name: 'iphone-13-chrome', metadata: { safeArea: { top: 47, bottom: 34 } }, use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', browserName: 'chromium', channel } }
      : { name: 'iphone-13', metadata: { safeArea: { top: 47, bottom: 34 } }, use: { ...devices['iPhone 13'] } },
    iphone('iphone-se', 375, 667, 20, 0),
    iphone('iphone-13-mini', 375, 812, 50, 34),
    iphone('iphone-16-pro', 393, 852, 59, 34),
    iphone('iphone-16-pro-max', 440, 956, 62, 34),
    iphone('iphone-13-landscape', 844, 390, 0, 21),
    android('android-small', 360, 640, 24, 0),
    android('android-galaxy', 360, 780, 32, 24),
    android('android-pixel', 412, 915, 32, 24),
    android('android-fold', 344, 882, 32, 24),
  ],
});
