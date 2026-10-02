import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

async function openToday(page: Page) {
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  await expect(page.getByTestId('plant-scene')).toBeVisible();
}

async function addTodo(page: Page, text: string) {
  await page.getByLabel('Thêm việc cần làm').fill(text);
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: `Hoàn thành: ${text}` })).toBeVisible();
}

test('tick việc làm cây lớn và dữ liệu còn sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Uống nước');
  await addTodo(page, 'Đọc sách');
  const scene = page.getByTestId('plant-scene');
  await expect(scene).toHaveAttribute('data-stage', 'seed');
  await page.getByRole('checkbox', { name: 'Hoàn thành: Uống nước' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'bud');
  await page.getByRole('checkbox', { name: 'Hoàn thành: Đọc sách' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'bloom');
  await page.reload();
  await openToday(page);
  await expect(page.getByTestId('plant-scene')).toHaveAttribute('data-stage', 'bloom');
});

test('sang ngày mới: mẫu mặc định tự lên và cây chào', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mẫu', exact: true }).click();
  await page.getByRole('button', { name: '＋ Mẫu mới' }).click();
  await page.getByLabel('Tên mẫu').fill('Buổi sáng');
  await page.getByLabel('Các việc (mỗi dòng một việc)').fill('Tập thể dục\nĂn sáng');
  await page.getByRole('button', { name: 'Lưu mẫu' }).click();
  await page.getByRole('button', { name: 'Đặt làm mặc định: Buổi sáng' }).click();
  await expect(page.getByRole('button', { name: 'Bỏ mặc định: Buổi sáng' })).toBeVisible();

  await page.clock.setFixedTime(at('2026-10-03T03:30:00'));
  await page.reload();
  // trước 4:00 vẫn là ngày 02 → không tự mở màn Hôm nay vì đã chào
  await expect(page.getByRole('button', { name: 'Lịch', exact: true })).toHaveAttribute('aria-current', 'page');

  await page.clock.setFixedTime(at('2026-10-03T08:00:00'));
  await page.reload();
  await expect(page.getByTestId('speech-bubble')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Tập thể dục' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Ăn sáng' })).toBeVisible();
});

test('ngày tiết kiệm năng lượng hiện hạt ngủ trên lịch', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.getByRole('button', { name: 'Ngày tiết kiệm năng lượng' }).click();
  await expect(page.getByTestId('rest-message')).toBeVisible();
  await page.getByRole('button', { name: 'Lịch', exact: true }).click();
  await expect(page.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'rest');
});

test('ngày bỏ trống hiện cây héo, trước ngày đầu tiên để trống', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.clock.setFixedTime(at('2026-10-04T10:00:00'));
  await page.reload();
  await page.getByRole('button', { name: 'Lịch', exact: true }).click();
  await expect(page.getByTestId('day-2026-10-03')).toHaveAttribute('data-status', 'missed');
  await expect(page.getByTestId('day-2026-10-01')).toHaveAttribute('data-status', 'before-start');
});

test('mở được khi không có mạng', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Service worker offline chỉ kiểm tra trên Chromium');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Điều hướng' })).toBeVisible();
  await context.setOffline(false);
});
