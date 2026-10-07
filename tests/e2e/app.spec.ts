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

/** Màn Mẫu nằm trong Cài đặt: thẻ "Mẫu việc" → Quản lý mẫu. */
async function openTemplates(page: Page) {
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Quản lý mẫu' }).click();
  await expect(page.getByRole('heading', { name: 'Mẫu việc cần làm' })).toBeVisible();
}

/** Màn Nhắc việc mở từ nút chuông dưới chậu ở màn Hôm nay. */
async function openReminders(page: Page) {
  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Nhắc việc', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nhắc việc', level: 1 })).toBeVisible();
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
  await openTemplates(page);
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

test('hàng nút đổi cây/đổi chậu/ghi chú/ngày nghỉ/nhắc việc hiện đủ, cùng một hàng, không bị danh sách che', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  const list = await page.locator('.today__list').boundingBox();
  const tops: number[] = [];
  for (const name of ['Đổi cây', 'Đổi chậu', 'Ghi chú', 'Ngày tiết kiệm năng lượng', 'Nhắc việc']) {
    const btn = page.getByRole('button', { name, exact: true });
    await expect(btn).toBeInViewport();
    const box = await btn.boundingBox();
    expect(box!.y + box!.height, `${name} bị che`).toBeLessThanOrEqual(list!.y + 1);
    expect(box!.x + box!.width, `${name} tràn ngang`).toBeLessThanOrEqual(page.viewportSize()!.width);
    tops.push(Math.round(box!.y));
  }
  expect(new Set(tops).size, '5 nút nằm cùng một hàng').toBe(1);
  await page.screenshot({ path: 'test-results/today-five-buttons.png' });
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
    // nút ＋ không làm hàng tiêu đề cao hơn chính tiêu đề buổi
    const head = (await section.locator('.todo__section-head').boundingBox())!;
    expect(head.height - title.height, `${label}: hàng tiêu đề bị giãn`).toBeLessThan(1);
  }
  // nút ＋ cùng màu nền với nút bông hoa mở menu (lúc menu thu gọn; khi mở nút hoa đổi sang trắng)
  await closeMenu(page);
  const bg = (loc: ReturnType<Page['locator']>) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg(page.getByRole('button', { name: 'Thêm việc buổi Sáng' }))).toBe(await bg(page.locator('.fnav__toggle')));
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
  // mở lại rồi chạm ra ngoài (vào bầu trời) thì dải tab tự thu
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(tabs).toBeVisible();
  await page.getByTestId('sky').tap({ position: { x: 40, y: 200 } });
  await expect(tabs).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Mở menu' })).toHaveAttribute('aria-expanded', 'false');
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
  await closeMenu(page); // dải tab đang mở che mất nút kéo
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

test('Khu vườn: là một tab, đếm cây hôm nay, bố cục vừa khổ iPhone', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  const plant = await page.getByTestId('plant-scene').getAttribute('data-plant');
  await goTab(page, 'Lịch');
  await closeMenu(page);
  // màn Lịch không còn nút Khu vườn; nút đổi hình nền đứng giữa
  await expect(page.getByTestId('calendar-card')).toBeVisible();
  await expect(page.locator('.cal__footer').getByRole('button', { name: 'Khu vườn' })).toHaveCount(0);
  const bgBtn = (await page.getByRole('button', { name: /Đổi hình nền lịch/ }).boundingBox())!;
  expect(Math.abs(bgBtn.x + bgBtn.width / 2 - page.viewportSize()!.width / 2)).toBeLessThan(4);
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  const garden = page.getByTestId('garden');
  await expect(garden.getByRole('heading', { name: 'Khu vườn' })).toBeVisible();
  await expect(garden.getByTestId(`garden-plant-${plant}`).locator('.garden__count')).toHaveText('1');
  await expect(garden.getByTestId('garden-summary')).toContainText('1 ngày');
  // không tràn ngang; ô chọn ngày nằm gọn trong thẻ; 3 cây mỗi hàng
  const vw = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vw);
  const card = (await garden.locator('.garden__range').boundingBox())!;
  for (const label of ['Từ ngày', 'Đến ngày']) {
    const input = (await garden.getByLabel(label).boundingBox())!;
    expect(input.x + input.width, label).toBeLessThanOrEqual(card.x + card.width);
  }
  const tops = await garden.locator('.garden__bed').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops.filter((t) => t === tops[0])).toHaveLength(3);
  await garden.getByRole('button', { name: 'Quay lại Lịch' }).click();
  await expect(page.getByTestId('calendar-card')).toBeVisible();
});

