import { expect, test, type Page } from '@playwright/test';

/**
 * Bố cục trên nhiều cỡ máy (iPhone nhỏ/lớn, Android hẹp/rộng/gập): chạy ở mọi project của playwright.config.ts.
 * Dữ liệu nạp một lần qua Khôi phục (gộp) cho nhanh; safe-area giả bằng biến --safe-area-inset-* (metadata của project).
 */

const at = (iso: string) => new Date(`${iso}+07:00`);
const NOW = at('2026-10-08T10:00:00'); // thứ Năm
const TODAY = '2026-10-08';

const PLANTS = ['sunflower', 'corn', 'cactus', 'pothos', 'orange', 'cherry', 'rose', 'watermelon', 'hydrangea'];
const POTS = ['terracotta', 'rattan', 'concrete', 'mint', 'wood', 'polka', 'rose-porcelain', 'tin-bucket', 'blue-ceramic'];
const HABITS = Array.from({ length: 6 }, (_, i) => ({ id: `h${i}`, name: `Thói quen rất dài số ${i + 1} để thử tràn chữ` }));

function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todo(i: number, text: string, period: 'morning' | 'afternoon' | 'evening', done: boolean) {
  return { id: `t${i}`, text, done, doneAt: done ? NOW.getTime() : null, order: i, period };
}

/** File sao lưu: 120 ngày đủ mọi loài (có ngày đặc biệt, nghỉ, bỏ lỡ), hôm nay nhiều việc + lời cây dài, 6 thói quen tên dài. */
function backup(): string {
  const t = NOW.getTime();
  const days = [];
  for (let i = 120; i >= 1; i--) {
    const date = addDays(TODAY, -i);
    if (i % 17 === 0) continue; // ngày bỏ lỡ → cây héo
    const p = i % PLANTS.length;
    days.push({
      date, plantId: PLANTS[p], potId: POTS[p], specialId: i % 11 === 0 ? 'glow' : null, isRestDay: i % 13 === 0,
      title: 'Mục tiêu', speech: '', greetedAt: t, note: i % 5 === 0 ? 'ghi chú' : '',
      todos: [todo(0, 'Việc cũ', 'morning', true)], finalStage: 'bloom', createdAt: t, updatedAt: t,
    });
  }
  const todos = [
    todo(0, 'Uống một cốc nước ấm thật to ngay sau khi thức dậy buổi sáng', 'morning', true),
    todo(1, 'Tập thể dục', 'morning', false),
    todo(2, 'Đọc sách', 'morning', false),
    todo(3, 'Đi chợ mua rau', 'afternoon', true),
    todo(4, 'Gọi điện cho mẹ', 'afternoon', false),
    todo(5, 'Viết nhật ký', 'evening', false),
    todo(6, 'Chuẩn bị quần áo cho ngày mai', 'evening', false),
    todo(7, 'Đi ngủ sớm', 'evening', false),
  ];
  days.push({
    date: TODAY, plantId: 'sunflower', potId: 'terracotta', specialId: null, isRestDay: false,
    title: 'Hôm nay cố gắng làm xong hết mọi việc nha!',
    speech: 'Hôm nay trời đẹp quá, mình cùng nhau làm thật nhiều việc tốt và uống đủ nước nha bạn ơi!',
    greetedAt: t, note: '', todos, finalStage: 'sprout', createdAt: t, updatedAt: t + 86_400_000,
  });
  const habits = HABITS.map((h, i) => ({
    id: h.id, name: h.name, icon: '💧', color: 'mint', weekdays: [0, 1, 2, 3, 4, 5, 6], order: i,
    startDate: addDays(TODAY, -60), createdAt: t, updatedAt: t,
  }));
  const habitChecks = HABITS.flatMap((h) => Array.from({ length: 30 }, (_, i) => ({ habitId: h.id, date: addDays(TODAY, -i - 1), at: t })));
  return JSON.stringify({
    format: 'chau-cay-chibi-backup', schemaVersion: 6, exportedAt: t, days,
    templates: [{ id: 'tpl1', name: 'Mẫu buổi sáng thật dài để thử tràn chữ', items: [{ text: 'Uống nước', period: 'morning' }], isDefault: true, weekdays: [0, 6], createdAt: t, updatedAt: t }],
    planned: [{ id: 'p1', date: addDays(TODAY, 3), text: 'Đi khám răng', period: 'morning', createdAt: t }],
    reminders: [
      { id: 'r1', text: 'Gia hạn bảo hiểm xe máy trước cuối tháng này nhé', autoToday: true, doneAt: null, createdAt: t, updatedAt: t },
      { id: 'r2', text: 'Mua quà sinh nhật', autoToday: false, doneAt: null, createdAt: t + 1, updatedAt: t },
      { id: 'r3', text: 'Dọn tủ quần áo', autoToday: false, doneAt: t, createdAt: t + 2, updatedAt: t },
    ],
    habits, habitChecks, calendarBg: null, unlockedSpecials: ['sunflower|glow'],
  });
}

