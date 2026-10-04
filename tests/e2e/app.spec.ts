import { expect, test, type Page } from '@playwright/test';

const at = (iso: string) => new Date(`${iso}+07:00`);

/** Chuyển tab qua menu nổi: mở menu nếu đang thu gọn rồi bấm tab. */
async function goTab(page: Page, name: 'Lịch' | 'Hôm nay' | 'Mẫu' | 'Cài đặt') {
  const open = page.getByRole('button', { name: 'Mở menu' });
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function openToday(page: Page) {
  await goTab(page, 'Hôm nay');
  await expect(page.getByTestId('plant-scene')).toBeVisible();
}

/** Thêm việc bằng nút ＋ ở hàng tiêu đề của buổi; dòng trống vẫn mở sau Enter nên thêm liên tiếp được. */
async function addTodo(page: Page, text: string, period: 'Sáng' | 'Chiều' | 'Tối' = 'Sáng') {
  const draft = page.getByLabel(`Việc mới buổi ${period}`);
  if (!(await draft.isVisible())) await page.getByRole('button', { name: `Thêm việc buổi ${period}` }).click();
  await draft.fill(text);
  await draft.press('Enter');
  await expect(page.getByRole('checkbox', { name: `Hoàn thành: ${text}` })).toBeVisible();
}

/** Đóng dòng việc trống đang mở (Escape). */
async function closeDraft(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.locator('.todo__row--draft')).toHaveCount(0);
}

test('tick việc làm cây lớn và dữ liệu còn sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Uống nước');
  await addTodo(page, 'Đọc sách');
  await closeDraft(page);
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
  await goTab(page, 'Mẫu');
  await page.getByRole('button', { name: '＋ Mẫu mới' }).click();
  await page.getByLabel('Tên mẫu').fill('Buổi sáng');
  await page.getByLabel('Việc buổi Sáng (mỗi dòng một việc)').fill('Tập thể dục');
  await page.getByLabel('Việc buổi Tối (mỗi dòng một việc)').fill('Ăn sáng');
  await page.getByRole('button', { name: 'Lưu mẫu' }).click();
  await page.getByRole('button', { name: 'Đặt làm mặc định: Buổi sáng' }).click();
  await expect(page.getByRole('button', { name: 'Bỏ mặc định: Buổi sáng' })).toBeVisible();

  await page.clock.setFixedTime(at('2026-10-03T03:30:00'));
  await page.reload();
  // trước 4:00 vẫn là ngày 02 → không tự mở màn Hôm nay vì đã chào
  await expect(page.getByTestId('calendar-card')).toBeVisible();

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
  await goTab(page, 'Lịch');
  await expect(page.getByTestId('day-2026-10-02')).toHaveAttribute('data-status', 'rest');
});

test('ngày bỏ trống hiện cây héo, trước ngày đầu tiên để trống', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.clock.setFixedTime(at('2026-10-04T10:00:00'));
  await page.reload();
  await goTab(page, 'Lịch');
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

test('hàng nút đổi cây/đổi chậu/ghi chú/ngày nghỉ hiện đủ, không bị danh sách che', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  const list = await page.locator('.today__list').boundingBox();
  for (const name of ['Đổi cây', 'Đổi chậu', 'Ghi chú', 'Ngày tiết kiệm năng lượng']) {
    const btn = page.getByRole('button', { name, exact: true });
    await expect(btn).toBeInViewport();
    const box = await btn.boundingBox();
    expect(box!.y + box!.height, `${name} bị che`).toBeLessThanOrEqual(list!.y + 1);
  }
});

test('lịch nằm giữa màn hình (theo chiều dọc, phía trên thanh tab)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Lịch');
  const head = (await page.getByTestId('calendar-head').boundingBox())!;
  const footer = (await page.locator('.cal__footer').boundingBox())!;
  const tabbar = (await page.getByRole('navigation', { name: 'Điều hướng' }).boundingBox())!;
  const topGap = head.y;
  const bottomGap = tabbar.y - (footer.y + footer.height);
  expect(Math.abs(topGap - bottomGap), `trên ${topGap}px, dưới ${bottomGap}px`).toBeLessThan(40);
});

