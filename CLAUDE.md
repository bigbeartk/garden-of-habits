# Garden of Habits (trước đây: Chậu Cây Chibi)

PWA todo cho iPhone, có phần "nuôi cây": mỗi việc làm xong là một lần tưới cây, cây lớn qua 4 giai đoạn, có lịch dễ thương lưu lại cây của từng ngày.
- Chạy offline, không cần tài khoản, không lên App Store.
- Người dùng chính là vợ của chủ repo, dùng **iPhone 13** (390×844, Safari / PWA cài ra màn hình chính).
- Giao diện **song ngữ Việt / Anh** (`src/i18n/`, spec `docs/superpowers/specs/2026-10-06-bilingual-design.md`). Người dùng chính dùng tiếng Việt; tiếng Anh để chuẩn bị lên Google Play.
  - **Mọi chữ mới phải thêm vào `src/i18n/vi.ts` VÀ `en.ts`** (kiểu `Messages = typeof vi`: thiếu khoá → `tsc` báo). Component lấy chữ bằng `const { t, lang, tr } = useI18n()`; chuỗi có tham số là hàm (`t.todo.complete(text)`), số nhiều tiếng Anh viết trong hàm. Ngày/tháng/thứ qua `src/i18n/fmt.ts`.
  - Test `tests/unit/i18n/no-hardcoded-vi.test.ts` (dùng `@babel/parser`, vì TypeScript 7 không còn compiler API JS) **chặn chữ Việt có dấu viết cứng** trong `app/components/screens/domain/db/hooks/platform/utils`. Chữ Việt **không dấu** (vd. "Xem") nó không bắt được: tự để ý.
  - **Nội dung** (tên cây/chậu/dáng/hiệu ứng, lời cây) nằm ngay trong `src/content` dạng `Localized<T> = { vi, en }`; hiển thị bằng `tr(x.name)`.
  - Lỗi nghiệp vụ là `AppError(code, params)` (`src/domain/errors.ts`, `message` vẫn là câu Việt); giao diện hiện `errorText(e, t)`. `parseBackup` trả thêm `code`/`path`.
- Tên hiển thị là **Garden of Habits** (`<title>`, manifest `name`/`short_name`, `apple-mobile-web-app-title`). **Giữ nguyên** tên DB `chau-cay-chibi` và mã định dạng sao lưu `chau-cay-chibi-backup` để không mất dữ liệu cũ.

- Spec gốc: `docs/superpowers/specs/2026-10-02-chibi-plant-todo-design.md`; kế hoạch: `docs/superpowers/plans/2026-10-02-chibi-plant-todo.md`. Bản CLAUDE.md đầy đủ trước khi rút gọn: `docs/archive/CLAUDE-2026-10-11-full.md`.
- Deploy: push `main` lên https://github.com/bigbeartk/garden-of-habits, GitHub Actions chạy test, build rồi đăng lên https://bigbeartk.github.io/garden-of-habits/
- **App Android** (Capacitor) dùng chung mã nguồn: cùng lần push, job `android` build APK (artifact của run). Xem mục *Android* và `docs/android.md`.

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy thử trên máy |
| `npm test` | Unit test (Vitest + jsdom + fake-indexeddb) |
| `npx tsc --noEmit` | Kiểm tra kiểu |
| `npm run build` | Build PWA vào `dist/` (`BASE_PATH=/garden-of-habits/` khi deploy) |
| `npm run e2e` | E2E Playwright, giả lập **iPhone 13 bằng WebKit** (engine của Safari) |
| `PW_CHANNEL=chrome npm run e2e` | E2E bằng Chrome cài sẵn trên máy, dùng khi chưa tải được trình duyệt của Playwright |
| `npm run icons` | Tạo lại icon PWA từ `public/favicon.svg` |
| `npm run build:android` | Build web (base `/`) + `cap sync android` (không cần Android SDK) |
| `npm run icons:android` | Tạo lại icon + màn chờ Android từ `public/favicon.svg` |
| `npm run sketch:shot -- <trang> [ảnh.png] [rộng]` | Chụp WebKit một trang của **sổ phác thảo** (tự bật/tắt Vite), vd. `rose`, `"styles&p=rose,tulip"` |

- Chỉ commit và push khi mọi test đều pass. Nối lệnh bằng `&&`, không dùng `;`. Khi lọc output test qua `| grep`, bật `set -o pipefail` (nếu không, test fail vẫn đi tiếp tới commit/push).
- **Đừng pipe Playwright vào `| head`** trên Windows: `head` đóng ống sớm thì Playwright treo vô hạn (giữ cả server preview cổng 4173). Ghi ra file (`> pw.log 2>&1`) rồi grep file; nếu đã treo thì tắt các tiến trình node của lần chạy đó.
- **Đừng chạy E2E song song với một lượt khác** (vd. `/code-review` đang chạy test nền): hai lượt tranh server preview cổng 4173 và file tạm, làm test fail giả. Chờ lượt kia xong rồi chạy lại.
- E2E: sau khi đổi `page.clock.setFixedTime` rồi reload và thao tác một lúc, animation đóng menu nổi của WebKit có thể đứng ~5 giây (đồng hồ giả lệch timeline Web Animations, không phải lỗi app), làm `closeMenu` hết hạn. Khi đó đừng chờ dải tab thu lại: bấm thẳng nút cần bấm (chạm ra ngoài cũng tự thu menu).
- Thay đổi giao diện phải chạy E2E trên **WebKit**: Chrome không bắt được lỗi bố cục riêng của Safari.
- Làm theo TDD: viết test đỏ trước, rồi mới sửa code. Soát hình bằng ảnh chụp WebKit khổ iPhone 13.
- Test hay chập chờn khi chưa chờ ghi IndexedDB xong (reload ngay sau khi gõ) hoặc chờ một trong hai `useLiveQuery`: chờ trạng thái cuối cùng hiện ra trên giao diện.
- **Nút gạt/toggle đọc từ DB phải giữ state cục bộ (optimistic)**, nếu không bấm nhanh hai lần sẽ sai: dùng `useOptimisticToggle(stored, save, onError)` (`src/hooks/`), nó **bỏ qua giá trị DB báo về khi còn lần lưu chưa xong** (kết quả đọc cũ về muộn từng làm công tắc nhảy ngược, test chập chờn trên CI), lưu xong thì lại theo DB, lưu lỗi thì quay về giá trị DB. Đừng viết `useEffect(() => setOn(stored), [stored])` trần. Đang dùng ở `SettingSwitch`, công tắc ☀ của Nhắc việc và ô hôm nay của bảng thói quen tuần (chip thói quen ở Hôm nay giữ state cục bộ riêng trong `HabitStrip`).

## Máy hỗ trợ & bố cục nhiều cỡ màn

- **Thấp nhất: iOS 16.4, Android 7 (minSdk 24) với WebView ≥ 111.** `build.target` của Vite (`es2022`, `safari16.4`, `chrome111`) và `android.minWebViewVersion` (111, `capacitor.config.ts`) phải khớp nhau; WebView cũ hơn mở `public/webview-update.html` (`server.errorPath`). Trong mức này dùng được `dvh`, `translate:`/`scale:`, `:has()`, `Array.at`, `crypto.randomUUID`; dòng `vh`/`100%` trước `dvh` chỉ là dự phòng rẻ.
- **App Android bỏ qua cỡ chữ hệ thống** (`MainActivity`: `setTextZoom(100)`).
- **`tests/e2e/layout.spec.ts`** chạy trên ma trận cỡ máy (`playwright.config.ts`): iPhone 13, SE, 13 mini, 16 Pro, 16 Pro Max, iPhone nằm ngang (844×390) bằng WebKit; Android 360×640, 360×780, 412×915, máy gập 344×882 bằng Chromium (`npx playwright install webkit chromium`). Các spec khác chỉ chạy ở `iphone-13`. Chạy riêng: `npx playwright test tests/e2e/layout.spec.ts > pw.log 2>&1`.
  - Dữ liệu nạp một lần qua **Khôi phục → Gộp** (file sao lưu dựng trong test: 120 ngày, việc, lời cây dài, thói quen tên dài, việc nhắc).
  - **Safe-area giả** bằng `metadata.safeArea` của project → biến `--safe-area-inset-top/bottom` (CSS đọc biến trước `env()`), kiểm được tai thỏ / Dynamic Island / Android tràn viền mà không cần máy thật.
  - `expectFits`: không cuộn ngang, mọi nút/ô nằm trong khung ngang (trừ trong khung cuộn ngang như dải chip thói quen), chữ `nowrap` không tràn hộp, nút tròn vẫn tròn. Ảnh chụp ở `test-results/layout/<project>/`.
  - Có một lượt **tiếng Anh** (chữ dài hơn) đổi ngôn ngữ bằng `LanguagePicker`.
  - **Thêm màn / bảng mới thì thêm vào `layout.spec.ts`.**
- Bài học bố cục: căn giữa dọc bằng `margin: auto` (`.cal__head`/`.cal__footer`), **không dùng `justify-content: center`** (nội dung cao hơn màn thì phần đầu bị đẩy lên, không cuộn tới được); **chuyển tab thì `.app__main` về đầu trang** (các tab chung một khung cuộn); màn hẹp (≤ 374px / ≤ 359px) và màn thấp (≤ 500px) có CSS thu gọn riêng.

## Môi trường (Windows)

- Máy dev là Windows 10; công cụ Bash là Git Bash (POSIX). Đường dẫn Windows trong biến môi trường (`$APPDATA`…) bị hỏng trong Bash, nên dùng PowerShell khi cần.
- Không có `gh` CLI: xem trạng thái deploy tại https://github.com/bigbeartk/garden-of-habits/actions.
- **CI chạy Node 20, máy dev chạy Node 24.** Test pass trên máy vẫn có thể fail trên CI (đã từng làm tắc deploy 12 commit vì `new Response(new Blob(…))` của jsdom). Trước khi push, chạy thêm test giống CI (Node 20, giờ UTC): `TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run`. Máy CI chậm hơn nên test chưa chờ đủ mọi `useLiveQuery` sẽ lộ ra ở đó. Sau khi push, kiểm tra run mới nhất: `https://api.github.com/repos/bigbeartk/garden-of-habits/actions/runs?per_page=1` (lỗi xem ở `check-runs/<job id>/annotations`).
- Push dùng tài khoản `bigbeartk` (remote `origin`).
- Source Control của VS Code có thể còn đếm hàng nghìn file `node_modules` dù `git status` sạch: bấm Refresh hoặc **Developer: Reload Window**.

## Android (Capacitor)