/** Chuyển tab qua menu nổi: mở menu nếu đang thu gọn rồi bấm tab. */
async function goTab(page: Page, name: 'Lịch' | 'Hôm nay' | 'Khu vườn' | 'Cài đặt') {
  const open = page.getByRole('button', { name: 'Mở menu' });
  await expect(open.or(page.getByRole('button', { name: 'Đóng menu' }))).toBeVisible();
  if (await open.isVisible()) await open.click();
  await page.getByRole('button', { name, exact: true }).click();
}

async function closeMenu(page: Page) {
  const close = page.getByRole('button', { name: 'Đóng menu' });
  if (await close.isVisible()) await close.click();
  await expect(page.locator('#fnav-tabs')).toHaveCount(0);
}

/** Mở app ở NOW, giả safe-area theo project, nạp dữ liệu mẫu qua Khôi phục → Gộp. */
async function setup(page: Page) {
  const inset = (test.info().project.metadata?.safeArea ?? { top: 0, bottom: 0 }) as { top: number; bottom: number };
  await page.addInitScript(({ top, bottom }) => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = `:root { --safe-area-inset-top: ${top}px; --safe-area-inset-bottom: ${bottom}px; }`;
      document.head.append(s);
    });
  }, inset);
  await page.clock.setFixedTime(NOW);
  await page.goto('/');
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  await page.getByTestId('restore-input').setInputFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(backup()) });
  await page.getByRole('button', { name: 'Gộp với dữ liệu hiện tại' }).click();
  await expect(page.getByText(/Đã khôi phục/)).toBeVisible();
  return inset;
}

/** Bất biến chung: trang không cuộn ngang, mọi nút/ô nằm trong khung ngang, chữ nowrap không tràn hộp, nút tròn vẫn tròn. */
async function expectFits(page: Page, label: string) {
  const problems = await page.evaluate(() => {
    const out: string[] = [];
    const W = document.documentElement.clientWidth;
    const name = (el: Element) => el.getAttribute('aria-label') || el.getAttribute('data-testid') || (el.textContent ?? '').trim().slice(0, 30) || el.className.toString();
    if (document.documentElement.scrollWidth > W) out.push(`trang cuộn ngang ${document.documentElement.scrollWidth} > ${W}`);
    for (const sc of document.querySelectorAll('.app__main, .today__list, .sheet__body, .sheet')) {
      if (sc.scrollWidth > sc.clientWidth + 1) out.push(`${sc.className} cuộn ngang ${sc.scrollWidth} > ${sc.clientWidth}`);
    }
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[hidden]');
    };
    /** nằm trong khung cuộn ngang (vd. dải chip thói quen) mà khung đó vừa màn thì không tính */
    const inFittingScroller = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if ((ox !== 'auto' && ox !== 'scroll') || p.scrollWidth <= p.clientWidth + 1) continue;
        const r = p.getBoundingClientRect();
        return r.left >= -0.5 && r.right <= W + 0.5;
      }
      return false;
    };
    for (const el of document.querySelectorAll('button, input, textarea, [role="switch"], [role="tab"]')) {
      if (!visible(el) || inFittingScroller(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.left < -0.5 || r.right > W + 0.5) out.push(`"${name(el)}" tràn ngang (${Math.round(r.left)}..${Math.round(r.right)} / ${W})`);
    }
    for (const el of document.querySelectorAll('*')) {
      if (!visible(el) || getComputedStyle(el).whiteSpace !== 'nowrap' || !(el.textContent ?? '').trim()) continue;
      if (getComputedStyle(el).overflow !== 'visible') continue; // ellipsis / ẩn có chủ đích
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) out.push(`chữ "${name(el)}" tràn hộp ${el.scrollWidth} > ${el.clientWidth}`);
    }
    for (const el of document.querySelectorAll('.icon-btn, .fnav__toggle, .todo__section-add, .habit-card__btn, .today__speech-toggle')) {
      if (!visible(el)) continue;
      const r = el.getBoundingClientRect();
      if (Math.abs(r.width - r.height) > 1) out.push(`"${name(el)}" không tròn ${Math.round(r.width)}×${Math.round(r.height)}`);
    }
    return out;
  });
  expect(problems, label).toEqual([]);
}

