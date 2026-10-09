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
  // mở từ chip Hôm nay thì Back về Hôm nay
  await expect(page.getByRole('button', { name: 'Quay lại Khu vườn' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Quay lại Hôm nay' }).click();
  await expect(page.getByTestId('habit-strip')).toBeVisible();
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
  for (let i = 1; i <= 10; i++) await createHabit(page, `Thói quen rất dài số ${i} để thử tràn chữ`, { formOpen: i === 1 });
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

test('tắt "Hiện thói quen ở màn Hôm nay" trong Cài đặt: Hôm nay mất dải chip, Khu vườn vẫn có Thói quen', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-08T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  await page.getByRole('tab', { name: 'Thói quen' }).click();
  await page.getByRole('button', { name: '＋ Thói quen đầu tiên' }).click();
  await createHabit(page, 'Uống nước', { formOpen: true });
  await page.getByRole('button', { name: 'Quay lại Khu vườn' }).click();

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await expect(page.getByRole('switch', { name: 'Thói quen: Uống nước' })).toBeVisible();

  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  const toggle = page.getByRole('switch', { name: 'Hiện thói quen ở màn Hôm nay' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await expect(page.getByTestId('plant-scene')).toBeVisible();
  await expect(page.getByTestId('habit-strip')).toHaveCount(0);

  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  await page.getByRole('tab', { name: 'Thói quen' }).click();
  await expect(page.getByTestId('habit-report')).toBeVisible();
});

test('dừng thói quen: rời Hôm nay, xuống mục Đã dừng, lịch sử giữ; Tiếp tục đưa lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-08T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Thêm thói quen' }).click();
  await createHabit(page, 'Uống nước', { formOpen: true });
  await page.getByRole('button', { name: '＋ Thói quen mới' }).click();
  await createHabit(page, 'Đọc sách 20 trang mỗi tối trước khi ngủ', { formOpen: true });
  await page.getByRole('button', { name: 'Quay lại Hôm nay' }).click();
  const chip = page.getByRole('switch', { name: 'Thói quen: Uống nước' });
  await chip.click();
  await expect(chip).toHaveAttribute('aria-checked', 'true');

  await page.getByRole('button', { name: 'Quản lý thói quen' }).click();
  await page.getByRole('button', { name: 'Dừng: Uống nước' }).click();
  const stopped = page.getByTestId('habits-stopped');
  await expect(stopped.getByText('Đã dừng từ 08/10')).toBeVisible();
  await page.screenshot({ path: 'test-results/habits-stopped.png' });
  // nút chỉ có icon, nằm cùng hàng với tên (kể cả tên dài) và vẫn tròn
  for (const [btnName, text] of [['Xoá: Đọc sách 20 trang mỗi tối trước khi ngủ', 'Đọc sách 20 trang mỗi tối trước khi ngủ'], ['Tiếp tục: Uống nước', 'Uống nước']]) {
    const btn = (await page.getByRole('button', { name: btnName }).boundingBox())!;
    const name = (await page.getByText(text, { exact: true }).boundingBox())!;
    expect(btn.x).toBeGreaterThan(name.x + name.width);
    expect(btn.y).toBeLessThan(name.y + name.height + 40);
    expect(Math.abs(btn.width - btn.height)).toBeLessThan(1);
  }
  await page.getByRole('button', { name: 'Xoá: Uống nước' }).click();
  await expect(page.getByRole('button', { name: 'Xoá cả lịch sử' })).toBeVisible();
  await page.screenshot({ path: 'test-results/habits-delete-confirm.png' });
  await page.getByRole('button', { name: 'Thôi' }).click();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);

  await page.getByRole('button', { name: 'Quay lại Hôm nay' }).click();
  await expect(page.getByRole('switch', { name: 'Thói quen: Đọc sách 20 trang mỗi tối trước khi ngủ' })).toBeVisible();
  await expect(chip).toHaveCount(0);

  await goTab(page, 'Khu vườn');
  await expect(page.locator('[data-testid^="habit-cell-"][data-testid$="-2026-10-08"]').first()).toHaveAttribute('data-state', 'done');

  await page.getByRole('button', { name: 'Quản lý thói quen' }).click();
  await stopped.getByRole('button', { name: 'Tiếp tục: Uống nước' }).click();
  await expect(stopped).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Dừng: Uống nước' })).toBeVisible();
});