- **Mọi tính năng chỉ viết một lần trong `src/`**, PWA và app Android cùng dùng. Không fork giao diện cho Android.
- Cái gì khác nhau giữa trình duyệt và app native thì **chỉ nằm trong `src/platform/index.ts`** (chỗ duy nhất gọi `isNative()` / plugin `@capacitor/*`, import động để PWA không phải tải): `shareFile` (Android: ghi cache bằng Filesystem rồi Share; huỷ → `AbortError`), `openExternal`, `onAppResume` (thêm sự kiện `resume`), `onHardwareBack`, `exitApp`, `setupNativeShell`. Màn hình chỉ được hỏi `isNative()` để ẩn/đổi chữ (vd. ẩn `Hướng dẫn cài app`, phiên bản ghi `· Android`, nhắc lưu "Google Drive" thay "iCloud").
- Native không đăng ký service worker, không gọi `storage.persist()` (`main.tsx`).
- **Nút Back của Android** (`src/app/back.ts`): màn/bảng đang mở đăng ký `useBackHandler(active, fn, layer)`, lớp `tab < screen < form < sheet`; Back gọi lớp cao nhất, hết thì thoát app. Đã đăng ký: `BottomSheet` (mọi bảng), menu nổi, `LanguagePicker` (`sheet`), ngày tương lai, màn Mẫu, form mẫu, màn Nhắc việc (+ dòng thêm/sửa việc nhắc), màn quản lý thói quen (`screen`), form thói quen (`form`), màn dáng cây, tab khác Lịch → Lịch. **Thêm màn con / bảng / chế độ sửa mới thì nhớ đăng ký**, nếu không Back nhảy qua nó.
- **Safe-area:** Android 15+ luôn tràn viền; SystemBars của Capacitor (`capacitor.config.ts`, `insetsHandling: 'css'`) bơm biến `--safe-area-inset-*`. Trong CSS **luôn viết `var(--safe-area-inset-x, env(safe-area-inset-x))`**, không viết `env()` trần (WebView cũ trả 0).
- `appId` `io.github.bigbeartk.gardenofhabits` không đổi được sau khi lên Play. Thư mục `android/` được commit (trừ file sinh ra); web build được `cap sync` chép vào lúc build, không commit.
- Job CI `android` chạy **Node 22** (Capacitor CLI 8 đòi Node ≥ 22); job PWA vẫn Node 20.
- APK phải luôn ký **cùng một khoá** (secrets `ANDROID_KEYSTORE_*`), nếu không cài đè không được → gỡ app = mất dữ liệu. Chưa có secret thì CI chỉ build APK debug.
- Dữ liệu PWA và app tách riêng; chuyển qua Sao lưu / Khôi phục (định dạng giống hệt).
- Chưa có E2E trên Android: soát tay trên máy thật theo checklist trong `docs/android.md` khi đổi `src/platform` hoặc bố cục.

## Kiến trúc

```
src/
  app/        App (tab + tự sang ngày mới), TabBar (menu nổi), nav (TABS + NavContext), deps (DepsContext), back (nút Back Android), habitIntent (Hôm nay → Khu vườn/Thói quen/màn quản lý), theme.css
  domain/     logic thuần TS, test độc lập: dayKey, dayService, growth, period, random, timeOfDay, id, errors, types,
              templateService, plannedService, reminderService, reminderView, habitService, habitReport, bugOdds,
              specialUnlocks, styleUnlocks, calendar, garden, menuIcon
  db/         Dexie (db.ts), settings, queries, backup (export/import/merge), share, reset
  content/    NỘI DUNG mở rộng được: plants/, pots/, specials/, common/, Face, ArtView, catalog, sayings, praises, taps, bugs, habits, support
  components/ PlantScene, SkyBackground, TodoList, InlineAdd, BottomSheet, DayCell, HabitStrip, HabitReport, HabitForm, BugCollection, WeekdayPicker, backgrounds/, ...
  screens/    CalendarScreen (màn mở đầu; mở FutureDayScreen cho ngày tương lai), TodayScreen (mở RemindersScreen), GardenScreen (tab Khu vườn; mở HabitsScreen), SettingsScreen (mở TemplatesScreen)
  hooks/      useNow, useToday, useBackupReminder, useOptimisticToggle, useCalendarBg (file này chứa cả useCalendarTheme, useMenuIconChoice, useMenuIcon)
  platform/   khác biệt PWA ⇄ Android (Capacitor): chia sẻ file, link ngoài, resume, nút Back
  i18n/       vi.ts (nguồn chuẩn) + en.ts, lang (Lang, detectLang, resolveLang, Localized, tr), fmt (ngày giờ), I18nProvider (useI18n), errors (errorText)
  dev/        ArtGallery.tsx — xem trước mọi cây/chậu/côn trùng (render tạm từ main.tsx khi cần)
              sketch/ — SỔ PHÁC THẢO (sketch.html, chỉ chạy ở dev, không vào build): kit (Cell/Row/StylesGrid), main (SHEETS + GROUPS, mục lục chia nhóm), playground (Phòng thử), faces (mặt), tomato + blueberry + daisy + strawberry (bản phác thảo của 4 loài khoá), pots (Giỏ đan), cherry, rose, sunflower, tulip, watermelon
```

- Màn hình không gọi thẳng `db` hay `Math.random`/`new Date()`. Chúng lấy `DayDeps = { db, catalog, rng, now }` qua `useDeps()`.
- Test dùng helper trong `tests/unit/helpers.tsx`: `makeDeps(start, catalog)` tạo DB riêng, RNG `mulberry32(42)` và đồng hồ chỉnh được qua `clock.current`; `renderWithDeps` render component với các deps đó.

## Quy tắc nghiệp vụ

### Ngày, việc, cây
- **Mốc sang ngày mới: 04:00 sáng** giờ địa phương (`DAY_START_HOUR`). Khoá ngày dạng `'YYYY-MM-DD'`, tính bằng `dayKey(now)`.
- **`ensureToday(deps)`** chạy khi mở app và mỗi khi `todayKey` đổi (`useNow` cập nhật mỗi 30 giây và khi `visibilitychange`/`focus`). Idempotent, chạy trong một transaction.
- **Một ngày mới được tạo** như sau:
  - random đều một loài cây; chậu là `defaultPotId` của loài đó; dáng: random đều trong Gốc + dáng đã mở (xem *Dáng cây*);
  - **10%** khả năng là cây đặc biệt (`SPECIAL_CHANCE`); khi trúng, hiệu ứng chọn theo `weight` và cặp được ghi vào `unlockedSpecials`;
  - todo lấy từ **mẫu mặc định**, rồi các **mẫu khác có chọn đúng thứ** của ngày (`Template.weekdays`, thứ theo khoá ngày nên 2h sáng thứ Bảy vẫn là thứ Sáu; theo thứ tự tạo; mẫu mặc định không bị thêm hai lần), rồi **việc đã lên lịch** cho ngày đó (bảng `planned`, xoá khỏi bảng sau khi chuyển), rồi **việc nhắc** `autoToday && doneAt === null`; mục tiêu đặt trước (`plannedGoals`) thành `title` rồi xoá. Việc chưa xong hôm qua ở lại ngày cũ, không chuyển sang.
- **Giai đoạn cây** theo tỉ lệ việc xong của **cả ngày** (`stageFor`): 0 việc xong hoặc chưa có việc → `seed`; ≥ 1 việc → `sprout`; ≥ 50% → `bud`; 100% → `bloom`.
- **Ngày đã qua bị khoá** (`LockedDayError` cho todo). Trên giao diện ngày đã qua **chỉ để xem**, kể cả ghi chú (domain `setNote` vẫn cho phép, nhưng UI không có ô sửa).
- **Chỉ hôm nay** mới được: thêm/sửa/xoá/tick/sắp xếp todo, đặt **mục tiêu ngày** (`setTitle`), đổi cây, đổi chậu, bật ngày tiết kiệm năng lượng.
- **Mục tiêu ngày** (trường `title`, giao diện gọi "Mục tiêu"): ô `GoalInput` đầu danh sách, lưu khi rời ô hoặc Enter, tối đa 60 ký tự. Ngày tương lai có mục tiêu đặt trước (bảng `plannedGoals`, `setPlannedGoal`/`getPlannedGoal`). Ngày đã qua chỉ xem mục tiêu trong bảng chi tiết.
- **Buổi Sáng / Chiều / Tối** (`domain/period.ts`): mỗi todo và mỗi việc trong mẫu có `period`. Hôm nay luôn hiện đủ 3 mục, mỗi mục có số xong/tổng riêng; mục của buổi hiện tại (`periodOf`: 4–11h sáng, 11–18h chiều, còn lại tối) được nhấn. **Kéo thả** (nắm `⋮⋮`) chuyển việc sang buổi khác (kể cả buổi trống) hoặc sắp xếp trong buổi: `TodoList` tự viết bằng pointer events (**không dùng `Reorder` của motion vì nó không kéo qua danh sách khác**), kéo gần mép thì tự cuộn; lưu bằng `moveTodo(deps, date, id, period, index)`. Test E2E kéo phải đóng menu nổi trước.
- **Thêm việc** (`components/InlineAdd.tsx`, Hôm nay và ngày tương lai): mỗi buổi có nút ＋ (`Thêm việc buổi …`) mở **dòng việc trống** (`DraftRow`) đã focus ở cuối buổi. Enter: lưu rồi để trống gõ tiếp; rời ô hoặc bấm ＋ buổi khác: lưu nếu đã gõ rồi đóng; Escape: đóng không lưu. **Việc rỗng không bao giờ được lưu** (cây sẽ tính sai). Bẫy Safari đã xử lý: nút ＋ chặn `mousedown` để không cướp focus (nếu không dòng cũ đóng, danh sách dịch và cú chạm trượt), mở dòng bằng `flushSync` để bàn phím iOS bật, và `onDone` chỉ đóng nếu dòng đang mở vẫn là của buổi đó. Nút ＋ 26px cao bằng icon buổi, vùng chạm nới bằng `::after`.
- **Xoá việc phải xác nhận** (`DeleteWithConfirm`, Hôm nay và ngày tương lai): `Xoá: <việc>` → `Xác nhận xoá: <việc>` / `Thôi`; chỉ nút Xoá mới xoá thật.
- **Ghi chú tự lưu** (`NoteSheet`): không có nút Lưu; lưu sau khi ngừng gõ 400ms, khi rời ô và khi đóng bảng. Bảng chỉ nạp nội dung từ DB lúc vừa mở, nên lúc đang gõ DB cập nhật không ghi đè chữ. Ghi chú chỉ để lưu thông tin (setting cũ `plantSaysNote` đã bỏ; file sao lưu cũ có nó vẫn khôi phục được).
- **Ngày tiết kiệm năng lượng** (`isRestDay`): todo bị ẩn nhưng vẫn giữ (nên không thêm việc được), cây hiện hạt giống ôm gối ngủ.
- **Chào hỏi:** lần đầu trong ngày (`greetedAt === null`), App tự chuyển sang tab Hôm nay rồi ghi `greetedAt`; câu chào chính là lời của ngày. Cây đặc biệt thì hiện thêm khung ✨ giới thiệu ~5 giây (chỉ ngày tung trúng).
- **Nền theo giờ** (`timeOfDay`): sáng 4–11h, trưa 11–14h, chiều 14–18h, tối 18–4h.
- **Nhắc sao lưu:** khi đã quá 7 ngày kể từ lần sao lưu cuối, hoặc kể từ dữ liệu cũ nhất nếu chưa sao lưu lần nào.