test('chạm ngày đã qua: bảng chi tiết phủ gần hết màn Lịch, tiêu đề và nút X luôn thấy', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  for (let i = 1; i <= 12; i++) await addTodo(page, `Việc số ${i}`);
  await closeDraft(page);
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.reload();
  await goTab(page, 'Lịch');
  await closeMenu(page);
  await page.getByTestId('day-2026-10-02').click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByTestId('detail-section-morning')).toBeVisible();
  const vh = page.viewportSize()!.height;
  // chờ bảng trượt lên xong rồi mới đo
  await expect.poll(async () => (await sheet.boundingBox())!.y, { message: 'mép trên gần đỉnh màn hình' }).toBeLessThan(vh * 0.12);
  await expect.poll(async () => { const b = (await sheet.boundingBox())!; return Math.round(b.y + b.height); }).toBe(vh);
  // danh sách dài cuộn bên trong, tiêu đề và nút X vẫn ở trên cùng
  await sheet.getByText('Việc số 12').scrollIntoViewIfNeeded();
  await expect(sheet.getByText('Việc số 12')).toBeInViewport();
  await expect(sheet.getByRole('heading', { level: 2 })).toBeInViewport();
  await expect(sheet.getByRole('button', { name: 'Đóng' })).toBeInViewport();
  await sheet.getByRole('button', { name: 'Đóng' }).click();
  await expect(sheet).toHaveCount(0);
});

// GIF động 2 khung 1×1 px (đỏ rồi xanh), để kiểm tra GIF được lưu nguyên vẹn
const ANIMATED_GIF = Buffer.from(
  'R0lGODlhAQABAPAAAP8AAAAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQACgAAACwAAAAAAQABAAACAkQBACH5BAAKAAAALAAAAAABAAEAgAAA/wAAAAICRAEAOw==',
  'base64',
);

test('nền Lịch động: chọn GIF thì giữ nguyên tệp làm ảnh nền; chọn video thì phát bằng thẻ video', async ({ page }) => {
  await page.goto('/');
  await goTab(page, 'Lịch');
  await closeMenu(page);
  const input = page.getByTestId('bg-input');
  await expect(input).toHaveAttribute('accept', 'image/*,video/*');

  await input.setInputFiles({ name: 'meo.gif', mimeType: 'image/gif', buffer: ANIMATED_GIF });
  const screenEl = page.locator('.screen--calendar');
  await expect(screenEl).toHaveAttribute('data-theme', 'photo');
  await expect.poll(() => screenEl.evaluate((el) => getComputedStyle(el).backgroundImage)).toContain('blob:');
  const stored = await page.evaluate(
    () =>
      new Promise<{ mime: string; size: number }>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const get = req.result.transaction('settings').objectStore('settings').get('calendarBg');
          get.onsuccess = () => resolve({ mime: get.result.value.mime, size: get.result.value.data.byteLength });
        };
      }),
  );
  expect(stored).toEqual({ mime: 'image/gif', size: ANIMATED_GIF.length });

  await input.setInputFiles({ name: 'IMG_0001.mp4', mimeType: 'video/mp4', buffer: Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50]) });
  const video = page.getByTestId('calendar-video');
  await expect(video).toBeAttached();
  expect(await video.evaluate((v: HTMLVideoElement) => ({ muted: v.muted, loop: v.loop, inline: v.playsInline }))).toEqual({ muted: true, loop: true, inline: true });
  expect(await screenEl.evaluate((el) => getComputedStyle(el).backgroundImage)).not.toContain('blob:');
  // video nằm sau thẻ lịch, phủ kín màn
  const vb = (await video.boundingBox())!;
  expect(vb.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  await expect(page.getByTestId('calendar-card')).toBeVisible();
});

