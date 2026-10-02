import { defineConfig, devices } from '@playwright/test';

/** PW_CHANNEL=chrome dùng Chrome cài sẵn trên máy khi chưa tải được trình duyệt của Playwright. */
const channel = process.env.PW_CHANNEL;

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
  projects: channel
    ? [{ name: 'iphone-13-chrome', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium', browserName: 'chromium', channel } }]
    : [{ name: 'iphone-13', use: { ...devices['iPhone 13'] } }],
});
