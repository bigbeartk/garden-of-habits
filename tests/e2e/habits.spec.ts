import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

/** Chuyển tab qua menu nổi: mở menu nếu đang thu gọn rồi bấm tab. */
async function goTab(page: Page, name: 'Lịch' | 'Hôm nay' | 'Khu vườn' | 'Cài đặt') {
  const open = page.getByRole('button', { name: 'Mở menu' });
  // lần mở đầu app chờ giải ngôn ngữ mới render: đợi nút menu (đóng hoặc mở) hiện ra đã
  await expect(open.or(page.getByRole('button', { name: 'Đóng menu' }))).toBeVisible();
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name, exact: true }).click();
}

/** Thu dải tab nếu đang mở (chạm ra ngoài cũng tự thu, nên có thể đã đóng). */
async function closeMenu(page: Page) {
  const close = page.getByRole('button', { name: 'Đóng menu' });
  if (await close.isVisible()) await close.click();
  await expect(page.locator('#fnav-tabs')).toHaveCount(0);
}

async function openToday(page: Page) {
  await goTab(page, 'Hôm nay');
  await expect(page.getByTestId('plant-scene')).toBeVisible();
}

async function createHabit(page: Page, name: string, opts: { formOpen?: boolean } = {}) {
  if (!opts.formOpen) await page.getByRole('button', { name: '＋ Thói quen mới' }).click();
  await expect(page.getByLabel('Tên thói quen')).toBeVisible();
  await page.getByLabel('Tên thói quen').fill(name);
  await page.getByRole('button', { name: 'Lưu thói quen' }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
}

test('tạo thói quen, tick ở Hôm nay, xem ở Khu vườn', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-08T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Thêm thói quen' }).click();
  await expect(page.getByTestId('habits-screen')).toBeVisible();
  await createHabit(page, 'Uống nước', { formOpen: true }); // chip "Thêm thói quen" mở thẳng form thêm
  await page.getByRole('button', { name: 'Quay lại Khu vườn' }).click();
  await expect(page.getByTestId('habit-report')).toBeVisible();

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  const chip = page.getByRole('switch', { name: 'Thói quen: Uống nước' });
  await chip.click();
  await expect(chip).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-testid="plant-scene"] [data-mood="smile"], [data-testid="plant-scene"][data-mood="smile"]').first()).toBeVisible();
  await page.reload();
  await openToday(page);
  await expect(page.getByRole('switch', { name: 'Thói quen: Uống nước' })).toHaveAttribute('aria-checked', 'true');

  await goTab(page, 'Khu vườn');
  // sau reload với đồng hồ giả, animation đóng menu của WebKit có thể đứng: bấm thẳng, không chờ dải tab thu lại
  const cell = page.locator('[data-testid^="habit-cell-"][data-testid$="-2026-10-08"]');
  await expect(page.getByRole('tab', { name: 'Thói quen' })).toHaveAttribute('aria-selected', 'true');
  await expect(cell).toHaveAttribute('data-state', 'done');
  await page.getByRole('tab', { name: 'Tháng' }).click();
  await expect(page.getByText('Tháng 10, 2026')).toBeVisible();
  await page.getByRole('tab', { name: 'Năm' }).click();
  await expect(page.getByText('Năm 2026')).toBeVisible();
});

test('10 thói quen tên dài: bảng tuần không tràn, trang không cuộn ngang', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-08T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  await page.getByRole('tab', { name: 'Thói quen' }).click();
  await page.getByRole('button', { name: '＋ Thói quen đầu tiên' }).click();
  for (let i = 1; i <= 10; i++) await createHabit(page, `Thói quen rất dài số ${i} để thử tràn chữ`);
  await page.getByRole('button', { name: 'Quay lại Khu vườn' }).click();
  const report = page.getByTestId('habit-report');
  await expect(report).toBeVisible();
  const box = (await report.boundingBox())!;
  const rows = page.locator('.habit-week__row');
  for (let i = 0; i < (await rows.count()); i++) {
    const r = (await rows.nth(i).boundingBox())!;
    expect(r.x + r.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await expect(page.getByTestId('habit-strip')).toBeVisible();
  const overflowToday = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflowToday).toBeLessThanOrEqual(0);
});