test('Cài đặt: mục Ủng hộ tôi có mã QR tải được và nút PayPal', async ({ page }) => {
  await page.goto('/');
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  const qr = page.getByRole('img', { name: 'Mã QR chuyển khoản TPBank' });
  await qr.scrollIntoViewIfNeeded();
  await expect(qr).toBeVisible();
  await expect.poll(() => qr.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth)).toBe(890);
  await expect(page.getByRole('link', { name: 'Ủng hộ qua PayPal' })).toHaveAttribute('href', 'https://paypal.me/dattruong92');
  await expect(page.getByRole('button', { name: 'Lưu mã QR' })).toBeVisible();
  const vw = page.viewportSize()!.width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(vw);
});

test('nền Mèo vươn vai: mèo nằm trên mép dưới (không sát thanh Home) và dưới các nút của Lịch', async ({ page }) => {
  // app cài ra màn hình chính dùng đủ 844px của iPhone 13 (khung mặc định 664px là Safari còn thanh địa chỉ)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await goTab(page, 'Lịch');
  await closeMenu(page);
  await page.getByRole('button', { name: /Đổi hình nền lịch/ }).click();
  await page.getByRole('radio', { name: /Mèo vươn vai/ }).click();
  const scene = page.getByTestId('calendar-theme-cat');
  await expect(scene).toBeVisible();
  const vh = page.viewportSize()!.height;
  const rug = (await scene.locator('ellipse').first().boundingBox())!;
  expect(vh - (rug.y + rug.height), 'thảm cách mép dưới').toBeGreaterThan(40);
  const footer = (await page.getByRole('button', { name: /Đổi hình nền lịch/ }).boundingBox())!;
  const cat = (await scene.locator('.cat-head').boundingBox())!;
  expect(cat.y, 'mèo nằm dưới hàng nút').toBeGreaterThan(footer.y + footer.height);
});

test('nền Cún vẫy đuôi: cún nằm dưới các nút của Lịch, không bị nút menu che, không sát thanh Home', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await goTab(page, 'Lịch');
  await closeMenu(page);
  await page.getByRole('button', { name: /Đổi hình nền lịch/ }).click();
  await page.getByRole('radio', { name: /Cún vẫy đuôi/ }).click();
  const scene = page.getByTestId('calendar-theme-dog');
  await expect(scene).toBeVisible();
  const vh = page.viewportSize()!.height;
  const dog = (await scene.locator('.dog').boundingBox())!;
  expect(vh - (dog.y + dog.height), 'cún cách mép dưới').toBeGreaterThan(40);
  const footer = (await page.getByRole('button', { name: /Đổi hình nền lịch/ }).boundingBox())!;
  const head = (await scene.locator('.dog-head').boundingBox())!;
  expect(head.y, 'cún nằm dưới hàng nút').toBeGreaterThan(footer.y + footer.height);
  const menu = (await page.getByRole('button', { name: 'Mở menu' }).boundingBox())!;
  expect(dog.x + dog.width, 'cún không bị nút menu che').toBeLessThan(menu.x);
  await page.screenshot({ path: 'test-results/calendar-dog.png' });
});