async function shot(page: Page, screen: string) {
  await page.screenshot({ path: `test-results/layout/${test.info().project.name}/${screen}.png` });
}

const box = async (page: Page, sel: Parameters<Page['locator']>[0] | ReturnType<Page['locator']>) =>
  (await (typeof sel === 'string' ? page.locator(sel) : sel).boundingBox())!;

test('Lịch: thẻ tháng nằm trọn trên nút menu, nút đổi nền không chồng nút menu', async ({ page }) => {
  await setup(page);
  await goTab(page, 'Lịch');
  await closeMenu(page);
  const vp = page.viewportSize()!;
  const head = await box(page, page.getByTestId('calendar-head'));
  const card = await box(page, page.getByTestId('calendar-card'));
  const menu = await box(page, page.getByRole('button', { name: 'Mở menu' }));
  expect(head.y, 'đầu lịch lấn lên trên (không cuộn tới được)').toBeGreaterThanOrEqual(0);
  if (vp.height >= 600) {
    // máy đứng: cả tháng nằm trọn một màn; máy nằm ngang thì chỉ cần cuộn được
    expect(card.y + card.height, 'thẻ lịch không bị nút menu che').toBeLessThanOrEqual(menu.y + 1);
  }
  const bgBtn = page.getByRole('button', { name: /^Đổi hình nền lịch/ });
  if (await bgBtn.isVisible()) {
    const b = await box(page, bgBtn);
    const overlap = b.x < menu.x + menu.width && menu.x < b.x + b.width && b.y < menu.y + menu.height && menu.y < b.y + b.height;
    expect(overlap, 'nút đổi nền chồng nút menu').toBe(false);
  }
  await expectFits(page, 'Lịch');
  await shot(page, 'calendar');
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.locator('#fnav-tabs')).toBeVisible();
  await page.waitForTimeout(600); // chờ dải tab trượt ra hết
  await expectFits(page, 'Menu mở');
  const tabs = await box(page, '#fnav-tabs');
  expect(tabs.x, 'dải tab không tràn mép trái').toBeGreaterThanOrEqual(0);
  await shot(page, 'menu-open');
});