test('làm đủ mọi thói quen: côn trùng ghé cây ở Hôm nay, hôm sau còn trên ô Lịch', async ({ page }) => {
  test.setTimeout(60_000); // có chờ khung báo tự tắt ~5 giây
  await page.clock.setFixedTime(at('2026-10-08T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Thêm thói quen' }).click();
  await createHabit(page, 'Uống nước', { formOpen: true });
  await page.getByRole('button', { name: '＋ Thói quen mới' }).click();
  await createHabit(page, 'Đọc sách', { formOpen: true });
  await page.getByRole('button', { name: 'Quay lại Hôm nay' }).click();

  const scene = page.getByTestId('plant-scene');
  await page.getByRole('switch', { name: 'Thói quen: Uống nước' }).click();
  await expect(page.getByRole('switch', { name: 'Thói quen: Uống nước' })).toHaveAttribute('aria-checked', 'true');
  await expect(scene.getByTestId('habit-bug')).toHaveCount(0);
  await page.getByRole('switch', { name: 'Thói quen: Đọc sách' }).click();
  const bug = scene.getByTestId('habit-bug');
  await expect(bug).toHaveCount(1);
  // lần đầu gặp loài này → khung "Gặp bạn mới"
  await expect(page.getByTestId('bug-visit')).toHaveAttribute('data-kind', 'new');
  await expect(page.getByTestId('bug-visit')).toContainText('Gặp bạn mới:');
  // nằm trong khung cây, không tràn ra ngoài
  await page.waitForTimeout(1500); // chờ bay vào xong
  const s = (await scene.boundingBox())!;
  const b = (await bug.boundingBox())!;
  expect(b.x).toBeGreaterThanOrEqual(s.x);
  expect(b.x + b.width).toBeLessThanOrEqual(s.x + s.width);
  expect(b.y).toBeGreaterThanOrEqual(s.y);
  await page.screenshot({ path: 'test-results/habit-bug-today.png' });
  // khung báo tự tắt sau ~5 giây
  await expect(page.getByTestId('bug-visit')).toHaveCount(0, { timeout: 8000 });

  // con được bốc một lần rồi lưu: bỏ tick → bay đi; tick lại vẫn đúng con đó (hôm sau ô Lịch cũng vậy, bên dưới)
  const picked = (await bug.getAttribute('data-bug'))!;
  const read = page.getByRole('switch', { name: 'Thói quen: Đọc sách' });
  await read.click();
  await expect(read).toHaveAttribute('aria-checked', 'false');
  await expect(bug).toHaveCount(0);
  await read.click();
  await expect(bug).toHaveAttribute('data-bug', picked);

  await page.clock.setFixedTime(at('2026-10-09T10:00:00'));
  await page.reload();
  await goTab(page, 'Lịch');
  const cell = page.getByTestId('day-2026-10-08');
  await expect(cell.getByTestId('habit-bug')).toHaveAttribute('data-bug', picked);
  await cell.screenshot({ path: 'test-results/habit-bug-cell.png' });
  await cell.click();
  await expect(page.getByText(/ghé thăm vì bạn làm đủ mọi thói quen/)).toBeVisible();
  await page.getByRole('button', { name: 'Đóng' }).click();

  // Khu vườn → Thói quen: thẻ côn trùng đã gặp 1/5, các ô khác bí ẩn; không tràn ngang
  await goTab(page, 'Khu vườn');
  await page.getByRole('tab', { name: 'Thói quen' }).click();
  const coll = page.getByTestId('bug-collection');
  await expect(coll.getByText('1/10')).toBeVisible();
  await expect(coll.locator('[data-met="true"]')).toHaveCount(1);
  // sau đồng hồ giả + reload, animation thu menu của WebKit có thể đứng: chạm ra ngoài thay vì closeMenu
  await coll.getByRole('heading', { name: 'Côn trùng đã gặp' }).click();
  await page.evaluate(() => document.querySelectorAll('*').forEach((el) => { if (el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight; }));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/bug-collection.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