test('hiệu ứng Vàng ròng đổi màu cây thật trên WebKit (Safari)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openToday(page);
  // gieo một ngày Cherry Vàng ròng và bật tách riêng cây đặc biệt
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction(['days', 'settings'], 'readwrite');
          tx.objectStore('days').put({ date: '2026-10-03', plantId: 'cherry', potId: 'polka', specialId: 'gold', isRestDay: false, greetedAt: 1, note: '', todos: [], finalStage: 'bloom', createdAt: 1, updatedAt: 1 });
          tx.objectStore('settings').put({ key: 'gardenSeparateSpecial', value: true });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  const scene = page.getByTestId('garden-special-cherry-gold').getByTestId('plant-scene');
  await expect(scene).toBeVisible();
  // vẽ đúng SVG đó lên canvas (WebKit dựng hình) rồi lấy màu trung bình một dải giữa tán cây
  const avg = await scene.evaluate(async (svg) => {
    const markup = svg.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240"');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 240;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const d = ctx.getImageData(60, 62, 80, 10).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    return { r: r / n, g: g / n, b: b / n };
  });
  // tán cherry gốc hồng (#FFC9DA, xanh dương ~218); vàng ròng thì xanh dương phải thấp hẳn
  expect(avg.b, JSON.stringify(avg)).toBeLessThan(170);
  expect(avg.r).toBeGreaterThan(avg.b + 60);
});

test('menu nổi: 4 tab Lịch, Hôm nay, Khu vườn, Cài đặt; Mẫu nằm trong Cài đặt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở menu' }).click();
  const tabs = page.locator('#fnav-tabs').getByRole('button');
  await expect(tabs).toHaveText(['Lịch', 'Hôm nay', 'Khu vườn', 'Cài đặt']);
  await page.waitForTimeout(400); // chờ dải tab trượt ra hết rồi chụp
  await page.screenshot({ path: 'test-results/menu-tabs.png' });
  // dải tab nằm gọn trong khổ màn hình
  for (const left of await tabs.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left))) expect(left).toBeGreaterThanOrEqual(0);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).click();
  await closeMenu(page);
  await page.screenshot({ path: 'test-results/settings-templates-card.png' });
  await page.getByRole('button', { name: 'Quản lý mẫu' }).click();
  await expect(page.getByRole('heading', { name: 'Mẫu việc cần làm' })).toBeVisible();
  await page.getByRole('button', { name: 'Quay lại Cài đặt' }).click();
  await expect(page.getByRole('heading', { name: 'Cài đặt' })).toBeVisible();
});

test('chọn lại cây đặc biệt đã mở khoá trong bảng Đổi cây', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  // giả lập đã từng tung trúng 3 cây đặc biệt
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'unlockedSpecials', value: ['orange|gold', 'corn|glow', 'hydrangea|crystal'] });
          tx.oncomplete = () => resolve();
        };
      }),
  );
  // ghi thẳng vào IndexedDB thì Dexie không biết, nên tải lại trang
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Đổi cây' }).click();
  const sheet = page.getByRole('dialog', { name: 'Chọn cây hôm nay' });
  const specials = sheet.getByTestId('picker-specials');
  // hôm nay có thể tự trúng cây đặc biệt (10%, ngẫu nhiên thật) nên có thể nhiều hơn 3 cặp
  for (const name of ['Ngô · Phát sáng', 'Cây cam · Vàng ròng', 'Tulip · Pha lê']) {
    await expect(specials.getByRole('button', { name })).toBeVisible();
  }
  await specials.getByRole('button', { name: 'Cây cam · Vàng ròng' }).scrollIntoViewIfNeeded();
  // chờ bảng trượt lên xong rồi chụp để soát hình
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/plant-picker-specials.png' });
  const vw = page.viewportSize()!.width;
  for (const box of await specials.getByRole('button').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
    expect(box).toBeLessThanOrEqual(vw);
  }
  await specials.getByRole('button', { name: 'Cây cam · Vàng ròng' }).click();
  const scene = page.getByTestId('plant-scene');
  await expect(scene).toHaveAttribute('data-special', 'gold');
  await expect(scene).toHaveAttribute('data-plant', 'orange');
});