test('Hôm nay: hàng 4 nút hiện đủ, danh sách đủ cao, việc cuối không bị nút menu che', async ({ page }) => {
  const inset = await setup(page);
  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await expect(page.getByRole('switch', { name: `Thói quen: ${HABITS[0].name}` })).toBeVisible();
  await expect(page.getByTestId('speech-bubble')).toBeVisible();
  const vp = page.viewportSize()!;
  const list = await box(page, '.today__list');
  const tops: number[] = [];
  for (const name of ['Đổi cây & chậu', 'Ghi chú', 'Ngày tiết kiệm năng lượng', 'Nhắc việc']) {
    const b = await box(page, page.getByRole('button', { name, exact: true }));
    expect(b.y + b.height, `${name} bị danh sách che`).toBeLessThanOrEqual(list.y + 1);
    expect(b.y, `${name} lấn lên vùng tai thỏ`).toBeGreaterThanOrEqual(inset.top);
    tops.push(Math.round(b.y));
  }
  expect(new Set(tops).size, '4 nút cùng một hàng').toBe(1);
  const tap = await box(page, page.getByRole('button', { name: 'Chạm vào cây' }));
  expect(tap.y + tap.height, 'vùng chạm cây lấn hàng nút').toBeLessThanOrEqual(tops[0] + 1);
  const visibleList = Math.min(list.y + list.height, vp.height) - list.y;
  expect(visibleList, 'danh sách việc còn quá ít chỗ').toBeGreaterThanOrEqual(140);
  for (const name of ['Ẩn lời cây nói', 'Quay lại Lịch']) {
    const b = await box(page, page.getByRole('button', { name }));
    expect(b.y, `${name} nằm dưới vùng tai thỏ / Dynamic Island`).toBeGreaterThanOrEqual(inset.top);
  }
  await expectFits(page, 'Hôm nay');
  await shot(page, 'today');

  // cuộn tới cuối: việc cuối cùng không nằm dưới nút menu
  await page.locator('.today__list').evaluate((el) => (el.scrollTop = el.scrollHeight));
  const last = await box(page, page.getByRole('checkbox', { name: 'Hoàn thành: Đi ngủ sớm' }));
  const menu = await box(page, page.getByRole('button', { name: 'Mở menu' }));
  expect(last.y + last.height, 'việc cuối bị nút menu che').toBeLessThanOrEqual(menu.y + 1);
  await shot(page, 'today-scrolled');
});

test('Khu vườn: tab Cây và bảng tuần Thói quen vừa khổ màn', async ({ page }) => {
  await setup(page);
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  await page.getByRole('tab', { name: 'Cây' }).click();
  await page.getByRole('button', { name: 'Tất cả' }).click();
  await expect(page.getByTestId('garden-wilted')).toBeVisible();
  await expectFits(page, 'Khu vườn · Cây');
  await shot(page, 'garden-plants');
  await page.getByRole('button', { name: 'Tuỳ chọn hiển thị' }).click();
  await page.getByRole('switch', { name: 'Tách riêng cây đặc biệt' }).click();
  await expectFits(page, 'Khu vườn · Cây (tách đặc biệt)');

  await page.getByRole('tab', { name: 'Thói quen' }).click();
  const report = page.getByTestId('habit-report');
  await expect(report).toBeVisible();
  const r = await box(page, report);
  const rows = page.locator('.habit-week__row');
  for (let i = 0; i < (await rows.count()); i++) {
    const row = await box(page, rows.nth(i));
    expect(row.x + row.width, 'hàng bảng tuần tràn thẻ').toBeLessThanOrEqual(r.x + r.width + 0.5);
  }
  await expectFits(page, 'Khu vườn · Thói quen');
  await shot(page, 'garden-habits');
  for (const tab of ['Tháng', 'Năm']) {
    await page.getByRole('tab', { name: tab }).click();
    await expectFits(page, `Khu vườn · Thói quen · ${tab}`);
  }
  await shot(page, 'garden-habits-year');

  await page.getByRole('button', { name: 'Quản lý thói quen' }).click();
  await expect(page.getByTestId('habits-screen')).toBeVisible();
  await page.getByRole('button', { name: `Xoá: ${HABITS[0].name}` }).click();
  await expectFits(page, 'Quản lý thói quen (đang hỏi xoá)');
  await shot(page, 'habits-manage');
  await page.getByRole('button', { name: '＋ Thói quen mới' }).click();
  await expectFits(page, 'Form thói quen');
  await shot(page, 'habit-form');
});

test('Cài đặt, Mẫu, Nhắc việc vừa khổ màn; sang tab khác thì về đầu trang', async ({ page }) => {
  await setup(page);
  await goTab(page, 'Khu vườn');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Tất cả' }).click();
  await expect(page.getByTestId('garden-wilted')).toBeVisible();
  await page.locator('.app__main').evaluate((el) => (el.scrollTop = el.scrollHeight)); // cuộn cuối Khu vườn
  await goTab(page, 'Cài đặt');
  await closeMenu(page);
  expect(await page.locator('.app__main').evaluate((el) => el.scrollTop), 'sang tab mới phải về đầu trang').toBe(0);
  await expectFits(page, 'Cài đặt');
  await shot(page, 'settings');
  await page.getByRole('button', { name: 'Quản lý mẫu' }).click();
  await expect(page.getByRole('heading', { name: 'Mẫu việc cần làm' })).toBeVisible();
  await expectFits(page, 'Mẫu');
  await page.getByRole('button', { name: '＋ Mẫu mới' }).click();
  await expectFits(page, 'Form mẫu');
  await shot(page, 'template-form');

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Nhắc việc', exact: true }).click();
  await expect(page.getByTestId('reminders-hero')).toBeVisible();
  await expectFits(page, 'Nhắc việc');
  await shot(page, 'reminders');
});