### Cây nói, chạm, khen
- **Lời cây nói của ngày** (`DayRecord.speech`, `content/sayings.ts`, `data-kind="daily"`, tối đa 3 dòng): lần đầu mở Hôm nay mà ngày chưa có `speech`, `TodayScreen` chọn bằng `pickSaying` (`COMMON_SAYINGS` + `species.sayings`) rồi lưu qua `setDaySpeech` (chỉ hôm nay, cắt khoảng trắng, tối đa `SPEECH_MAX` = 100). Đã có `speech` (kể cả `''`) thì không chọn lại; rỗng thì bong bóng mờ mời viết (`data-empty`). Chạm bong bóng (`Sửa lời cây nói`) thì thành ô `Lời cây nói` tại chỗ: Enter/rời ô lưu, Shift+Enter xuống dòng, Escape huỷ; đang sửa thì câu tạm không chen vào. Nút ẩn/hiện (`Ẩn lời cây nói` / `Hiện lời cây nói`, setting `showPlantSpeech`, mặc định bật, có trong sao lưu; state cục bộ, **chưa đọc xong setting thì chưa hiện bong bóng** để khỏi nháy). Đang ẩn thì câu khen/chạm vẫn hiện tạm. Ngày nghỉ: không có lời của ngày, không có nút ẩn/hiện. Đổi ngôn ngữ không dịch lời đã lưu.
- **Chạm vào cây:** nút trong suốt `Chạm vào cây` (`.today__plant-tap`, phủ đúng khung cây, không lấn hàng nút). Cây cười (`data-mood="smile"`), nảy và nói ~3,5 giây (`data-kind="tap"`): `pickTap` từ `COMMON_TAPS` + `species.taps`, không lặp câu vừa nói. Ngày nghỉ: cây vẫn ngủ, nói `SLEEPY_TAPS`.
- **Cây khen:** xong một việc thì cây cười và khen ~3,5 giây (`pickPraise`: `COMMON_PRAISES` + `species.praises`); xong việc cuối (vừa ra hoa) dùng `BLOOM_PRAISES`. Câu khen/chạm hiện tạm trong cùng bong bóng rồi quay về lời của ngày.
- **Câu tạm (khen/chạm) và khung ✨ giới thiệu có `pointer-events: none`**: câu dài phủ xuống thân cây từng nuốt mất cú chạm; riêng bong bóng lời của ngày bắt chạm (để sửa), nó chỉ 3 dòng và ẩn được.

### Đổi cây & chậu, cây đặc biệt, dáng
- **Bảng `Đổi cây & chậu`** (`components/PlantPotSheet.tsx`, nút đầu hàng nút dưới chậu): 2 tab **Cây → Chậu** (`PlantPicker` / `PotPicker`). Mỗi lần mở về tab Cây; **ngày tiết kiệm năng lượng** mở thẳng tab Chậu, tab Cây bị khoá. Màn dáng ẩn hàng tab. Chọn xong thì **đóng bảng**. Bảng đọc sẵn `listUnlockedStyles` cả lúc đóng (không nháy "1/3").
- **Đổi cây:** nếu đang dùng chậu mặc định của cây cũ thì chậu đổi theo cây mới; nếu người dùng đã tự chọn chậu khác thì giữ. Chọn loài thường thì thành **cây thường** (`specialId = null`) và dáng Gốc.
- **Cây đặc biệt đã mở khoá** (`domain/specialUnlocks.ts`): mở theo **đúng cặp** `'plantId|specialId'` (Ngô · Phát sáng), không theo hiệu ứng. `listUnlockedSpecials` = setting `unlockedSpecials` ∪ các cặp có trong lịch sử ngày, bỏ cặp có loài/hiệu ứng đã xoá, xếp theo thứ tự nội dung. Tab Cây có mục `picker-specials`. `changePlant(deps, date, plantId, specialId, styleId = 'base')` từ chối cặp chưa mở khoá và dáng khoá/không có. Ngày tự chọn cây đặc biệt vẫn tính là ngày cây đặc biệt (✨ lịch, Khu vườn).
- **Dáng cây mở khoá** (`domain/styleUnlocks.ts`, spec `docs/superpowers/specs/2026-10-05-plant-styles-design.md`): mỗi loài có `base` (Gốc) + 2 dáng (`PlantSpecies.styles`), mở khi loài **ra hoa đủ 10 rồi 20 ngày** (`bloomCounts`: `finalStage === 'bloom'` và **không** phải ngày nghỉ; tính cả ngày đặc biệt và mọi dáng).
  - Đã mở thì giữ: `listUnlockedStyles` = setting `unlockedStyles` ∪ suy từ số ngày ra hoa **của các ngày đã qua** (đã khoá nên không tụt; hôm nay không tính vì bỏ tick làm nó tụt).
  - Hôm nay chỉ góp khi **vừa chuyển sang ra hoa** (`mutateDay`, sau transaction): `unlockStylesFor` ghi `'plantId|styleId'` với số = ngày đã qua + 1 (không đọc lại hôm nay, nên bỏ tick ngay sau vẫn giữ); đổi loài trên ngày đã ra hoa không tính; **mỗi ngày chỉ góp một lần** (setting `styleBloomCredit` = ngày đã góp), nên bỏ tick → đổi loài → tick lại không mở thêm cho loài thứ hai. Thanh tiến độ (`styleProgress`) đếm cùng luật.
  - `ensureToday` đọc danh sách **trước** transaction rồi random đều trong Gốc + dáng đã mở, **chỉ gọi RNG khi có ≥ 2 lựa chọn** (giữ chuỗi random cũ).
  - **Bài học Dexie:** gọi hàm async lồng nhau (đọc setting, `days.each`) **bên trong** transaction rw gây `PrematureCommitError` khi `App` và `useToday` cùng gọi `ensureToday` — đọc trước / ghi sau transaction.
  - `DayRecord.styleId` (không có = Gốc); `PlantScene` nhận `styleId`, vẽ qua `getStageArt` (`content/plants/styles.ts`; `seed`/`sprout` và dáng lạ → Gốc). Lịch/chi tiết ngày/Hôm nay vẽ đúng dáng của ngày; Khu vườn luôn vẽ Gốc.
  - Giao diện: ô loài có nút `Dáng cây: <loài> (n/3)` mở **màn dáng** (`Dáng của <loài>`, `Quay lại chọn cây`, Back Android về lưới) với tiến độ `Tiến độ mở dáng` và ô `style-<id>`. **Dáng khoá không render hình cây nào của dáng đó** (chỉ `LockedStyleArt`, `Dáng bí ẩn`). Chọn loài ở lưới = Gốc; chọn cặp đặc biệt giữ dáng hôm nay nếu cùng loài. Loài chưa có `styles` thì ẩn nút dáng.
  - Mừng (`style-unlock`, ~5 giây) **chỉ khi khoá vừa được ghi vào `unlockedStyles`** lúc màn đang mở; mở nhờ lịch sử cũ (kể cả lúc sang ngày mới) thì không mừng.

### Cây mới mở khoá (4 loài khoá)
Spec `docs/superpowers/specs/2026-10-11-locked-plants-design.md`; `domain/plantUnlocks.ts`, `components/NewPlants.tsx`.
- `tomato`, `blueberry`, `daisy`, `strawberry` có `locked: true` (nội dung → `CATALOG.plants[i].locked`). Ban đầu khoá: **không bốc cho ngày mới** (kể cả lượt cây đặc biệt), `changePlant` từ chối (`AppError('plantLocked')`), Khu vườn không có luống, lưới chính của bảng Đổi cây không có.
- **Ngày đạt** (`goodDayCount`): không phải ngày nghỉ, và cây ra hoa (`finalStage === 'bloom'`) **hoặc** "Ngày trọn vẹn" thói quen (`perfectHabitDays`); đạt cả hai tính 1; tính cả lịch sử và hôm nay; ngày không có bản ghi `days` mà làm đủ thói quen vẫn tính.
- Cứ **90 ngày đạt** (`PLANT_UNLOCK_EVERY`) được một lượt, tối đa 4 (`earnedSlots`); người dùng **tự chọn** loài để mở (`unlockPlant`). Đã mở lưu ở setting `unlockedPlants` và **giữ mãi** (bỏ tick làm tụt số ngày thì cây đã mở vẫn mở; `freeSlots` không âm, `nextAt` tính từ max(lượt, số đã mở)).
- `ensureToday` đọc `availablePlants` **trước** transaction; chưa mở loài khoá nào thì danh sách = 9 loài cũ nên **chuỗi random cũ không đổi**.
- **Bài học liveQuery:** trong hàm dùng cho `useLiveQuery`, đừng `await` một hàm async tự viết (bọc `getSetting`) rồi mới đọc bảng khác: liveQuery mất dấu bảng đọc sau (tick không cập nhật). `plantUnlockState` đọc setting và đếm ngày song song (`Promise.all`); test `liveQuery: ...` trong `plantUnlocks.test.ts` giữ điều này.
- Giao diện: tab Cây có mục `picker-new-plants` **Cây mới** (ô `new-plant-<id>`, `data-locked`; loài khoá vẽ mờ + ổ khoá SVG; thanh `plant-unlock-progress` `x/90 ngày đạt`; có lượt thì chạm ô khoá → `Mở khoá: <loài>` / `Thôi` → mừng `plant-unlocked`; chưa có lượt thì nhắc `Còn n ngày đạt nữa để mở`; loài đã mở như ô thường, có nút dáng). Hôm nay: nút Đổi cây có chấm khi `freeSlots > 0`; khung `plant-unlock-ready` (~5 giây) khi số lượt đã kiếm **tăng lúc màn đang mở** (đủ mốc nhờ lịch sử thì chỉ có chấm); trùng lúc mừng dáng mới thì **xếp hàng sau** khung dáng.
- E2E `tests/e2e/unlock.spec.ts` (vi + en, ghi thẳng IndexedDB); `layout.spec.ts` kiểm mục Cây mới.

### Lịch, ngày tương lai, Khu vườn
- **Lịch:** mỗi ô ngày mang một trạng thái (`dayCellStatus`):

  | Trạng thái | Khi nào |
  |---|---|
  | `plant` | ngày có bản ghi bình thường |
  | `rest` | ngày tiết kiệm năng lượng |
  | `missed` | không có bản ghi, nằm sau ngày dùng app đầu tiên → **cây héo** |
  | `before-start` | trước ngày dùng app đầu tiên → ô trống |
  | `today-pending` | hôm nay nhưng chưa có bản ghi |
  | `future` | ngày tương lai |

  Đi tới được tối đa **12 tháng sau** tháng hiện tại (`MAX_MONTHS_AHEAD`). **Chạm ô lịch:** ngày đã qua → `DayDetailSheet` (bảng `tall`) chỉ xem; **hôm nay → chuyển thẳng sang tab Hôm nay**; **ngày tương lai → `FutureDayScreen`** thay chỗ lưới lịch. Ô có việc đã lên lịch hiện `planned-count`; ô có ghi chú hiện `note-dot` (setting `showNoteDot`).
