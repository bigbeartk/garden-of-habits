import { expect, test, type Page } from '@playwright/test';

/**
 * Mở khoá loài cây mới: đủ 90 ngày đạt (60 ngày ra hoa + 30 ngày chỉ làm đủ thói quen) → chấm đỏ ở nút Đổi cây
 * → mở Cà chua → chọn Cà chua cho hôm nay. Dữ liệu ghi thẳng vào IndexedDB rồi tải lại trang.
 */

const at = (iso: string) => new Date(`${iso}+07:00`);
const NOW = at('2026-10-08T10:00:00');
const TODAY = '2026-10-08';

function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 60 ngày ra hoa (1–60 ngày trước) + 30 ngày cũ hơn không có bản ghi ngày nhưng làm đủ thói quen (61–90 ngày trước). */
function goodDayData() {
  const t = NOW.getTime();
  const days = Array.from({ length: 60 }, (_, i) => ({
    date: addDays(TODAY, -(i + 1)), plantId: 'corn', potId: 'rattan', specialId: null, isRestDay: false, title: '', speech: '',
    greetedAt: t, note: '', todos: [{ id: 't0', text: 'Việc', done: true, doneAt: t, order: 0, period: 'morning' }],
    finalStage: 'bloom', createdAt: t, updatedAt: t,
  }));
  const habit = { id: 'h1', name: 'Đọc sách', icon: '📚', color: 'mint', weekdays: [0, 1, 2, 3, 4, 5, 6], order: 0, startDate: addDays(TODAY, -90), createdAt: t, updatedAt: t };
  const checks = Array.from({ length: 30 }, (_, i) => ({ habitId: 'h1', date: addDays(TODAY, -(61 + i)), at: t }));
  // dáng của Ngô đã mở từ trước: chỉ còn khung mừng cây mới
  const settings = [{ key: 'unlockedStyles', value: ['corn|popcorn', 'corn|rainbow'] }];
  return { days, habit, checks, settings };
}

async function seed(page: Page) {
  await page.evaluate(
    (data) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction(['days', 'habits', 'habitChecks', 'settings'], 'readwrite');
          for (const d of data.days) tx.objectStore('days').put(d);
          tx.objectStore('habits').put(data.habit);
          for (const c of data.checks) tx.objectStore('habitChecks').put(c);
          for (const s of data.settings) tx.objectStore('settings').put(s);
          tx.oncomplete = () => {
            req.result.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
    goodDayData(),
  );
  await page.reload();
}

/** Mở app ở NOW, đợi app tạo DB (lần đầu tự sang Hôm nay), nạp dữ liệu rồi tải lại. */
async function start(page: Page, menuOpen: string) {
  await page.clock.setFixedTime(NOW);
  await page.goto('/');
  await expect(page.getByRole('button', { name: menuOpen })).toBeVisible();
  await seed(page);
  await expect(page.getByRole('button', { name: menuOpen })).toBeVisible();
}

async function goTab(page: Page, open: string, name: string) {
  const btn = page.getByRole('button', { name: open });
  if (await btn.isVisible()) await btn.click();
  await page.getByRole('button', { name, exact: true }).click();
}

test('đủ 90 ngày đạt: chấm đỏ → mở Cà chua → chọn Cà chua cho hôm nay', async ({ page }) => {
  await start(page, 'Mở menu');
  await goTab(page, 'Mở menu', 'Hôm nay');
  const btn = page.getByRole('button', { name: 'Đổi cây & chậu', exact: true });
  await expect(btn.locator('.icon-btn__badge')).toBeVisible();
  await btn.click();
  const sheet = page.getByRole('dialog', { name: 'Đổi cây & chậu' });
  await expect(sheet.getByText('Bạn được mở 1 cây mới, chạm để chọn')).toBeVisible();
  await expect(sheet.getByTestId('plant-unlock-progress')).toHaveText('90/180 ngày đạt');
  await sheet.getByRole('button', { name: 'Cà chua (đang khoá)' }).click();
  await sheet.getByRole('button', { name: 'Mở khoá: Cà chua' }).click();
  await expect(sheet.getByTestId('plant-unlocked')).toHaveText('Đã mở khoá Cà chua!');
  await expect(sheet.getByTestId('new-plant-tomato')).toHaveAttribute('data-locked', 'false');
  await expect(sheet.getByText('Bạn được mở 1 cây mới, chạm để chọn')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/unlock-sheet.png' });
  await sheet.getByRole('button', { name: 'Cà chua', exact: true }).click();
  await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-plant', 'tomato');
  await expect(btn.locator('.icon-btn__badge')).toHaveCount(0);
});

test.describe('tiếng Anh', () => {
  test.use({ locale: 'en-US' });

  test('90 good days: badge → unlock Tomato → pick it for today', async ({ page }) => {
    await start(page, 'Open menu');
    await goTab(page, 'Open menu', 'Today');
    const btn = page.getByRole('button', { name: 'Change plant & pot', exact: true });
    await expect(btn.locator('.icon-btn__badge')).toBeVisible();
    await btn.click();
    const sheet = page.getByRole('dialog');
    await expect(sheet.getByText('You can unlock 1 new plant, tap one to choose')).toBeVisible();
    await sheet.getByRole('button', { name: 'Tomato (locked)' }).click();
    await sheet.getByRole('button', { name: 'Unlock: Tomato' }).click();
    await expect(sheet.getByTestId('plant-unlocked')).toHaveText('Tomato unlocked!');
    await sheet.getByRole('button', { name: 'Tomato', exact: true }).click();
    await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-plant', 'tomato');
  });
});