test('nút ＋ nằm ngoài cùng bên phải hàng Sáng/Chiều/Tối; thêm việc trống vào đúng buổi', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await expect(page.getByRole('button', { name: 'Thêm việc mới' })).toHaveCount(0);
  for (const [p, label] of [['morning', 'Sáng'], ['afternoon', 'Chiều'], ['evening', 'Tối']] as const) {
    const section = page.getByTestId(`todo-section-${p}`);
    const add = (await section.getByRole('button', { name: `Thêm việc buổi ${label}` }).boundingBox())!;
    const title = (await section.getByRole('heading', { name: new RegExp(label) }).boundingBox())!;
    const box = (await section.boundingBox())!;
    expect(Math.abs(add.y + add.height / 2 - (title.y + title.height / 2)), `${label}: cùng hàng tiêu đề`).toBeLessThan(4);
    expect(box.x + box.width - (add.x + add.width), `${label}: sát mép phải`).toBeLessThan(16);
    expect(add.width).toBeCloseTo(add.height, 0);
  }
  await addTodo(page, 'Đi chợ', 'Chiều');
  await addTodo(page, 'Nấu cơm', 'Chiều');
  // dòng trống buổi Chiều còn mở mà bấm ＋ buổi Tối (Safari không lấy focus khỏi ô khi chạm nút)
  await addTodo(page, 'Đọc sách', 'Tối');
  // gõ dở ở buổi Tối rồi bấm ＋ buổi Sáng (phía trên): chữ đã gõ được lưu, dòng Sáng mở ra
  await page.getByLabel('Việc mới buổi Tối').fill('Tắm');
  await page.getByRole('button', { name: 'Thêm việc buổi Sáng' }).click();
  await expect(page.getByLabel('Việc mới buổi Sáng')).toBeFocused();
  await expect(page.getByLabel('Việc mới buổi Tối')).toHaveCount(0);
  // gõ dở ở buổi Sáng rồi bấm ＋ buổi Chiều (phía dưới): dòng Sáng đóng không được làm nút trượt khỏi ngón tay
  await page.getByLabel('Việc mới buổi Sáng').fill('Tập thể dục');
  await page.getByRole('button', { name: 'Thêm việc buổi Chiều' }).click();
  await expect(page.getByLabel('Việc mới buổi Chiều')).toBeFocused();
  await expect(page.getByTestId('todo-section-morning').locator('.todo__text')).toHaveText(['Tập thể dục']);
  await closeDraft(page);
  await expect(page.getByTestId('todo-section-afternoon').locator('.todo__text')).toHaveText(['Đi chợ', 'Nấu cơm']);
  await expect(page.getByTestId('todo-section-evening').locator('.todo__text')).toHaveText(['Đọc sách', 'Tắm']);
});

test('ô đầu danh sách là tiêu đề ngày và còn sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await page.getByLabel('Mục tiêu hôm nay').fill('Ngày dọn nhà');
  await page.getByLabel('Mục tiêu hôm nay').press('Enter');
  await expect(page.getByLabel('Mục tiêu hôm nay')).not.toBeFocused();
  // chờ ghi xong vào IndexedDB rồi mới tải lại
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<string | undefined>((resolve) => {
            const req = indexedDB.open('chau-cay-chibi');
            req.onsuccess = () => {
              const get = req.result.transaction('days').objectStore('days').get('2026-10-02');
              get.onsuccess = () => resolve(get.result?.title);
            };
          }),
      ),
    )
    .toBe('Ngày dọn nhà');
  await page.reload();
  await openToday(page);
  await expect(page.getByLabel('Mục tiêu hôm nay')).toHaveValue('Ngày dọn nhà');
});

test('việc chia 3 buổi; tick xong thì cây khen', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T19:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Đọc truyện', 'Tối');
  await closeDraft(page);
  const evening = page.getByTestId('todo-section-evening');
  await expect(evening.getByRole('checkbox', { name: 'Hoàn thành: Đọc truyện' })).toBeVisible();
  await expect(page.getByTestId('todo-section-morning').getByText('Chưa có việc')).toBeVisible();
  await evening.getByRole('checkbox', { name: 'Hoàn thành: Đọc truyện' }).click();
  await expect(page.getByTestId('speech-bubble')).toBeVisible();
});

test('menu nổi: nút ở góc phải dưới, dải tab trượt ra bên trái rồi thu lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  const toggle = page.getByRole('button', { name: 'Đóng menu' });
  // đang mở sau khi chọn tab
  const tabs = page.locator('#fnav-tabs');
  await expect(tabs).toBeVisible();
  const t = (await toggle.boundingBox())!;
  const bar = (await tabs.boundingBox())!;
  expect(bar.x + bar.width).toBeLessThanOrEqual(t.x + 1);
  expect(Math.abs(bar.y + bar.height / 2 - (t.y + t.height / 2))).toBeLessThan(6);
  await toggle.click();
  await expect(tabs).toHaveCount(0);
  const menu = (await page.getByRole('button', { name: 'Mở menu' }).boundingBox())!;
  const vp = page.viewportSize()!;
  expect(menu.x + menu.width).toBeGreaterThan(vp.width - 24);
  expect(menu.y + menu.height).toBeGreaterThan(vp.height - 90);
});

test('việc đã xong không bị gạch ngang chữ', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Uống nước');
  await closeDraft(page);
  await page.getByRole('checkbox', { name: 'Hoàn thành: Uống nước' }).click();
  const text = page.locator('.todo__row.is-done .todo__text');
  await expect(text).toHaveText('Uống nước');
  expect(await text.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('none');
});