- **Ngày tương lai** (`FutureDayScreen`, `future-day`): bố cục giống Hôm nay, chậu có hạt giống bí ẩn đang ngủ; danh sách 3 buổi (`PlannedList`: sửa bằng chạm chữ, xoá; **không có ô tick**); ＋ mỗi buổi thêm dòng trống như Hôm nay, lưu thành việc đã lên lịch. Không có các nút đổi cây/chậu/ghi chú/ngày nghỉ. `plannedService`: `addPlanned` chỉ nhận ngày **sau hôm nay**, `editPlanned`, `deletePlanned`. Việc tương lai **chỉ thêm được từ Lịch**.
- **Khu vườn** (tab menu nổi, `GardenScreen`, `data-testid="garden"`): công tắc `Cây | Thói quen` (setting `gardenView`, nhớ lại; **chưa đọc xong setting thì chỉ vẽ tiêu đề + công tắc**, khỏi nháy màn Cây).
  - **Tab Cây (báo cáo):** chọn `Từ ngày` / `Đến ngày` (mặc định đầu tháng → hôm nay; ngược thì tự đổi chỗ) hoặc `Tháng này` / `30 ngày` / `Tất cả`. Mỗi loài một luống (`garden-plant-<id>`, `.garden__count`), vẽ dạng ra hoa trong chậu mặc định; loài 0 ngày mờ (`is-empty`). **Thứ tự luống** (`report.beds`): mọi luống > 0 ngày trên mọi luống 0 ngày; trong mỗi nhóm: loài thường (nhiều ngày trước) → cây đặc biệt → Cây héo → Ngày nghỉ. Luống riêng `garden-wilted` **Cây héo** (cùng định nghĩa `missed` của ô lịch, từ ngày dùng app đầu tiên tới hôm qua) và `garden-rest` **Ngày nghỉ**. Hai công tắc lọc thu gọn sau nút `Tuỳ chọn hiển thị` (mỗi lần mở màn đều thu gọn; đang lọc thì nút có chấm): `Chỉ hiện cây đã trồng` (`gardenOnlyPlanted`, ẩn mọi luống 0 ngày kể cả 2 luống riêng) và `Tách riêng cây đặc biệt` (`gardenSeparateSpecial`, luống `garden-special-<plant>-<special>`). Tóm tắt `garden-summary` **luôn một dòng** (`nowrap`; E2E đo chữ không tràn). Logic ở `domain/garden.ts` (`gardenReport(records, ids, from, to, { todayKey, firstKey, separateSpecial })`): ngày nghỉ **không** tính cho loài cây (đếm riêng `restDays`); loài đã xoá khỏi nội dung không có luống.
  - **Tab Thói quen:** xem *Thói quen*.

### Mẫu việc
- **Màn Mẫu nằm trong Cài đặt** (thẻ "Mẫu việc" → `Quản lý mẫu` → `TemplatesScreen` thay chỗ trang Cài đặt, `onBack`). Thẻ mẫu: đặt mặc định (ngôi sao), [Thêm vào hôm nay][Sửa][Xoá]; form có 3 khối buổi + hàng `Tự thêm vào các thứ` (`WeekdayPicker`, 7 nút `aria-pressed`). Mẫu theo thứ chỉ áp dụng khi **tạo ngày mới**, không tự thêm vào hôm nay đã có.

### Nhắc việc
Spec `docs/superpowers/specs/2026-10-05-reminders-design.md`; `domain/reminderService.ts`, `reminderView.ts`, `screens/RemindersScreen.tsx`.
- Danh sách việc dài hạn, **không có hạn chót**, xếp theo thứ tự thêm. Mở từ nút chuông `Nhắc việc` ở hàng nút dưới chậu màn Hôm nay (bấm được cả ngày nghỉ): `TodayScreen` hiện `RemindersScreen` thay chỗ (`Quay lại Hôm nay`; Back Android lớp `screen`). Màn con nằm trong tab Hôm nay nên bấm lại tab Hôm nay không thoát nó; E2E về bằng nút `Quay lại Hôm nay`.
- Mỗi việc: tick `Hoàn thành nhắc: <việc>`, chữ chạm để sửa, công tắc ☀ `Thêm vào hôm nay: <việc>` (`role="switch"`, state cục bộ), × xoá có xác nhận. Mục `Đã hoàn thành tuần này` (từ 4:00 thứ Hai, `doneThisWeek`), bỏ tick bằng `Bỏ hoàn thành nhắc: <việc>`.
- **Bật Hôm nay:** thêm ngay vào **cuối buổi Sáng** hôm nay (nếu chưa xong và hôm nay chưa có todo cùng `reminderId`; hôm nay chưa có bản ghi thì chỉ đặt cờ). `ensureToday` thêm lại mọi việc `autoToday && doneAt === null` mỗi ngày mới (sau mẫu và việc đã lên lịch), nên chưa xong thì mai lại có; ngày cũ đã khoá giữ nguyên. **Tắt:** gỡ todo chưa xong khỏi hôm nay.
- **Đồng bộ hai chiều** qua `Todo.reminderId`: tick/bỏ tick ở Hôm nay ↔ `doneAt` của việc nhắc; tick ở Nhắc việc mà việc đang ở hôm nay thì tick luôn todo (cây lớn); sửa chữ một bên thì bên kia (chỉ hôm nay) đổi theo; **xoá ở Hôm nay tự tắt Hôm nay**; xoá việc nhắc gỡ todo chưa xong ở hôm nay (todo đã xong giữ lại). Todo có `reminderId` hiện icon `bell` trước chữ.
- Đồng bộ chạy trong `mutateDay(deps, date, kind, fn, sync)`: `sync` chạy trong cùng transaction `[days, reminders]` sau khi lưu ngày; **chỉ được đụng 2 bảng đó**.

### Thói quen
Spec `docs/superpowers/specs/2026-10-08-habits-design.md`; `domain/habitService.ts`, `habitReport.ts`, `components/HabitStrip.tsx`, `HabitReport.tsx`, `HabitForm.tsx`, `screens/HabitsScreen.tsx`.
- Việc lặp lại theo thứ, **điểm danh riêng, không phải todo** (không làm cây lớn theo tỉ lệ việc). Mỗi thói quen có tên, icon, màu, `weekdays` (`WeekdayPicker` dùng chung với form Mẫu).
- **Chỉ tick được hôm nay** (mốc 4:00); ngày tiết kiệm năng lượng không tính (không hiện chip, không vào mẫu số). Đổi lịch tính lại cả quá khứ theo lịch mới, nhưng lần tick cũ vẫn là `done`. Ô tính từ `startDate` (ngày tạo), trước đó bỏ qua.
- **Dừng / Tiếp tục** (`stopHabit` / `resumeHabit`), không phải xoá. `Habit.pauses` = các khoảng `{ from, to }` (`from` tính, `to` = ngày tiếp tục, không tính; `to: null` = đang dừng; `stoppedSince`). Ngày trong khoảng dừng không có lịch (`isScheduled`) → ô `off`, không tính bỏ lỡ; tick cũ giữ. Dừng/tiếp tục tính từ hôm nay; dừng rồi tiếp tục trong ngày không để lại khoảng; dừng lại đúng ngày vừa tiếp tục thì nối khoảng cũ. Báo cáo bỏ thói quen đã dừng hẳn từ trước kỳ (`stoppedSince <= from`). Màn quản lý có nút `Sửa: <tên>`, `Dừng: <tên>`, `Xoá: <tên>` (`ConfirmButton` nhận `icon`), mục `habits-stopped` với `Tiếp tục: <tên>`. `HabitForm` chặn nộp hai lần khi đang lưu.
- **Hôm nay:** dải chip `habit-strip` dưới Mục tiêu; mỗi chip `role="switch"` `Thói quen: <tên>` (optimistic; đổi ngày thì reset theo ngày mới); tick thì cây cười. Công tắc `Hiện thói quen ở màn Hôm nay` (setting `showHabitStrip`, mặc định bật, có trong sao lưu) nằm ở cuối `HabitsScreen`; tắt thì ẩn cả chip `Thêm thói quen`; chưa đọc xong setting thì chưa hiện. Chưa có thói quen nào (hoặc mọi thói quen đã dừng) thì chỉ hiện chip `Thêm thói quen`.
- **Mở màn quản lý từ nơi khác** (`app/habitIntent.ts`): chip ＋ gọi `requestHabitManager('add' | 'list', 'today')` (chưa có thói quen → `'add'`, form đã mở; đã có → `'list'`) rồi sang Khu vườn → Thói quen → màn quản lý. `GardenScreen` `peek` cờ (và `peekHabitManagerOrigin()`) trong initializer của `useState` (`managing: false | 'list' | 'add'`; **StrictMode gọi initializer hai lần**) và `take` (xoá) trong effect lúc mount. Back (nút và Back Android, cùng `leaveManager`) về **nơi đã mở**: từ Hôm nay → `nav('today')`, nhãn `Quay lại Hôm nay` (`HabitsScreen backLabel`); từ Khu vườn → Khu vườn (`Quay lại Khu vườn`). Nút `＋ Thói quen đầu tiên` ở báo cáo trống cũng mở chế độ thêm (`startAdding`).
- **Báo cáo (Khu vườn → Thói quen):** `Tuần | Tháng | Năm` + `Kỳ trước` / `Kỳ sau`. **Tuần tính T2 → CN**: ô `habit-cell-<id>-<date>` (`data-state`); **ô hôm nay bấm được** (`TodayCell`, `<button role="switch">` `Điểm danh hôm nay: <tên>`, cùng `toggleHabit` với chip, `useOptimisticToggle`; chỉ khi có lịch hôm nay và không phải ngày nghỉ; viền liền, không nét đứt vì ô 24px bị đứt lệch ở góc); ô khác, Tháng (`habit-month-<id>`), Năm (`habit-year-<id>`) chỉ để xem. Hàng `Ngày trọn vẹn`: dưới mỗi ngày trọn vẹn là côn trùng của ngày (`habit-day-bug-<date>`, đọc qua `dayBugId`; tick đủ hôm nay trong bảng mà chưa có `bugId` thì `WeekTable` gọi `ensureDayBug`); 👑 cuối hàng chỉ khi kỳ đã kết thúc (`to` <= hôm nay), có ≥ 1 ngày có lịch và mọi ngày có lịch đều trọn vẹn. E2E kiểm 10 thói quen tên dài không làm bảng tuần tràn ở 390px.
- **4 số tổng** (`habit-stats`): `% Đạt` = ô `done` ÷ ô có lịch (`done` + `missed` + `pending`); `Ngày trọn vẹn` = ngày có ≥ 1 ô có lịch và mọi ô có lịch đều `done`; `Tổng lần làm` = số lần tick trong kỳ; `Chuỗi dài nhất` = số ngày trọn vẹn liên tiếp dài nhất (ngày không có ô có lịch thì bỏ qua, không đứt chuỗi).