test('Bảng: Đổi cây & chậu, chi tiết ngày, xoá dữ liệu: nút X dưới vùng tai thỏ, không tràn ngang', async ({ page }) => {
  const inset = await setup(page);
  const expectClose = async (label: string) => {
    const x = await box(page, page.getByRole('button', { name: 'Đóng', exact: true }));
    expect(x.y, `${label}: nút Đóng nằm dưới vùng tai thỏ`).toBeGreaterThanOrEqual(inset.top);
    expect(x.x + x.width, `${label}: nút Đóng trong màn`).toBeLessThanOrEqual(page.viewportSize()!.width);
  };

  await page.getByRole('button', { name: '🗑 Xoá toàn bộ dữ liệu' }).click();
  await expectClose('Xoá dữ liệu');
  await expectFits(page, 'Bảng xoá dữ liệu');
  await shot(page, 'sheet-reset');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();

  await goTab(page, 'Hôm nay');
  await closeMenu(page);
  await page.getByRole('button', { name: 'Đổi cây & chậu', exact: true }).click();
  await expectClose('Đổi cây & chậu');
  await expectFits(page, 'Bảng đổi cây');
  await shot(page, 'sheet-plant');
  await page.getByRole('button', { name: /^Dáng cây: Hướng dương/ }).click();
  await expectFits(page, 'Màn dáng cây');
  await page.getByRole('button', { name: 'Quay lại chọn cây' }).click();
  await page.getByRole('tab', { name: 'Chậu' }).click();
  await expectFits(page, 'Bảng đổi chậu');
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();

  await goTab(page, 'Lịch');
  await closeMenu(page);
  await page.getByTestId(`day-${addDays(TODAY, -5)}`).click();
  await expectClose('Chi tiết ngày');
  await expectFits(page, 'Bảng chi tiết ngày');
  await shot(page, 'sheet-day');
});

test('Tiếng Anh (chữ dài hơn): các tab và menu vẫn vừa khổ màn', async ({ page }) => {
  await setup(page);
  await page.getByRole('button', { name: /^Ngôn ngữ · Language/ }).click();
  await page.getByRole('option', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  const goTabEn = async (name: 'Calendar' | 'Today' | 'Garden' | 'Settings') => {
    const open = page.getByRole('button', { name: 'Open menu' });
    await expect(open.or(page.getByRole('button', { name: 'Close menu' }))).toBeVisible();
    if (await open.isVisible()) await open.click();
    await page.getByRole('button', { name, exact: true }).click();
  };
  await goTabEn('Calendar');
  await expect(page.locator('#fnav-tabs')).toBeVisible();
  await page.waitForTimeout(600);
  await expectFits(page, 'EN · menu mở');
  await shot(page, 'en-menu-open');
  await page.getByRole('button', { name: 'Close menu' }).click();
  for (const [tab, ready] of [['Today', 'plant-scene'], ['Garden', 'garden'], ['Settings', 'restore-input']] as const) {
    await goTabEn(tab);
    await page.getByRole('button', { name: 'Close menu' }).click();
    await expect(page.getByTestId(ready)).toBeAttached();
    await expectFits(page, `EN · ${tab}`);
    await shot(page, `en-${tab.toLowerCase()}`);
  }
  await goTabEn('Garden');
  await page.getByRole('button', { name: 'Close menu' }).click();
  await page.getByRole('tab', { name: 'Plants' }).click();
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await expect(page.getByTestId('garden-wilted')).toBeVisible();
  await expectFits(page, 'EN · Garden all');
  await page.getByRole('tab', { name: 'Habits' }).click();
  await expect(page.getByTestId('habit-report')).toBeVisible();
  await expectFits(page, 'EN · Habits');
  await shot(page, 'en-habits');
});