test('Khu vườn: luống có ngày (kể cả Cây héo) đứng trên các loài 0 ngày', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  // bỏ 03, 04/10 → 2 ngày cây héo
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.reload();
  await openToday(page);
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  const garden = page.getByTestId('garden');
  await expect(garden.getByTestId('garden-wilted').locator('.garden__count')).toHaveText('2');
  const beds = await garden.locator('.garden__bed').evaluateAll((els) =>
    els.map((e) => ({ id: e.getAttribute('data-testid'), empty: e.classList.contains('is-empty') })),
  );
  const firstEmpty = beds.findIndex((b) => b.empty);
  expect(firstEmpty).toBeGreaterThan(0);
  expect(beds.slice(firstEmpty).every((b) => b.empty)).toBe(true);
  expect(beds.slice(0, firstEmpty).map((b) => b.id)).toContain('garden-wilted');
  await garden.getByTestId('garden-summary').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/garden-order.png' });
});

test('chạm vào cây thì cây cười và nói một câu (WebKit)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await closeMenu(page);
  const scene = page.getByTestId('plant-scene');
  const tap = page.getByRole('button', { name: 'Chạm vào cây' });
  // vùng chạm phủ đúng phần vẽ cây (SVG 200×240 căn giữa), không lấn xuống hàng 4 nút
  const svg = (await scene.boundingBox())!;
  const box = (await tap.boundingBox())!;
  const drawnW = Math.min(svg.width, (svg.height * 200) / 240);
  expect(Math.abs(box.width - drawnW)).toBeLessThan(3);
  expect(Math.abs(box.x + box.width / 2 - (svg.x + svg.width / 2))).toBeLessThan(2);
  const actions = (await page.getByRole('button', { name: 'Đổi cây' }).boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(actions.y);
  // lời cây nói của ngày hiện sẵn; chạm vào thân cây thì cây đáp một câu tạm, chạm tiếp thì đổi câu
  const bubble = page.getByTestId('speech-bubble');
  await expect(bubble).toHaveAttribute('data-kind', 'daily');
  await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6);
  await expect(bubble).toHaveAttribute('data-kind', 'tap');
  const first = await bubble.textContent();
  // câu tạm chỉ để xem: chạm lên nó (kể cả chỗ phủ xuống cây) vẫn tới cây
  const b = (await bubble.boundingBox())!;
  await page.mouse.click(b.x + b.width / 2, b.y + b.height - 6);
  await expect(bubble).not.toHaveText(first!);
  await expect(scene).toHaveAttribute('data-mood', 'smile');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/plant-tap.png' });
  // nút quay lại vẫn bấm được (không bị vùng chạm che)
  await page.getByRole('button', { name: 'Quay lại Lịch' }).click();
  await expect(page.getByTestId('calendar-card')).toBeVisible();
});

test('lời cây nói: chạm bong bóng để sửa, ẩn/hiện được nhớ qua lần mở sau (WebKit)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await closeMenu(page);
  const bubble = page.getByTestId('speech-bubble');
  await expect(bubble).toHaveAttribute('data-kind', 'daily');
  await page.getByRole('button', { name: 'Sửa lời cây nói' }).click();
  const box = page.getByLabel('Lời cây nói', { exact: true });
  await expect(box).toBeFocused();
  await box.fill('Hôm nay mình cùng cố gắng nha');
  await page.screenshot({ path: 'test-results/plant-speech-edit.png' });
  await box.press('Enter');
  await expect(bubble).toHaveText('Hôm nay mình cùng cố gắng nha');
  // nút ẩn/hiện nằm trong khung trời, không đè lên bong bóng
  const toggle = page.getByRole('button', { name: 'Ẩn lời cây nói' });
  const t = (await toggle.boundingBox())!;
  const bb = (await bubble.boundingBox())!;
  expect(t.x >= bb.x + bb.width || t.y >= bb.y + bb.height).toBe(true);
  await page.screenshot({ path: 'test-results/plant-speech.png' });
  await toggle.click();
  await expect(bubble).toHaveCount(0);
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  await expect(page.getByRole('button', { name: 'Hiện lời cây nói' })).toBeVisible();
  await expect(page.getByTestId('speech-bubble')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hiện lời cây nói' }).click();
  await expect(page.getByTestId('speech-bubble')).toHaveText('Hôm nay mình cùng cố gắng nha');
});