### Côn trùng thưởng
`content/bugs.tsx`; spec `docs/superpowers/specs/2026-10-09-bug-streak-odds-design.md`.
- Ngày làm đủ thói quen (`perfectHabitDays(deps, from, to)` = "Ngày trọn vẹn": ≥ 1 thói quen có lịch và mọi thói quen có lịch đều tick; ngày nghỉ không tính) thì một côn trùng chibi lượn cạnh mặt cây.
- **10 loài** (`weight` trong ngoặc, chỉ dùng chia con **trong** nhóm và cho ngày cũ): `common` `ladybug` (5), `butterfly`, `bee`, `caterpillar`, `ant` (4); `rare` `firefly`, `beetle`, `cricket` (2); `epic` `dragonfly`, `luna-moth` (1). Thêm con mới: thêm vào `BUGS` + cập nhật `tests/unit/content/bugs.test.tsx`.
- **Con của ngày bốc thật một lần rồi lưu** ở `DayRecord.bugId`: `ensureDayBug(deps, date, BUGS)` (chỉ hôm nay; `TodayScreen` gọi khi hôm nay vừa làm đủ mà chưa có `bugId`) bốc bằng `deps.rng`; bỏ tick thì ẩn, tick lại hiện đúng con cũ.
- **Tỉ lệ tăng theo chuỗi** (`domain/bugOdds.ts`): gốc `BASE_ODDS` Hiếm 6/29 ≈ 20,7%, Rất hiếm **2%**; mỗi ngày làm đủ liên tiếp trước hôm nay +`STEP` 1% cho mỗi nhóm (`streakBonus`, đi lùi từ hôm qua): gặp nhóm nào thì bộ đếm nhóm đó dừng (hai bộ đếm riêng), **ngày bỏ lỡ (có thói quen có lịch mà không làm đủ) làm đứt cả hai**, ngày không có lịch / ngày nghỉ bỏ qua; `bugOdds` chặn tổng ≤ 100% (Rất hiếm ưu tiên); `rollBug`: số ngẫu nhiên thứ nhất chọn nhóm (`pickTier`), thứ hai chọn con trong nhóm theo `weight`. Bộ đếm suy từ lịch sử (`habitDayStatus` + `bugId` các ngày), không lưu riêng. **Không hiện tỉ lệ cho người dùng** (gợi ý `bug-streak-hint` chỉ là lời, không số).
- Đọc con của ngày **luôn qua `dayBugId(record, date, todayKey, BUGS)`**: có `bugId` thì lấy; ngày đã qua chưa có (dữ liệu cũ) thì theo cách bốc sẵn cũ `legacyBugFor` (băm khoá ngày) / `bugFor(date)`; hôm nay chưa bốc → không có. `bugId` có trong sao lưu (tuỳ chọn), không tăng `SCHEMA_VERSION`.
- Con hiếm / rất hiếm trông khác (`BugAura`). **Khung báo** `bug-visit` (~5 giây, chỉ khi vừa chuyển sang làm đủ lúc màn đang mở): `bugVisitKind(bug, metBefore)` = `new` nếu loài chưa ghé ngày nào trước hôm nay, không thì `rare` / `epic`; con thường không báo; khung nằm đúng chỗ bong bóng lời cây (bong bóng tạm ẩn) để không che cây.
- **Thẻ `Côn trùng đã gặp`** (`components/BugCollection.tsx`, `bug-collection`, dưới báo cáo thói quen; ẩn khi chưa có thói quen): `countBugs` trên mọi ngày làm đủ từ `startDate` sớm nhất tới hôm nay, đếm theo `dayBugId`; ô `bug-<id>` (`data-met`), chưa gặp vẫn ghi độ hiếm. Ngày làm đủ suy từ lịch sử nên xoá thói quen / đổi lịch thì số có thể đổi.
- `PlantScene` nhận `bugId` (chỉ vẽ khi `mode === 'plant'`, `habit-bug` `data-bug`) + `bugEntrance` (bay vào bằng motion, chỉ ở Hôm nay); vị trí `bugSpot(faceAnchor)`, phóng `BUG_SCALE` 1,4, kẹp trong khung; cánh vỗ bằng `<animateTransform>` (tắt khi giảm chuyển động). Hiện ở Hôm nay (bỏ tick thì bay đi), ô Lịch (`DayCell`/`MiniPlant` `bugId`) và bảng chi tiết ngày. Soát hình: `BugGallery` trong `src/dev/ArtGallery.tsx`.

### Cài đặt, xoá dữ liệu, ngôn ngữ
- Cài đặt: thẻ Lịch có bộ chọn `Hình nền` + `MenuIconPicker` và công tắc `showCalendarBgButton` / `showNoteDot` (mặc định bật, có trong sao lưu). Hướng dẫn cài app là nút ở hàng tiêu đề mở BottomSheet (các bước + trạng thái lưu bền vững; chưa lưu bền vững thì nút có chấm).
- **Xoá toàn bộ dữ liệu** (`db/reset.ts` `resetAllData`, `components/ResetDataSheet.tsx`): nút cuối thẻ Sao lưu mở bảng có số liệu sẽ mất (`dataSummary`), nút sao lưu, ô `Gõ XOA để xác nhận` (tiếng Anh `DELETE`, không phân biệt hoa thường); `Xoá vĩnh viễn` chỉ bật khi gõ đúng, đóng bảng thì ô làm trống. Xoá cả 8 bảng và mọi setting **trong một transaction**, chỉ giữ `language`; xong thì `ensureToday` tạo ngày mới (chưa chào) và chuyển sang tab Hôm nay.
- **Ngôn ngữ** (setting `language: 'vi' | 'en'`): `resolveLang(db, todayKey)` lúc mở app: có setting → dùng; chưa có mà có ngày **trước hôm nay** (người dùng từ trước khi có song ngữ) → `vi`; không thì theo máy (`navigator.languages`: `vi*` → vi, còn lại en). Kết quả **ghi luôn** vào setting ở lần đầu (nếu không, máy mới tiếng Anh sang hôm sau sẽ có "ngày cũ" và bị đổi sang Việt), nên đổi ngôn ngữ máy sau đó không tự đổi app. `I18nProvider` (bọc `App` trong `main.tsx`) render ngay bằng gợi ý `localStorage` `goh-lang` cho khỏi nháy. Đổi bằng `LanguagePicker` (dropdown **tự vẽ**, không dùng `<select>` gốc vì phần thả xuống do hệ điều hành vẽ; nút `aria-haspopup="listbox"` + `listbox` 2 `option`; chạm ra ngoài / Escape / Back Android đóng; phím lên/xuống/Enter): đổi ngay, ghi setting, cập nhật `<html lang>`. Không dịch dữ liệu người dùng gõ. Sao lưu có `language` (tuỳ chọn): `replace` chỉ ghi khi file có, `merge` chỉ lấy khi máy chưa có.
- **Ủng hộ tôi** (`SupportCard`, dữ liệu `content/support.ts`): ảnh VietQR `public/support/qr-tpbank.jpg` (đã kiểm tra quét được), nút `Lưu mã QR` (qua `shareOrDownload`, vì không quét được mã trên chính màn hình điện thoại), link PayPal. Workbox precache thêm `jpg` để mã QR xem được khi offline.
- **Phiên bản & cập nhật:** Cài đặt hiện `Phiên bản <sha7> · <giờ build>` (`__APP_VERSION__`/`__BUILD_TIME__` trong `vite.config.ts`, CI dùng `GITHUB_SHA`). `main.tsx` gọi `registration.update()` khi app hiện lại (`visibilitychange`) và mỗi 30 phút, để PWA trên iPhone nhận bản mới mà không cần đóng hẳn app.

## Format nội dung: cây, chậu, hiệu ứng

### Hệ toạ độ chung
Mọi hình vẽ dùng `viewBox="0 0 200 240"`, **mặt đất ở y = 160**, tâm ngang **x = 100**:
- Chậu: vành khoảng y 152–170, thân y 166–232.
- Thân cây bắt đầu từ `(100, 160)` mọc lên trên.

```ts
// src/content/types.ts
type Art = { svg: FC } | { image: string };     // SVG component (không bọc <svg>) HOẶC đường dẫn PNG
interface FaceAnchor { x: number; y: number; scale: number }
```

- `{ image }`: ảnh PNG vẽ trong khung 200×240 (tỉ lệ 5:6), mặt đất ở 2/3 chiều cao. Đặt file trong `public/` và dùng `import.meta.env.BASE_URL + 'plants/<id>/<stage>.png'`.
- **Mặt chibi dùng chung** (`content/Face.tsx`) có các `mood`: `normal | smile | talk | sleep | sad`. Mặt gắn lên cây theo `faceAnchor`, nên cây dùng PNG cũng có mặt.

### Loài cây: `PlantSpecies`
```ts
interface PlantSpecies {
  id: string;                                        // 'sunflower'
  name: Localized<string>;                           // { vi: 'Hướng dương', en: 'Sunflower' }
  defaultPotId: string;                              // phải có trong POTS
  stages: Record<'seed'|'sprout'|'bud'|'bloom', Art>;
  faceAnchor: Record<'seed'|'sprout'|'bud'|'bloom', FaceAnchor>;
  sayings?: Localized<string[]>;                     // lời của ngày riêng của loài (≤ 100 ký tự)
  praises?: Localized<string[]>;                     // câu khen riêng khi xong việc
  taps?: Localized<string[]>;                        // câu riêng khi bị chạm vào
  faceStyle?: FaceStyle;                             // 'cute' (mặc định) | 'cool': kính râm + nhếch mép, không má hồng; 'lady': mi cong + môi son (ngủ/buồn vẫn mặt thường)
                                                     // | 'doll' (cà chua) | 'sparkle' (việt quất) | 'happy' (cúc hoạ mi) | 'cheeky' (dâu tây): chốt từ sổ phác thảo `faces`
  locked?: true;                                     // loài mở khoá bằng ngày đạt (xem *Cây mới mở khoá*)
  styles?: PlantStyle[];                             // 2 dáng mở khoá (unlockAt 10, 20)
}
interface PlantStyle {                               // chỉ vẽ lại bud/bloom; seed/sprout dùng Gốc
  id: string; name: Localized<string>; unlockAt: number;
  stages: Record<'bud'|'bloom', Art>;
  faceAnchor: Record<'bud'|'bloom', FaceAnchor>;
  faceStyle?: FaceStyle;                             // không có = theo loài
}
```
**Thêm cây mới** gồm 3 bước:
1. Tạo `src/content/plants/<id>.tsx` export một `PlantSpecies`. Phần dùng chung trong `plants/parts.tsx` chỉ cho giai đoạn đầu và chi tiết nhỏ: `Seed`, `Sprout`, `LeafyStem`, `HeartLeaf`.