test('tab Hôm nay: cây đứng yên, chỉ danh sách việc cuộn', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  for (let i = 1; i <= 10; i++) await addTodo(page, `Việc số ${i}`);
  await closeDraft(page);
  const sky = page.getByTestId('sky');
  const before = (await sky.boundingBox())!;
  const list = page.locator('.today__list');
  // cuộn tới việc cuối: trình duyệt tự cuộn khung chứa nó
  await page.getByRole('checkbox', { name: 'Hoàn thành: Việc số 10' }).scrollIntoViewIfNeeded();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Việc số 10' })).toBeInViewport();
  const after = (await sky.boundingBox())!;
  expect(after.y).toBe(before.y);
  expect(await list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test('chạm ngày tương lai mở màn giống Hôm nay để lên lịch; tới ngày đó việc hiện ở Hôm nay', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Lịch');
  await page.getByTestId('day-2026-10-05').click();
  const future = page.getByTestId('future-day');
  await expect(future.getByRole('heading', { name: 'Thứ Hai, 05/10/2026' })).toBeVisible();
  await future.getByRole('button', { name: 'Thêm việc buổi Tối' }).click();
  await future.getByLabel('Việc mới buổi Tối').fill('Gọi điện cho mẹ');
  await future.getByLabel('Việc mới buổi Tối').press('Enter');
  await closeDraft(page);
  await expect(future.getByTestId('todo-section-evening').getByText('Gọi điện cho mẹ')).toBeVisible();
  await future.getByRole('button', { name: 'Quay lại Lịch' }).click();
  await expect(page.getByTestId('day-2026-10-05').getByTestId('planned-count')).toHaveText('1');

  await page.clock.setFixedTime(at('2026-10-05T08:00:00'));
  await page.reload();
  await openToday(page);
  await expect(page.getByTestId('todo-section-evening').getByRole('checkbox', { name: 'Hoàn thành: Gọi điện cho mẹ' })).toBeVisible();
});

test('nút tròn vẫn tròn dù Safari gán padding mặc định lớn cho <button>', async ({ page }) => {
  // Giả lập UA stylesheet của một số bản Safari: nút có padding ngang lớn.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'button { padding: 1px 24px; }';
      document.head.prepend(s);
    });
  });
  await page.clock.setFixedTime(at('2026-10-02T15:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Dọn nhà');
  await closeDraft(page);
  const round = [
    page.getByRole('button', { name: 'Đổi cây' }),
    page.getByRole('button', { name: 'Thêm việc buổi Sáng' }),
    page.getByRole('checkbox', { name: 'Hoàn thành: Dọn nhà' }),
    page.getByRole('button', { name: /^(Mở|Đóng) menu$/ }),
  ];
  for (const el of round) {
    const box = (await el.boundingBox())!;
    expect(Math.abs(box.width - box.height), await el.getAttribute('aria-label') ?? '').toBeLessThan(1);
  }
});

/** Kéo nút ⋮⋮ của một việc tới điểm (x, y) theo từng bước như ngón tay. */
async function dragHandle(page: Page, text: string, to: { x: number; y: number }) {
  const row = page.locator('.todo__row', { hasText: text });
  const box = (await row.locator('.todo__handle').boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

test('kéo việc sang buổi khác và sắp xếp trong buổi; còn nguyên sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T09:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Tưới cây');
  await addTodo(page, 'Uống nước');
  await closeDraft(page);
  await page.getByRole('button', { name: 'Đóng menu' }).click(); // dải tab đang mở che mất nút kéo
  const morning = page.getByTestId('todo-section-morning');
  const afternoon = page.getByTestId('todo-section-afternoon');

  // kéo "Tưới cây" thả vào buổi Chiều (đang trống)
  const target = (await afternoon.boundingBox())!;
  await dragHandle(page, 'Tưới cây', { x: target.x + target.width / 2, y: target.y + target.height / 2 });
  await expect(afternoon.getByRole('checkbox', { name: 'Hoàn thành: Tưới cây' })).toBeVisible();
  await expect(morning.getByRole('checkbox', { name: 'Hoàn thành: Tưới cây' })).toHaveCount(0);

  // kéo "Uống nước" lên trên đầu buổi Chiều
  const first = (await afternoon.locator('.todo__row').first().boundingBox())!;
  await dragHandle(page, 'Uống nước', { x: first.x + first.width / 2, y: first.y + 4 });
  await expect(afternoon.locator('.todo__text')).toHaveText(['Uống nước', 'Tưới cây']);
  await expect(morning.getByText('Chưa có việc')).toBeVisible();

  await page.reload();
  await openToday(page);
  await expect(page.getByTestId('todo-section-afternoon').locator('.todo__text')).toHaveText(['Uống nước', 'Tưới cây']);
});