test('Khu vườn gọn: công tắc thu trong nút Tuỳ chọn, tóm tắt một dòng kể cả số lớn (WebKit)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  const garden = page.getByTestId('garden');
  const optionsBtn = garden.getByRole('button', { name: 'Tuỳ chọn hiển thị' });
  await expect(optionsBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(garden.getByRole('switch')).toHaveCount(0);
  // nút nằm trên hàng tiêu đề, không đẩy thẻ chọn ngày xuống
  const head = (await garden.getByRole('heading', { name: 'Khu vườn' }).boundingBox())!;
  const btn = (await optionsBtn.boundingBox())!;
  expect(Math.abs(btn.y + btn.height / 2 - (head.y + head.height / 2))).toBeLessThan(6);
  // tóm tắt một dòng, kể cả khi số lớn nhất có thể
  const summary = garden.getByTestId('garden-summary');
  await expect(summary).toContainText('ra hoa');
  await summary.evaluate((el) => {
    const nums = ['365', '365', '2000', '99'];
    el.querySelectorAll('b').forEach((b, i) => { b.textContent = nums[i]; });
  });
  const box = (await summary.boundingBox())!;
  const lineH = await summary.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.6);
  expect(box.height).toBeLessThan(lineH * 1.6 + 20);
  const vw = page.viewportSize()!.width;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vw);
  // chữ không tràn khỏi viền của khung
  expect(await summary.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/garden-compact.png' });
  await optionsBtn.click();
  await expect(garden.getByRole('switch', { name: 'Chỉ hiện cây đã trồng' })).toBeVisible();
  await page.screenshot({ path: 'test-results/garden-options-open.png' });
});

test('Cài đặt: hướng dẫn cài app nằm sau nút dấu hỏi trên hàng tiêu đề (WebKit)', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  await expect(page.getByRole('heading', { name: 'Cài app lên màn hình chính' })).toHaveCount(0);
  const help = page.getByRole('button', { name: 'Hướng dẫn cài app' });
  const head = (await page.getByRole('heading', { name: 'Cài đặt' }).boundingBox())!;
  const btn = (await help.boundingBox())!;
  expect(Math.abs(btn.y + btn.height / 2 - (head.y + head.height / 2))).toBeLessThan(6);
  expect(btn.x + btn.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: 'test-results/settings-head.png' });
  await help.click();
  const sheet = page.getByRole('dialog', { name: 'Cài app lên màn hình chính' });
  await expect(sheet.getByText(/Thêm vào MH chính/)).toBeVisible();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'test-results/settings-install-sheet.png' });
  await sheet.getByRole('button', { name: 'Đóng' }).click();
  await expect(sheet).toHaveCount(0);
});