> **Quy tắc: mỗi loài mới phải KHÁC các loài đã có ở DÁNG (silhouette) ở giai đoạn `bud` và `bloom`**, không chỉ khác màu hay khác quả. Trước khi vẽ, đối chiếu cột *Dáng* trong bảng dưới và chọn một dáng chưa có (khối cầu, dù, cột, dây leo, bụi thấp, cây cao một bông, cụm hoa cầu…). Không tái dùng tán/thân của loài khác; nếu cần phần chung thì chỉ ở mức chi tiết (lá, hạt). Sau khi vẽ, soát bằng ảnh chụp WebKit màn **Khu vườn** (đủ mọi loài, dạng ra hoa) và lưới Lịch (dạng ra chồi): đặt cạnh nhau phải nhận ra ngay. Bài học: cam và cherry từng dùng chung tán mây tròn + thân nên trông như một, đã vẽ lại.

2. Thêm loài vào mảng `PLANTS` trong `src/content/plants/registry.ts`.
3. Chạy `npm test`. `tests/unit/content/plants.test.tsx` kiểm tra đủ 4 giai đoạn, chậu mặc định có tồn tại, mỗi loài có chậu mặc định khác nhau, và cố định danh sách loài theo thứ tự (thêm loài thì cập nhật test này, cùng `praises.test.ts`, `taps.test.ts`: ≥ 1 câu khen, ≥ 2 câu khi bị chạm; `sayings.test.ts`: ≥ 2 câu lời của ngày, **ở mỗi ngôn ngữ**). Tên và câu tiếng Anh viết lại theo giọng chibi + tính cách loài (xương rồng ngầu, hoa hồng quý cô), không dịch từng chữ.

Các loài hiện có (id cũ được giữ để không mất dữ liệu cũ, kể cả khi đã đổi loài):

| id | Tên | Chậu mặc định | Dáng (bud/bloom) |
|---|---|---|---|
| `sunflower` | Hướng dương | `terracotta` | thân cao, một bông tròn cánh vàng ở đỉnh |
| `corn` | Ngô | `rattan` | thân thẳng, lá dài cong rủ hai bên, bắp mũm mĩm mang mặt, chỏm râu |
| `cactus` | Xương rồng (**ngầu**, `faceStyle: 'cool'`) | `concrete` | saguaro: cột có sống dọc, tay gập góc vuông, hoa đỏ trên đỉnh |
| `pothos` | Monstera (id cũ của Trầu bà) | `mint` | bụi lá to xẻ thuỳ có lỗ trên cuống dài, xoè quạt |
| `orange` | Cây cam | `wood` | cây kẹo mút: thân mảnh + một khối cầu lá |
| `cherry` | Cherry | `polka` | cây dù rộng thấp, thân chẻ đôi, quả đôi treo cuống dài |
| `rose` | Hoa hồng (**quý cô**, `faceStyle: 'lady'`) | `rose-porcelain` | một bông hồng nhiều lớp đội vương miện, cành thắt nơ |
| `watermelon` | Dưa hấu | `tin-bucket` | dây bò lá tim xoè ngang + quả dưa giữa |
| `hydrangea` | Tulip (id cũ của Cẩm tú cầu) | `blue-ceramic` | một bông tulip đỏ mũm mĩm hình chén, cánh bo tròn, hai lá to ở gốc |
| `tomato` 🔒 | Cà chua (mặt `doll`) | `pink-cup` | thân móc câu qua đỉnh quả to mang mặt, lá kép răng cưa, quả nhỏ mặt mini |
| `blueberry` 🔒 | Việt quất (mặt `sparkle`) | `cat` | thân chẻ đôi thấp, hai quả tròn có vương miện sao |
| `daisy` 🔒 | Cúc hoạ mi (mặt `happy`) | `glass-bowl` | bó ba bông cúc trắng trên thân mảnh xoè |
| `strawberry` 🔒 | Dâu tây (mặt `cheeky`) | `basket` | một quả dâu khổng lồ làm thân ngồi trên khóm lá ba chét |

🔒 = loài khoá (xem *Cây mới mở khoá*).

**Phác thảo trước, đưa vào nội dung sau:** vẽ hình mới (loài, dáng, chậu…) thì phác thảo trong `src/dev/sketch/` (thêm trang vào `SHEETS` ở `main.tsx`, xem ở `http://localhost:5173/sketch.html?s=<trang>` hoặc chụp bằng `npm run sketch:shot`), cho chủ repo chọn rồi mới chép vào `src/content`. **Giữ lại** file phác thảo sau khi chốt (ghi bản nào đã chọn); trang `styles` vẽ mọi loài + dáng thật bằng `PlantScene`. Trang `playground` (Phòng thử) chọn cây / dáng / giai đoạn / chậu / kiểu mặt / mắt / miệng / nét mặt, lựa chọn nằm trên URL nên chụp lại được; nhãn ✅ = đang dùng trong app, ✏️ = phác thảo. Trang `faces`: 3 kiểu mặt đang dùng (vẽ bằng `Face` thật) + phác thảo: bộ mặt F0–F5 (`FACE_PRESETS`, cặp mắt + miệng có tính cách, chọn được ở ô Kiểu mặt của Phòng thử), mắt E1–E4, miệng M1–M3; hình phác thảo gắn mặt riêng qua `Look.drawFace` (việt quất: F0 = E4 + M0). Trang `tomato` (Cà chua, T1 bám ảnh mẫu nhất), `blueberry` (Việt quất, B1–B3), `daisy` (Cúc hoạ mi, D1–D3, mặt E5 + M3; D1 theo mẫu trùng dáng Hướng dương) và `strawberry` (Dâu tây, S1–S3, mặt F3). Bốn loài chờ chỉ còn 3 chậu trống, loài thứ tư cần chậu mới: loài chờ đưa vào app, cũng chọn được trong Phòng thử. Mỗi trang có nút `← Mục lục` (`sketch:shot` ẩn khi chụp).

**Dáng mở khoá** (mỗi dáng phải khác mọi loài khác và 2 dáng còn lại của chính loài, nhưng vẫn nhận ra loài — **ngoại lệ do chủ repo chọn: Tulip, 2 dáng chỉ đổi màu**; soát bằng `src/dev/ArtGallery.tsx` chụp WebKit). `plants.test.tsx` kiểm mọi loài có `styles`: đúng 2 dáng, mốc 10 rồi 20, đủ bud/bloom. Một số id dáng là id cũ của bản vẽ trước, **giữ để không mất dữ liệu**.

| Loài | Dáng 2 (10 ngày) | Dáng 3 (20 ngày) |
|---|---|---|
| `sunflower` | `giant` Khổng lồ: thân cao vồng nhẹ, bông to gật đầu | `mini` (id cũ) Mặt trời nhỏ: thân ngắn mập, đầu to hai vòng cánh mang mặt. Cảm hứng hoa hướng dương game thủ thành, **không chép nhân vật có bản quyền, không nhắc tên game** |
| `corn` | `popcorn` Bỏng ngô: bắp bóc vỏ, bỏng ngô bung chữ V | `rainbow` Cầu vồng: ba bắp nhiều màu xoè như bó hoa |
| `cactus` | `bunny` Tai thỏ: lá dẹt bầu dục + hai lá dựng như tai thỏ | `barrel` Cầu vàng: khối cầu thấp sống dọc, vương miện hoa |
| `pothos` | `pole` Leo cột: lá xẻ leo dọc cột rêu | `trailing` Rủ: dây lá rủ qua miệng chậu hai bên |
| `orange` | `kumquat` Quất Tết: tán tháp 4 tầng, bao lì xì | `bonsai` Bonsai: thân xoắn nghiêng, 3 tán mây dẹt |
| `cherry` | `weeping` (id cũ) Bụi: bụi lá tròn thấp, chùm cherry quanh chân; bản Rủ cũ ở `src/dev/sketch/cherry.tsx` | `lantern` Cần câu: thân chéo như cần câu, treo chùm cherry to |
| `rose` | `arch` (id cũ) Cành ba bông: cành chẻ hai nhánh, ba bông nhìn từ trên (`TopRose`); **không phụ kiện** | `dome` (id cũ) Hồng bắp cải: một bông cầu hai vòng cánh (`CabbageHead`); **không phụ kiện** |
| `watermelon` | `square` Vuông: quả dưa khối vuông bo góc | `trellis` Giàn leo: giàn thang, dây zigzag, dưa trong túi lưới |
| `hydrangea` | `parrot` (id cũ) Hồng: **cùng dáng Gốc, màu hồng** (`TulipBud`/`TulipBloom` nhận bảng màu `p`) | `bouquet` (id cũ) Vàng: **cùng dáng Gốc, màu vàng**; bản Bó hoa cũ ở `src/dev/sketch/tulip.tsx` |
| `tomato` | `arch` Cành cong: cành vòng dấu hỏi, quả treo dưới vòm | `staked` Cọc tre: thân buộc cọc, quả to trên đỉnh (**ngoại lệ do chủ repo chọn**: gần cột xương rồng) |
| `blueberry` | `branchy` Cây nhánh: thân nâu chữ V, quả treo dọc nhánh | `cluster` Chùm quả (**ngoại lệ do chủ repo chọn**: gần khối cầu cây cam) |
| `daisy` | `candelabra` Đèn nến: nhánh uốn như chân nến | `single` Một bông theo ảnh mẫu (**ngoại lệ do chủ repo chọn**: trùng dáng Gốc Hướng dương) |
| `strawberry` | `patch` Bụi thấp: khóm lá xoè, quả rủ qua miệng chậu | `twig` Cành treo quả |

Dáng của 4 loài khoá là các bản phác thảo không được chọn làm Gốc (`src/dev/sketch/{tomato,blueberry,daisy,strawberry}.tsx`, đầu file ghi bản nào vào đâu).

Hình dùng chung cho mọi loài: `common/SleepingSeed.tsx` (ngày nghỉ) và `common/WiltedPlant.tsx` (ngày bỏ lỡ).

### Chậu: `PotStyle`
```ts
interface PotStyle { id: string; name: Localized<string>; art: Art }
```
**Thêm chậu mới:** vẽ component trong `src/content/pots/pots.tsx` (nên dùng `BasicPot({ body, rim, soil?, children })` cho chậu hình thang, `children` là hoạ tiết trên thân), hoặc dùng `{ image }`. Sau đó thêm một dòng vào `POTS` trong `pots/registry.ts`. Chậu mới nên khác dáng hẳn các chậu đã có. Chậu dùng `clipPath` thì lấy id riêng qua `useId` (như `glass-bowl`).

Chậu hiện có (13): `terracotta` (Đất nung, mặc định chung), `polka`, `mint`, `rattan`, `wood`, `pink-cup`, `rose-porcelain`, `tin-bucket`, `blue-ceramic`, `concrete`, `glass-bowl` (Bể kính), `cat` (Chậu mèo), `basket` (Giỏ đan có quai, của Dâu tây; phác thảo `src/dev/sketch/pots.tsx`). Mọi chậu đều đã là chậu mặc định của một loài: loài mới cần chậu mới.

