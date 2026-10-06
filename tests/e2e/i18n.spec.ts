import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

/** Chuyển tab qua menu nổi (giao diện tiếng Anh). */
async function goTabEn(page: Page, name: 'Calendar' | 'Today' | 'Garden' | 'Settings') {
  const open = page.getByRole('button', { name: 'Open menu' });
  // lần mở đầu app chờ giải ngôn ngữ mới render: đợi nút menu (đóng hoặc mở) hiện ra đã
  await expect(open.or(page.getByRole('button', { name: 'Close menu' }))).toBeVisible();
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name, exact: true }).click();
}

/** Xoá setting ngôn ngữ và gợi ý localStorage: giả lập dữ liệu từ bản cũ chưa có song ngữ. */
async function forgetLanguage(page: Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('chau-cay-chibi');
      req.onsuccess = () => {
        const tx = req.result.transaction('settings', 'readwrite');
        tx.objectStore('settings').delete('language');
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
    localStorage.removeItem('goh-lang');
  });
}

test.describe('máy tiếng Anh', () => {
  test.use({ locale: 'en-US' });

  test('cài mới → tiếng Anh; luồng chính chạy được', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    // lần đầu trong ngày app tự sang Hôm nay
    await expect(page.getByRole('button', { name: 'Tap the plant' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Add morning task' }).click();
    const draft = page.getByLabel('New morning task');
    await draft.fill('Drink water');
    await draft.press('Enter');
    await page.keyboard.press('Escape');
    await page.getByRole('checkbox', { name: 'Complete: Drink water' }).click();
    await expect(page.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom');
    await expect(page.getByTestId('speech-bubble')).toHaveAttribute('data-kind', 'praise');
    await goTabEn(page, 'Calendar');
    await expect(page.getByRole('heading', { name: 'October 2026' })).toBeVisible();
  });

  test('chọn Tiếng Việt trong Cài đặt → giữ sau khi tải lại', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    await goTabEn(page, 'Settings');
    await page.getByRole('button', { name: /^Ngôn ngữ · Language/ }).click();
    await page.getByRole('option', { name: 'Tiếng Việt' }).click();
    await expect(page.getByRole('heading', { name: 'Sao lưu & khôi phục' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tháng trước' })).toBeVisible();
  });

  test('máy mới tiếng Anh: sang hôm sau vẫn English (không bị coi là người dùng cũ)', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-01T10:00:00'));
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Tap the plant' })).toBeVisible();
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tap the plant' })).toBeVisible();
  });

  test('người dùng cũ (có ngày trước hôm nay, chưa có setting) vẫn tiếng Việt dù máy tiếng Anh', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-01T10:00:00'));
    await page.goto('/');
    await expect(page.getByTestId('plant-scene')).toBeVisible();
    await forgetLanguage(page);
    // hôm sau mở bản mới
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Chạm vào cây' })).toBeVisible();
    // đã ghi lại: lần mở sau vẫn tiếng Việt
    await page.reload();
    await expect(page.getByRole('button', { name: 'Tháng trước' })).toBeVisible();
  });

  test('tóm tắt Khu vườn tiếng Anh với số lớn (365 ngày) vẫn một dòng; dải tab không tràn', async ({ page }) => {
    await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
    await page.goto('/');
    await goTabEn(page, 'Garden');
    const tabs = page.locator('#fnav-tabs');
    expect(await tabs.evaluate((el) => el.getBoundingClientRect().left >= 0)).toBe(true);
    const summary = page.getByTestId('garden-summary');
    // hôm nay có 10% khả năng là cây đặc biệt (random thật trong app)
    await expect(summary).toHaveText(/^1 day · 0 blooms · 0 tasks · ✨ [01] special$/);
    // cùng mức số lớn nhất như test tiếng Việt (một năm): 365 ngày, 2000 việc, 99 đặc biệt
    await summary.evaluate((el) => {
      el.innerHTML = '<b>365</b> days · <b>365</b> blooms · <b>2000</b> tasks · ✨ <b>99</b> special';
    });
    const box = (await summary.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(await summary.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  });
});