test('dáng cây: đủ 10 ngày ra hoa mở dáng 2; dáng 3 khoá và không lộ hình', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openToday(page);
  // gieo 12 ngày Hướng dương ra hoa
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction(['days'], 'readwrite');
          for (let i = 1; i <= 12; i++) {
            tx.objectStore('days').put({ date: `2026-09-${String(i).padStart(2, '0')}`, plantId: 'sunflower', potId: 'terracotta', specialId: null, isRestDay: false, greetedAt: 1, note: '', todos: [], finalStage: 'bloom', createdAt: 1, updatedAt: 1 });
          }
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Đổi cây' }).click();
  // nút dáng vẫn tròn trên Safari
  const styleBtn = page.getByRole('button', { name: 'Dáng cây: Hướng dương (2/3)' });
  const box = (await styleBtn.boundingBox())!;
  expect(Math.abs(box.width - box.height)).toBeLessThan(2);
  await styleBtn.click();
  await expect(page.getByRole('dialog', { name: 'Dáng của Hướng dương' })).toBeVisible();
  // thanh tiến độ phải trải ngang (khung bảng căn giữa từng làm nó co thành một vạch)
  const bar = page.getByRole('progressbar', { name: 'Tiến độ mở dáng' });
  await expect(bar).toContainText('12/20');
  expect((await bar.boundingBox())!.width).toBeGreaterThan(150);
  const locked = page.getByTestId('style-giant');
  await expect(locked).toContainText('Dáng bí ẩn');
  await expect(locked.getByTestId('picker-scene')).toHaveCount(0);
  await page.getByTestId('style-mini').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const scene = page.getByTestId('plant-scene').first();
  await expect(scene).toHaveAttribute('data-style', 'mini');
  await expect(scene).toHaveAttribute('data-plant', 'sunflower');
});

test('dáng cây: ra hoa lần thứ 10 thì hiện khung mừng mở dáng mới', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openToday(page);
  // gieo 9 ngày Hướng dương ra hoa
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const req = indexedDB.open('chau-cay-chibi');
        req.onsuccess = () => {
          const tx = req.result.transaction(['days'], 'readwrite');
          for (let i = 1; i <= 9; i++) {
            tx.objectStore('days').put({ date: `2026-09-${String(i).padStart(2, '0')}`, plantId: 'sunflower', potId: 'terracotta', specialId: null, isRestDay: false, greetedAt: 1, note: '', todos: [], finalStage: 'bloom', createdAt: 1, updatedAt: 1 });
          }
          tx.oncomplete = () => resolve();
        };
      }),
  );
  await page.reload();
  await openToday(page);
  await closeMenu(page);
  await page.getByRole('button', { name: 'Đổi cây' }).click();
  await page.getByRole('button', { name: 'Hướng dương', exact: true }).click();
  await expect(page.getByTestId('plant-scene').first()).toHaveAttribute('data-plant', 'sunflower');
  await addTodo(page, 'Tưới cây');
  await closeDraft(page);
  await page.getByRole('checkbox', { name: 'Hoàn thành: Tưới cây' }).click();
  await expect(page.getByTestId('style-unlock')).toContainText('Mở khoá dáng mới: Hướng dương · Mini!');
});