### Hiệu ứng đặc biệt: `SpecialVariant`
```ts
interface SpecialVariant {
  id: string; name: Localized<string>;
  weight: number;            // trọng số khi đã trúng 10%
  Overlay: FC;               // vẽ đè lên cây
  Underlay?: FC;             // vẽ sau chậu và cây
  PlantFilter?: FC<{ id: string; animate: boolean }>;  // trả về <filter id={id}> SVG cho lớp cây (specials/filters.tsx)
}
```
**Thêm hiệu ứng mới:** viết overlay trong `src/content/specials/specials.tsx` rồi thêm một dòng vào `SPECIALS` trong `specials/registry.ts`.

> **Đổi màu cây phải dùng `<filter>` SVG (`PlantFilter`), KHÔNG dùng `filter` CSS:** WebKit/Safari bỏ qua filter CSS đặt lên `<g>` bên trong SVG, nên trên iPhone cây không đổi màu (Chrome thì có, nên dễ không thấy). Quy đổi hàm CSS sang `feColorMatrix` (sepia/saturate/hueRotate), `feComponentTransfer` (brightness/opacity), blur + flood (drop-shadow); đặt `colorInterpolationFilters="sRGB"`. Hiệu ứng động dùng `<animate>` của SVG, tắt khi `animate=false` (giảm chuyển động). `PlantScene` cấp id riêng cho mỗi cảnh (`useId`) và bọc lớp cây trong `<g data-part="plant-layer" filter="url(#…)">`. Test E2E `hiệu ứng Vàng ròng đổi màu cây thật trên WebKit` vẽ SVG lên canvas để đo màu.

Hiệu ứng hiện có: `glow` Phát sáng (3), `sparkle` Lấp lánh (3), `rainbow` Cầu vồng (2), `gold` Vàng ròng (1), `crystal` Pha lê (1). Số trong ngoặc là `weight`.

### Fallback (không bao giờ crash)
Với id không còn tồn tại (đã xoá khỏi nội dung, hoặc đến từ file backup của bản mới hơn):
- `getSpecies(id)` trả về loài đầu tiên;
- `getPot(id)` trả về `terracotta`;
- `getSpecial(id)` trả về `null`.

`content/catalog.ts` sinh `CATALOG` (chỉ id, chậu mặc định và weight) cho tầng domain từ 3 registry.

### Ghép cảnh
`components/PlantScene.tsx` vẽ theo thứ tự: Underlay → chậu → cây (hoặc hạt ngủ / cây héo) + mặt → Overlay → côn trùng → lớp phụ (bình tưới, hiệu ứng bung lá).

Các thuộc tính để test bám vào: `data-testid` (mặc định `plant-scene`), `data-plant`, `data-pot`, `data-stage`, `data-mode` (`plant | sleeping | wilted`), `data-special`, `data-style` (`base` khi Gốc).

## Cơ sở dữ liệu (IndexedDB qua Dexie)

Tên DB: `chau-cay-chibi`, `SCHEMA_VERSION = 6` (`src/db/db.ts`).

- **v1**: bản đầu tiên.
- **v2**: thêm buổi. Bước `upgrade` gán `period: 'morning'` cho todo cũ và chuyển `items: string[]` của mẫu cũ thành `{ text, period: 'morning' }[]`.
- **v3**: thêm bảng `planned` (việc đã lên lịch cho ngày tương lai).
- **v4**: thêm bảng `plannedGoals` (mục tiêu đặt trước cho ngày tương lai).
- **v5**: thêm bảng `reminders` (việc nhắc).
- **v6**: thêm bảng `habits` (thói quen) và `habitChecks` (lần điểm danh).

| Bảng | Khoá / index | Nội dung |
|---|---|---|
| `days` | `date` | `DayRecord`, mỗi ngày một bản ghi |
| `templates` | `id`, index `createdAt` | `Template` |
| `settings` | `key` | `{ key, value }` |
| `planned` | `id`, index `date` | `PlannedTodo` (việc đã lên lịch) |
| `plannedGoals` | `date` | `{ date, title }` (mục tiêu đặt trước) |
| `reminders` | `id` | `Reminder` (việc nhắc dài hạn) |
| `habits` | `id`, index `order` | `Habit` (thói quen) |
| `habitChecks` | `[habitId+date]`, index `habitId`, `date` | `HabitCheck` (một lần điểm danh) |

```ts
// src/domain/types.ts
type Period = 'morning' | 'afternoon' | 'evening';
interface Todo { id: string; text: string; done: boolean; doneAt: number | null; order: number; period: Period; reminderId?: string } // reminderId: việc đến từ Nhắc việc
interface TemplateItem { text: string; period: Period }
interface PlannedTodo { id: string; date: string; text: string; period: Period; createdAt: number } // createdAt tăng dần trong một ngày
interface Reminder { id: string; text: string; autoToday: boolean; doneAt: number | null; createdAt: number; updatedAt: number } // autoToday = công tắc "Hôm nay"
interface Habit { id: string; name: string; icon: string; color: HabitColor; weekdays: number[]; order: number; startDate: string; pauses?: HabitPause[]; createdAt: number; updatedAt: number } // weekdays 0 = CN … 6 = T7; startDate = ngày tạo, ngày trước đó không tính
interface HabitPause { from: string; to: string | null } // khoảng dừng; to = ngày tiếp tục (không tính), null = đang dừng; có trong sao lưu (tuỳ chọn)
interface HabitCheck { habitId: string; date: string; at: number } // một lần điểm danh; có bản ghi = đã làm

interface DayRecord {
  date: string;              // 'YYYY-MM-DD' theo mốc 4:00
  plantId: string;
  potId: string;
  specialId: string | null;
  isRestDay: boolean;
  title?: string;            // MỤC TIÊU ngày (tên trường giữ là title); bản ghi cũ không có → coi là ''
  speech?: string;           // lời cây nói cả ngày; không có = chưa chọn (chọn khi mở Hôm nay), '' = không nói
  styleId?: string;          // dáng cây của ngày; không có = 'base' (Gốc)
  bugId?: string;            // côn trùng ghé ngày làm đủ thói quen (bốc một lần, ensureDayBug); không có = chưa bốc / ngày cũ
  greetedAt: number | null;  // ms; null = chưa chào hôm nay
  note: string;
  todos: Todo[];             // luôn lưu theo order tăng dần, order = 0..n-1
  finalStage: 'seed' | 'sprout' | 'bud' | 'bloom';  // cập nhật mỗi lần sửa todo
  createdAt: number;
  updatedAt: number;         // dùng khi gộp backup (bản mới hơn thắng)
}

interface Template { id: string; name: string; items: TemplateItem[]; isDefault: boolean; weekdays?: number[]; createdAt: number; updatedAt: number }
// weekdays: 0 = CN … 6 = T7 (getDay), đã bỏ trùng + sắp xếp (cleanWeekdays); không có = không tự thêm theo thứ; có trong sao lưu (tuỳ chọn, không tăng SCHEMA_VERSION)
// chỉ một mẫu được isDefault = true (setDefaultTemplate đảm bảo)

// settings
calendarBg:   { mime: string; data: ArrayBuffer }   // nền lịch: ảnh tĩnh nén JPEG ≤ 1600px, hoặc GIF / video giữ nguyên tệp (≤ 25 MB)
lastBackupAt: number
calendarTheme: 'default' | 'cat' | 'dog' | 'grass' | 'rain' | 'gamer' | 'photo'
menuIcon: 'auto' | 'flower' | 'cat' | 'dog' | 'grass' | 'rain' | 'gamer' | 'heart'   // không có = auto (theo hình nền); có trong sao lưu (gộp: chỉ lấy khi máy chưa chọn)
showCalendarBgButton: boolean                        // không có = bật
showNoteDot:  boolean                                // chấm đỏ ở ô lịch ngày có ghi chú; không có = bật
showPlantSpeech: boolean                             // hiện bong bóng lời cây nói của ngày; không có = BẬT
showHabitStrip: boolean                              // hiện dải thói quen ở màn Hôm nay; không có = BẬT
language: 'vi' | 'en'                               // không có = chưa giải lần nào (resolveLang ghi ở lần mở đầu); có trong sao lưu
gardenView: 'plants' | 'habits'                    // công tắc Cây | Thói quen của Khu vườn; có trong sao lưu (gộp: chỉ lấy khi máy chưa có)
gardenOnlyPlanted: boolean                           // Khu vườn chỉ hiện luống > 0 ngày; không có = TẮT
gardenSeparateSpecial: boolean                       // Khu vườn tách ngày cây đặc biệt thành luống riêng; không có = TẮT
unlockedSpecials: string[]                           // cây đặc biệt đã tung trúng, 'plantId|specialId'; có trong sao lưu (gộp = hợp hai danh sách)
unlockedStyles: string[]                             // dáng cây đã mở (đủ ngày ra hoa), 'plantId|styleId'; có trong sao lưu (gộp = hợp)
unlockedPlants: string[]                             // loài khoá đã chọn mở (mỗi 90 ngày đạt một lượt); có trong sao lưu (thay thế: theo file, gộp = hợp)
styleBloomCredit: string                             // ngày đã góp vào mở dáng (mỗi ngày một lần); không có trong sao lưu
// mọi công tắc bật/tắt liệt kê ở BOOLEAN_SETTINGS (db/settings.ts): backup tự sao lưu/khôi phục theo danh sách này
```

- **Ảnh lưu dạng `ArrayBuffer`, không dùng `Blob`**, vì IndexedDB của Safari xử lý Blob không ổn định.
- **Mọi thao tác sửa một ngày đi qua `mutateDay`** trong `dayService`. Hàm này kiểm tra khoá ngày, sắp xếp và đánh số lại `order`, tính lại `finalStage`, cập nhật `updatedAt`, tất cả trong một transaction.
- **Khi đổi cấu trúc dữ liệu:** thêm `this.version(N).stores(...).upgrade(...)` và tăng `SCHEMA_VERSION`. **Không sửa `version(1)`.**

## Format file sao lưu

Tên file: `chau-cay-backup-YYYY-MM-DD.json`. Khi lưu, app mở menu Chia sẻ của iOS; nếu Safari chặn (`NotAllowedError`) thì tải file xuống thay thế. App Android: ghi vào cache rồi mở menu Chia sẻ của Android (`shareFile` trong `src/platform`).

```json
{
  "format": "chau-cay-chibi-backup",
  "schemaVersion": 6,
  "exportedAt": 1790000000000,
  "days": [DayRecord, ...],
  "templates": [Template, ...],
  "planned": [PlannedTodo, ...],
  "plannedGoals": [{ "date": "YYYY-MM-DD", "title": "..." }, ...],
  "reminders": [Reminder, ...],                 // file 1–4 không có → []
  "habits": [Habit, ...],                       // file 1–5 không có → []
  "habitChecks": [HabitCheck, ...],             // file 1–5 không có → []
  "gardenView": "plants",                       // tuỳ chọn; file cũ không có
  "calendarBg": { "mime": "image/jpeg", "base64": "..." } | null,
  "unlockedSpecials": ["corn|glow", ...],         // tuỳ chọn; file cũ không có
  "unlockedStyles": ["sunflower|mini", ...],      // tuỳ chọn; file cũ không có (ngày có thể có "styleId", "bugId")
  "unlockedPlants": ["tomato", ...],             // tuỳ chọn; file cũ không có
  "language": "vi",                               // tuỳ chọn; file cũ không có
  "menuIcon": "auto"                              // tuỳ chọn; file cũ không có
}
```