test('Nhắc việc: bật Hôm nay thì việc vào buổi Sáng, chưa xong thì hôm sau lại có, tick xong thì xuống mục đã hoàn thành', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-05T10:00:00'));
  await page.goto('/');
  await openReminders(page);
  await expect(page.getByTestId('reminders-hero').locator('[data-mood="sleep"]')).toBeVisible();
  await page.screenshot({ path: 'test-results/reminders-empty.png' });
  await page.getByRole('button', { name: '＋ Việc nhắc mới' }).click();
  await page.getByLabel('Việc nhắc mới').fill('Mua điện thoại cho mẹ');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('button', { name: '＋ Việc nhắc mới' }).click();
  await page.getByLabel('Việc nhắc mới').fill('Mua quần áo');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  const active = page.getByTestId('reminders-active');
  await expect(active.getByText('Mua quần áo')).toBeVisible();
  const sw = page.getByRole('switch', { name: 'Thêm vào hôm nay: Mua điện thoại cho mẹ' });
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByTestId('rem-stat-active')).toHaveText('2');
  await page.getByRole('button', { name: '＋ Việc nhắc mới' }).click();
  await page.getByLabel('Việc nhắc mới').fill('Đặt lịch khám răng định kỳ cho cả nhà vào cuối tháng sau khi đi công tác về');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByTestId('rem-stat-active')).toHaveText('3');
  // thẻ đầu trang và mọi thẻ việc không tràn ngang khổ iPhone 13
  for (const el of [page.getByTestId('reminders-hero'), ...(await active.getByRole('listitem').all())]) {
    const box = await el.boundingBox();
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  // nút ☀ Hôm nay chỉ là icon tròn, nằm cùng hàng với chữ của việc (không xuống dòng riêng)
  const rowText = active.getByRole('button', { name: 'Mua quần áo', exact: true });
  const rowSw = page.getByRole('switch', { name: 'Thêm vào hôm nay: Mua quần áo' });
  await expect(rowSw).toHaveText('');
  const tb = (await rowText.boundingBox())!;
  const sb = (await rowSw.boundingBox())!;
  expect(sb.y + sb.height / 2).toBeGreaterThan(tb.y);
  expect(sb.y + sb.height / 2).toBeLessThan(tb.y + tb.height);
  expect(Math.abs(sb.width - sb.height)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: 'test-results/reminders.png', fullPage: true });

  // màn Nhắc việc nằm trong tab Hôm nay: về bằng nút quay lại
  await page.getByRole('button', { name: 'Quay lại Hôm nay' }).click();
  await expect(page.getByTestId('plant-scene')).toBeVisible();
  const morning = page.getByTestId('todo-section-morning');
  await expect(morning.getByRole('checkbox', { name: 'Hoàn thành: Mua điện thoại cho mẹ' })).toBeVisible();
  await expect(morning.locator('[data-icon="bell"]')).toHaveCount(1);

  await page.clock.setFixedTime(at('2026-10-06T10:00:00'));
  await page.reload();
  // lần đầu trong ngày App tự chuyển sang Hôm nay (chào buổi sáng): không mở menu để khỏi đua với lần chuyển tab đó
  await expect(page.getByTestId('plant-scene')).toBeVisible();
  const box2 = page.getByTestId('todo-section-morning').getByRole('checkbox', { name: 'Hoàn thành: Mua điện thoại cho mẹ' });
  await expect(box2).toBeVisible();
  await box2.click();
  await expect(page.getByTestId('todo-section-morning').getByRole('checkbox', { name: 'Bỏ hoàn thành: Mua điện thoại cho mẹ' })).toBeVisible();

  // sau khi đổi đồng hồ giả, animation đóng menu của WebKit đứng ~5 giây (lệch timeline, không phải lỗi app):
  // không chờ dải tab thu lại, bấm thẳng nút (chạm ra ngoài cũng tự thu menu)
  await goTab(page, 'Hôm nay');
  await page.getByRole('button', { name: 'Nhắc việc', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nhắc việc', level: 1 })).toBeVisible();
  await expect(page.getByTestId('reminders-done').getByText('Mua điện thoại cho mẹ')).toBeVisible();
  await expect(page.getByTestId('reminders-active').getByText('Mua điện thoại cho mẹ')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/reminders-done.png' });
});

test('xoá toàn bộ dữ liệu: gõ XOA rồi xoá, app bắt đầu lại từ đầu và vẫn sạch sau khi tải lại', async ({ page }) => {
  await page.clock.setFixedTime(at('2026-10-02T10:00:00'));
  await page.goto('/');
  await openToday(page);
  await addTodo(page, 'Uống nước');
  await closeDraft(page);
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  await page.getByRole('button', { name: '🗑 Xoá toàn bộ dữ liệu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Xoá toàn bộ dữ liệu?' });
  await expect(dialog.getByText(/1 ngày cây/)).toBeVisible();
  const confirm = dialog.getByRole('button', { name: 'Xoá vĩnh viễn' });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel('Gõ XOA để xác nhận').fill('XOA');
  await page.screenshot({ path: 'test-results/reset-data.png' });
  await confirm.click();
  // về Hôm nay với ngày mới tinh
  await expect(page.getByTestId('plant-scene')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Uống nước' })).toHaveCount(0);
  await page.reload();
  await openToday(page);
  await expect(page.getByRole('checkbox', { name: 'Hoàn thành: Uống nước' })).toHaveCount(0);
});