File thiếu `planned` (phiên bản 1–2), `plannedGoals` (1–3) hoặc `reminders` (1–4) được coi là `[]`; khi gộp, việc nhắc theo `id`, bản `updatedAt` lớn hơn thắng; todo giữ `reminderId`; việc đã lên lịch chỉ được thêm nếu chưa có `id`. File phiên bản 1 vẫn khôi phục được: todo thiếu `period` được gán `'morning'`, mẫu có `items` dạng chuỗi được chuyển thành `{ text, period: 'morning' }`.

Thói quen (v6): file 1–5 thiếu `habits` / `habitChecks` được coi là `[]`; khi gộp, thói quen theo `id` (`updatedAt` lớn hơn thắng), lần tick theo cặp `[habitId+date]` (hợp hai bên), rồi **bỏ tick mồ côi** (trỏ tới thói quen không còn); `gardenView` chỉ lấy khi máy chưa có.

`parseBackup` kiểm tra theo thứ tự sau; mọi thông báo lỗi đều bằng tiếng Việt và không ghi gì vào DB khi lỗi:
1. JSON hợp lệ.
2. `format` đúng.
3. `schemaVersion` không mới hơn app.
4. Schema zod khớp, kể cả base64 hợp lệ.

`restoreBackup(db, backup, mode)` chạy trong một transaction:
- `replace`: xoá hết rồi ghi lại từ file.
- `merge`: gộp theo `date` / `id`; bản có `updatedAt` lớn hơn thắng; ảnh nền chỉ lấy từ file khi máy chưa có.
- Ở cả hai chế độ, sau khi khôi phục chỉ giữ **một** mẫu mặc định (mẫu có `updatedAt` mới nhất).

## Giao diện

- **Phong cách "sticker chibi":** khối bấm được có viền nâu ca cao 2px và bóng đổ cứng lệch xuống (`--shadow-pop`), bo góc lớn. Điểm nhấn duy nhất là cảnh chậu cây trên nền trời đổi theo giờ.
- **Màu** (CSS variables trong `src/app/theme.css`): peach `#FFD6DE`, mint `#CDEFE3`, butter `#FFF1C1`, lavender `#E3D9FF`, sky `#D4ECFF`, chữ cocoa `#5B4636`.
- **Font:** Baloo 2 (tiêu đề) và Quicksand (nội dung), tự host qua `@fontsource` để chạy offline. Không gọi mạng lúc chạy; mọi file đều được precache bởi Workbox.
- **Màn Hôm nay:** cao đúng bằng khung app (`overflow: hidden`); **trời + cây đứng yên, chỉ `.today__list` tự cuộn** (chừa `padding-bottom` cho nút menu). Việc đã xong: chữ nhạt + dấu ✓, **không gạch ngang**. Bầu trời cao `46dvh`. `.sky__content` là khung flex dọc, `.today__stage` có `flex: 1 1 0; min-height: 0`, SVG cây được **định vị tuyệt đối** trong stage. Hàng 4 nút dưới chậu: Đổi cây & chậu, Ghi chú, Ngày nghỉ, Nhắc việc.
- **Nút tròn (`<button>` có `width`/`height` cố định) phải đặt `padding: 0`**: một số bản Safari gán padding ngang lớn cho `<button>`, làm nút trong hàng flex nở thành hình bầu dục và đẩy icon sang phải. Test E2E `nút tròn vẫn tròn…` giả lập trường hợp này.
- **Không dùng `height: 100%` + `width: auto` cho SVG**: Safari tính sai và đẩy hàng nút dưới chậu ra khỏi khung.
- **Nút quay lại** (`BackButton`, `back-btn`, nhãn mặc định `Quay lại Lịch`, đổi được qua `label`): chỉ mũi tên, không nền/viền. Có ở Hôm nay, ngày tương lai, Khu vườn, Cài đặt (về Lịch), Mẫu (`Quay lại Cài đặt`), Nhắc việc (`Quay lại Hôm nay`), Quản lý thói quen (về nơi đã mở nó). Trên trời nó nổi ở góc trái trên (trời tối thì mũi tên trắng); ở các màn khác nằm đầu hàng tiêu đề (`inline`).
- **Điều hướng = menu nổi** (`app/TabBar.tsx`): không có thanh tab ở đáy, chỉ một nút tròn cố định góc phải dưới ở cả 4 màn (`--tabbar-h` 60px). Bấm thì dải 4 tab (`Tab = 'calendar' | 'today' | 'garden' | 'settings'`) trượt ra bên trái, nút thành ✕. Mặc định thu gọn khi mở app. **Chọn tab không đóng dải tab; chạm ra ngoài menu thì dải tự thu** (cú chạm vẫn tới chỗ được chạm; E2E dùng helper `closeMenu`). Màn có nút ở đáy phải chừa `padding-bottom` cho nút menu.
  - Icon nút menu (setting `menuIcon`, `MenuIcon kind` trong `icons.tsx`): `auto` = theo hình nền (mặc định), hoặc chọn riêng (`heart` chỉ chọn riêng). `resolveMenuIcon` (`domain/menuIcon.ts`) đổi lựa chọn + `calendarTheme` thành icon, `App` lấy qua `useMenuIcon()`. **Thêm hình nền mới thì nhớ vẽ icon menu cho nó.**
- **Chuyển tab không có hiệu ứng** (theo yêu cầu): `App` render thẳng màn của tab.
- **`BottomSheet`**: nút X (`aria-label="Đóng"`) ở góc phải trên `.sheet__head`; chạm nền mờ cũng đóng.
  - Render qua **portal vào `<body>`**: màn Lịch đặt `position: relative` cho mọi con trực tiếp (`.screen--calendar > :not(.bg-scene)`), từng làm bảng mất `position: fixed` và nằm cuối trang. Đừng bỏ portal.
  - `tall`: phủ gần hết màn hình (chừa 48px + safe-area ở trên), tiêu đề + X đứng yên, chỉ `.sheet__body` cuộn.
- **Icon:** không dùng emoji cho icon chức năng; dùng bộ SVG tự vẽ trong `components/icons.tsx` (khung 32×32, viền cocoa, màu pastel, `data-icon` để test). Buổi hiện qua `<PeriodIcon period>`. Ô đánh dấu trong bảng chi tiết là `.detail__check` tự vẽ, không dùng emoji. `IconButton` nhận `icon: ReactNode`.
- **Hình nền Lịch** (`BackgroundPicker`, radiogroup `Hình nền lịch`, setting `calendarTheme`). Trên màn Lịch có nút tròn đổi nền (ẩn được bằng `showCalendarBgButton`) mở BottomSheet; cùng bộ chọn có trong Cài đặt. Khi nền khác `default`, thẻ tháng và lưới ngày có class `is-glass` (kính mờ `backdrop-filter`).
  - `cat` Mèo vươn vai (`CatStretchScene`, nâng `CAT_LIFT` 72 để không sát thanh Home; vị trí tim đặt ở `<g>` bao ngoài vì transform của keyframes đè transform của chính phần tử).
  - `dog` Cún vẫy đuôi (`DogWagScene`, Corgi nhìn nghiêng — **không vẽ cún nhìn thẳng**; nâng `DOG_LIFT` 72; tai vẽ trước đầu để chân tai chìm vào đầu; nằm dưới nút đổi nền và bên trái nút menu, E2E kiểm).
  - `grass` Cỏ nở, `rain` Mưa chill, `gamer` Gaming pixel (`shapeRendering=crispEdges`, `steps()`).
  - Nền động vẽ bằng SVG khung 390×844 (`preserveAspectRatio="xMidYMax slice"`) + keyframes trong `backgrounds.css`; **chừa góc phải dưới cho nút menu**; tắt chuyển động khi `prefers-reduced-motion`.
  - `photo` = ảnh **hoặc nền động** của người dùng (`calendarBg`, `accept="image/*,video/*"`, `prepareBackground` trong `utils/image.ts`). Ảnh tĩnh nén JPEG; GIF và video (mp4, mov) **lưu nguyên tệp** vì nén qua canvas làm mất chuyển động, tối đa `MAX_ANIMATED_BG_BYTES` 25 MB (quá thì báo lỗi). GIF làm `background-image`; video phát bằng `<video data-testid="calendar-video">` trong `bg-scene` với **autoplay + muted + loop + playsInline (bắt buộc để Safari iOS tự phát)**; giảm chuyển động thì không tự phát. Bản cũ chưa có `calendarTheme`: có ảnh → `photo`, không → `default` (`useCalendarTheme`). **Đổi sang kiểu khác không xoá ảnh.**
- **Tôn trọng** `prefers-reduced-motion`, safe-area (qua biến `--safe-area-inset-*`, xem *Android*) và chiều cao `100dvh`.
- **Label và `data-testid` mà test dựa vào: đừng đổi tuỳ tiện; tìm trong `tests/` trước khi đổi.** Unit test render tiếng Việt mặc định qua `renderWithDeps(ui, deps, nav, lang = 'vi')`, E2E dùng `locale: 'vi-VN'`; bản tiếng Anh tương ứng ở `src/i18n/en.ts`, E2E tiếng Anh ở `tests/e2e/i18n.spec.ts` (`test.use({ locale: 'en-US' })`, vd. `Open menu`, `Add morning task`, `Complete: <task>`, `Tap the plant`). Helper E2E: `goTab(page, 'Lịch')` chuyển tab, `closeMenu`, `openTemplates(page)` (Cài đặt → `Quản lý mẫu`), `openReminders(page)` (Hôm nay → `Nhắc việc`).

## Lỗi nhỏ đã biết (chưa sửa)

- Lúc vừa qua 4:00, màn Hôm nay có thể hiện ngày cũ trong chốc lát. Nếu NoteSheet đang mở đúng lúc đó, ghi chú sẽ lưu vào ngày mới.
- `src/dev/ArtGallery.tsx` dùng lưới 4 cột không cố định cỡ ô, xem ở khổ hẹp thì các giai đoạn đầu bị bóp; muốn soát hình thì render `PlantScene` trong ô cỡ cố định.
- Để app mở qua sang tháng mới thì lịch vẫn ở tháng cũ.
- `setDefaultTemplate` / `deleteTemplate` / `file.text()` thiếu `.catch`, nên lỗi không hiện thông báo.
- Trợ năng: sửa todo bằng cách chạm vào `<span>`; BottomSheet chưa giữ focus và chưa xử lý Escape; `user-scalable=no`; chưa có cách sắp xếp lại không cần kéo thả.
- Regex ngày trong file backup chấp nhận cả ngày không tồn tại.
