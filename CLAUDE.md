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

- Spec gốc: `docs/superpowers/specs/2026-10-02-chibi-plant-todo-design.md`
- Kế hoạch triển khai: `docs/superpowers/plans/2026-10-02-chibi-plant-todo.md`
- Deploy: push `main` lên https://github.com/bigbeartk/garden-of-habits, GitHub Actions chạy test, build rồi đăng lên https://bigbeartk.github.io/garden-of-habits/
- **App Android** (Capacitor) dùng chung mã nguồn: cùng lần push, job `android` build APK (artifact của run). Xem mục *Android* bên dưới và `docs/android.md`.

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

- Chỉ commit và push khi mọi test đều pass. Nối lệnh bằng `&&`, không dùng `;`. Khi lọc output test qua `| grep`, bật `set -o pipefail` (nếu không, test fail vẫn đi tiếp tới commit/push).
- **Đừng pipe Playwright vào `| head`** trên Windows: `head` đóng ống sớm thì Playwright treo vô hạn (giữ cả server preview cổng 4173). Ghi ra file (`> pw.log 2>&1`) rồi grep file; nếu đã treo thì tắt các tiến trình node của lần chạy đó.
- E2E: sau khi đổi `page.clock.setFixedTime` rồi reload và thao tác một lúc, animation đóng menu nổi của WebKit có thể đứng ~5 giây (đồng hồ giả lệch timeline Web Animations, không phải lỗi app), làm `closeMenu` hết hạn. Khi đó đừng chờ dải tab thu lại: bấm thẳng nút cần bấm (chạm ra ngoài cũng tự thu menu).
- Thay đổi giao diện phải chạy E2E trên **WebKit**: Chrome không bắt được lỗi bố cục riêng của Safari.
- Làm theo TDD: viết test đỏ trước, rồi mới sửa code. Soát hình bằng ảnh chụp WebKit khổ iPhone 13.
- Test E2E/unit hay chập chờn khi chưa chờ ghi IndexedDB xong (reload ngay sau khi gõ) hoặc chờ một trong hai `useLiveQuery`: chờ trạng thái cuối cùng hiện ra trên giao diện. Nút gạt/toggle đọc từ DB phải giữ state cục bộ (optimistic), nếu không bấm nhanh hai lần sẽ sai: dùng `useOptimisticToggle(stored, save, onError)` (`src/hooks/`), nó **bỏ qua giá trị DB báo về khi còn lần lưu chưa xong** (kết quả đọc cũ về muộn từng làm công tắc nhảy ngược, test Cài đặt chập chờn trên CI), lưu xong thì lại theo DB, lưu lỗi thì quay về giá trị DB. Đừng viết `useEffect(() => setOn(stored), [stored])` trần. Đang dùng ở `SettingSwitch` và công tắc ☀ của Nhắc việc.

## Môi trường (Windows)

- Máy dev là Windows 10; công cụ Bash là Git Bash (POSIX). Đường dẫn Windows trong biến môi trường (`$APPDATA`…) bị hỏng trong Bash, nên dùng PowerShell khi cần.
- Không có `gh` CLI: xem trạng thái deploy tại https://github.com/bigbeartk/garden-of-habits/actions.
- **CI chạy Node 20, máy dev chạy Node 24.** Test pass trên máy vẫn có thể fail trên CI (đã từng làm tắc deploy 12 commit vì `new Response(new Blob(…))` của jsdom). Trước khi push, chạy thêm test giống CI (Node 20, giờ UTC): `TZ=UTC npx -y node@20 node_modules/vitest/vitest.mjs run`. Máy CI chậm hơn nên test chưa chờ đủ mọi `useLiveQuery` sẽ lộ ra ở đó. Sau khi push, kiểm tra run mới nhất: `https://api.github.com/repos/bigbeartk/garden-of-habits/actions/runs?per_page=1` (lỗi xem ở `check-runs/<job id>/annotations`).
- Push dùng tài khoản `bigbeartk` (remote `origin`).
- Source Control của VS Code có thể còn đếm hàng nghìn file `node_modules` từ lúc vừa `npm install`, dù `git status` sạch. Bấm Refresh hoặc **Developer: Reload Window**.

## Android (Capacitor)

- **Mọi tính năng chỉ viết một lần trong `src/`**, PWA và app Android cùng dùng. Không fork giao diện cho Android.
- Cái gì khác nhau giữa trình duyệt và app native thì **chỉ nằm trong `src/platform/index.ts`** (chỗ duy nhất gọi `isNative()` / plugin `@capacitor/*`, import động để PWA không phải tải): `shareFile` (Android: ghi cache bằng Filesystem rồi Share; huỷ → `AbortError`), `openExternal`, `onAppResume` (thêm sự kiện `resume`), `onHardwareBack`, `exitApp`, `setupNativeShell`. Màn hình chỉ được hỏi `isNative()` để ẩn/đổi chữ (vd. Cài đặt ẩn `Hướng dẫn cài app`, phiên bản ghi `· Android`, nhắc lưu "Google Drive" thay "iCloud").
- Native không đăng ký service worker, không gọi `storage.persist()` (`main.tsx`).
- **Nút Back của Android** (`src/app/back.ts`): màn/bảng đang mở đăng ký `useBackHandler(active, fn, layer)`, lớp `tab < screen < form < sheet`; Back gọi lớp cao nhất, hết thì thoát app. Đã đăng ký: `BottomSheet` (mọi bảng), menu nổi, ngày tương lai, màn Mẫu, form mẫu, màn Nhắc việc (+ dòng thêm/sửa việc nhắc), màn quản lý thói quen (lớp `screen`, trong Khu vườn), form thói quen (lớp `form`), tab khác Lịch → Lịch. **Thêm màn con / bảng / chế độ sửa mới thì nhớ đăng ký**, nếu không Back nhảy qua nó.
- **Safe-area:** Android 15+ luôn tràn viền; SystemBars của Capacitor (`capacitor.config.ts`, `insetsHandling: 'css'`) bơm biến `--safe-area-inset-*`. Trong CSS **luôn viết `var(--safe-area-inset-x, env(safe-area-inset-x))`**, không viết `env()` trần (WebView cũ trả 0).
- `appId` `io.github.bigbeartk.gardenofhabits` không đổi được sau khi lên Play. Thư mục `android/` được commit (trừ file sinh ra); web build được `cap sync` chép vào lúc build, không commit.
- Job CI `android` chạy **Node 22** (Capacitor CLI 8 đòi Node ≥ 22); job PWA vẫn Node 20.
- APK phải luôn ký **cùng một khoá** (secrets `ANDROID_KEYSTORE_*`), nếu không cài đè không được → gỡ app = mất dữ liệu. Chưa có secret thì CI chỉ build APK debug.
- Dữ liệu PWA và app tách riêng; chuyển qua Sao lưu / Khôi phục (định dạng giống hệt).
- Chưa có E2E trên Android: soát tay trên máy thật theo checklist trong `docs/android.md` khi đổi những chỗ thuộc `src/platform` hoặc bố cục.

## Kiến trúc

```
src/
  app/        App (tab + tự sang ngày mới), TabBar (menu nổi), nav (TABS + NavContext), deps (DepsContext), back (nút Back Android), habitIntent (Hôm nay → Khu vườn/Thói quen/màn quản lý), theme.css
  domain/     logic thuần TS, test độc lập: dayKey, growth, random, timeOfDay, dayService,
              templateService, plannedService, reminderService, reminderView, habitService, habitReport, calendar, garden, types
  db/         Dexie (db.ts), settings, queries, backup (export/import/merge), share
  content/    NỘI DUNG mở rộng được: plants/, pots/, specials/, common/, Face, ArtView, catalog, sayings, praises, taps
  components/ PlantScene, SkyBackground, TodoList, BottomSheet, DayCell, HabitStrip, HabitReport, HabitForm, WeekdayPicker, ...
  screens/    CalendarScreen (màn mở đầu; mở FutureDayScreen cho ngày tương lai), TodayScreen (mở RemindersScreen từ nút chuông dưới chậu), GardenScreen (tab Khu vườn; mở HabitsScreen), SettingsScreen (mở TemplatesScreen từ thẻ "Mẫu việc")
  hooks/      useNow, useToday, useBackupReminder, useCalendarBg
  platform/   khác biệt PWA ⇄ Android (Capacitor): chia sẻ file, link ngoài, resume, nút Back
  i18n/       vi.ts (nguồn chuẩn) + en.ts, lang (Lang, detectLang, resolveLang, Localized, tr), fmt (ngày giờ), I18nProvider (useI18n), errors (errorText)
  dev/        ArtGallery.tsx — xem trước mọi cây/chậu (render tạm từ main.tsx khi cần)
```

- Màn hình không gọi thẳng `db` hay `Math.random`/`new Date()`. Chúng lấy `DayDeps = { db, catalog, rng, now }` qua `useDeps()`.
- Test dùng helper trong `tests/unit/helpers.tsx`:
  - `makeDeps(start, catalog)` tạo DB riêng, RNG `mulberry32(42)` và đồng hồ chỉnh được qua `clock.current`;
  - `renderWithDeps` render component với các deps đó.

## Quy tắc nghiệp vụ

- **Mốc sang ngày mới: 04:00 sáng** giờ địa phương (`DAY_START_HOUR`). Khoá ngày dạng `'YYYY-MM-DD'`, tính bằng `dayKey(now)`.
- **`ensureToday(deps)`** chạy khi mở app và mỗi khi `todayKey` đổi (`useNow` cập nhật mỗi 30 giây và khi `visibilitychange`/`focus`). Hàm này idempotent, chạy trong một transaction.
- **Một ngày mới được tạo** như sau:
  - random đều một loài cây; chậu là `defaultPotId` của loài đó;
  - **10%** khả năng là cây đặc biệt (`SPECIAL_CHANCE`); khi trúng, hiệu ứng được chọn theo `weight`;
  - todo lấy từ **mẫu mặc định**, rồi các **mẫu khác có chọn đúng thứ** của ngày (`Template.weekdays`, thứ theo khoá ngày nên 2h sáng thứ Bảy vẫn là thứ Sáu; theo thứ tự tạo; mẫu mặc định không bị thêm hai lần), rồi tới các **việc đã lên lịch** cho ngày đó (bảng `planned`, xoá khỏi bảng sau khi chuyển). Việc chưa xong hôm qua ở lại ngày cũ, không chuyển sang.
- **Giai đoạn cây** tính theo tỉ lệ việc xong trong ngày (`stageFor`):
  - 0 việc xong, hoặc chưa có việc nào → `seed` (hạt giống)
  - ≥ 1 việc → `sprout` (nảy mầm)
  - ≥ 50% → `bud` (ra chồi)
  - 100% → `bloom` (ra hoa)
- **Ngày đã qua bị khoá** (`LockedDayError` cho todo). Trên giao diện ngày đã qua **chỉ để xem**, kể cả ghi chú (tầng domain `setNote` vẫn cho phép, nhưng UI không còn ô sửa).
- **Chỉ hôm nay** mới được: thêm/sửa/xoá/tick/sắp xếp todo, đặt **mục tiêu ngày** (`setTitle`), đổi cây, đổi chậu, bật ngày tiết kiệm năng lượng.
- **Mục tiêu ngày** (lưu ở trường `title`, giao diện gọi là "Mục tiêu"): ô ở đầu danh sách (`GoalInput`), lưu khi rời ô hoặc Enter, tối đa 60 ký tự. Ngày tương lai có mục tiêu đặt trước (bảng `plannedGoals`, `setPlannedGoal`/`getPlannedGoal`), đến 4:00 ngày đó `ensureToday` chuyển thành `title` rồi xoá. Ngày đã qua chỉ xem mục tiêu trong bảng chi tiết.
- **Nút quay lại** (`BackButton`, class `back-btn`, icon `back`, nhãn mặc định `Quay lại Lịch`, đổi được qua `label`): có ở **Hôm nay, ngày tương lai, Khu vườn, Cài đặt** (về màn Lịch) và **Mẫu** (nhãn `Quay lại Cài đặt`, về Cài đặt), **Nhắc việc** (nhãn `Quay lại Hôm nay`, về Hôm nay), **Quản lý thói quen** (về **nơi đã mở nó**: từ Khu vườn thì nhãn `Quay lại Khu vườn`, từ chip Hôm nay thì nhãn `Quay lại Hôm nay` và về tab Hôm nay); **chỉ mũi tên, không nền/viền**. Trên trời (Hôm nay/tương lai) nó nổi ở góc trái trên (trời tối thì mũi tên trắng); ở Khu vườn/Mẫu/Cài đặt nằm đầu hàng tiêu đề (`inline`).
- **Màn Mẫu nằm trong Cài đặt** (không còn là tab): thẻ đầu tiên của Cài đặt là **"Mẫu việc"**, ghi `⭐ Đang dùng: <tên>` (hoặc `Chưa có mẫu mặc định`) + nút `Quản lý mẫu`; bấm thì `SettingsScreen` hiện `TemplatesScreen` (prop `onBack`) thay chỗ trang Cài đặt. Thứ tự thẻ Cài đặt: Mẫu việc → Thói quen (công tắc `Hiện thói quen ở màn Hôm nay`) → Lịch → Ngôn ngữ → Sao lưu & khôi phục → Ủng hộ tôi (Nhắc việc đã chuyển sang màn Hôm nay). Hướng dẫn cài app không còn là thẻ: nút tròn `Hướng dẫn cài app` (icon `help`) ở cuối hàng tiêu đề mở BottomSheet `Cài app lên màn hình chính` (các bước + trạng thái lưu bền vững); dữ liệu chưa lưu bền vững thì nút có chấm hồng.
- **Màn Mẫu:** nút `＋ Mẫu mới` rộng nét đứt; thẻ mẫu có tên + nút ngôi sao SVG (`star`, chữ "Mặc định"/"Đặt mặc định", thẻ mặc định viền vàng), 3 khối màu theo buổi (icon + tên + số việc), hàng nút [Thêm vào hôm nay][Sửa][Xoá]; form có 3 khối màu kèm icon, rồi hàng **`Tự thêm vào các thứ`** (`role="group"`, 7 nút tròn T2…CN `aria-pressed`, nhãn `Thứ Hai`…`Chủ Nhật`; bật = nền peach, tắt = nét đứt); thẻ mẫu có chọn thứ hiện nhãn `tpl-weekdays` `Tự thêm: T7 · CN`. Chỉ áp dụng khi **tạo ngày mới**, không tự thêm vào hôm nay đã có. Mẫu/Cài đặt chừa `padding-bottom` cho nút menu nổi.
- **Buổi Sáng / Chiều / Tối** (`domain/period.ts`): mỗi todo và mỗi việc trong mẫu có `period`. Màn Hôm nay luôn hiện đủ 3 mục (mục trống ghi "Chưa có việc"); mỗi mục có số việc xong/tổng riêng; mục của buổi hiện tại (`periodOf`: 4–11h sáng, 11–18h chiều, còn lại tối) có viền đậm. **Kéo thả** (nắm `⋮⋮`) chuyển được việc sang buổi khác, kể cả buổi trống, hoặc sắp xếp trong buổi: `TodoList` tự viết bằng pointer events (không dùng `Reorder` của motion vì nó không kéo qua danh sách khác), buổi đích viền hồng (`is-drop-target`), vạch `todo__drop-line` báo vị trí, kéo gần mép thì vùng danh sách tự cuộn; lưu bằng `moveTodo(deps, date, id, period, index)`. Test E2E kéo phải đóng menu nổi trước. Cây vẫn lớn theo tỉ lệ việc xong của **cả ngày**.
- **Chạm vào cây** (màn Hôm nay): nút trong suốt `Chạm vào cây` (`.today__plant-tap`, phủ đúng khung 200×240 của cây, không lấn hàng 4 nút). Chạm thì cây cười (`data-mood="smile"`), nảy lên (`bounceKey`) và nói một câu ~3,5 giây (`data-kind="tap"`): `pickTap` lấy từ `COMMON_TAPS` (`content/taps.ts`) + `species.taps`, không lặp câu vừa nói. Ngày tiết kiệm năng lượng: cây vẫn ngủ, nói câu `SLEEPY_TAPS`. Câu tạm (khen/chạm) và khung ✨ giới thiệu có `pointer-events: none`, vì câu dài phủ xuống thân cây và từng nuốt mất cú chạm; riêng bong bóng lời của ngày bắt chạm (để sửa), nó chỉ 3 dòng và ẩn được.
- **Cây khen:** xong một việc thì cây cười và nói một câu khen khoảng 3,5 giây (`pickPraise`: câu chung `COMMON_PRAISES` + `species.praises`); xong việc cuối cùng (cây vừa ra hoa) thì dùng `BLOOM_PRAISES`. Câu khen/chạm hiện tạm trong cùng bong bóng rồi quay về lời của ngày.
- **Ghi chú tự lưu** (`NoteSheet`): không có nút Lưu; lưu sau khi ngừng gõ 400ms, khi rời ô và khi đóng bảng. Bảng chỉ nạp lại nội dung từ DB lúc vừa mở, nên lúc đang gõ DB cập nhật không ghi đè chữ.
- **Lời cây nói của ngày** (`DayRecord.speech`, `content/sayings.ts`): mỗi ngày cây nói một câu suốt cả ngày (`data-kind="daily"`, tối đa 3 dòng, mặt `talk`). Lần đầu mở Hôm nay mà ngày chưa có `speech` (ngày mới hoặc bản ghi cũ), `TodayScreen` chọn ngẫu nhiên bằng `pickSaying` (`COMMON_SAYINGS` + `species.sayings`) rồi lưu qua `setDaySpeech` (chỉ hôm nay, cắt khoảng trắng, tối đa `SPEECH_MAX` = 100). Đã có `speech` (kể cả `''`) thì không chọn lại; rỗng thì bong bóng mờ `Chạm để viết lời cây nói ✎` (`data-empty`). **Chạm bong bóng** (nút `Sửa lời cây nói`) thì thành ô `Lời cây nói` ngay tại chỗ (viền hồng): Enter/rời ô lưu, Shift+Enter xuống dòng, Escape huỷ; trong lúc sửa câu tạm không chen vào. **Nút ẩn/hiện** tròn ở góc phải trên khung trời (icon `speech`, nhãn `Ẩn lời cây nói` / `Hiện lời cây nói`, setting `showPlantSpeech`, mặc định bật, có trong sao lưu; giữ state cục bộ, chưa đọc xong setting thì chưa hiện bong bóng để khỏi nháy). Đang ẩn thì câu khen/chạm vẫn hiện tạm. Ngày tiết kiệm năng lượng: không có lời của ngày, không có nút ẩn/hiện. **Ghi chú chỉ để lưu thông tin**: bảng ghi chú không còn công tắc `Cây nói ghi chú` (setting `plantSaysNote` cũ bỏ, file sao lưu cũ có nó vẫn khôi phục được).
- **Nhắc việc** (spec `docs/superpowers/specs/2026-10-05-reminders-design.md`; `domain/reminderService.ts`, `reminderView.ts`, `screens/RemindersScreen.tsx`): danh sách việc dài hạn chưa cần làm ngay, **không có hạn chót**, xếp theo thứ tự thêm. Mở từ **nút chuông cuối hàng nút dưới chậu ở màn Hôm nay** (`IconButton` nhãn `Nhắc việc`, icon `bell`, bấm được cả ngày nghỉ): `TodayScreen` hiện `RemindersScreen` thay chỗ màn Hôm nay (nút `Quay lại Hôm nay`; Back Android lớp `screen` về Hôm nay). Màn con nằm trong tab Hôm nay nên bấm lại tab Hôm nay không thoát nó (giống màn Mẫu trong Cài đặt); E2E về bằng nút `Quay lại Hôm nay`. Cài đặt không còn thẻ Nhắc việc. Đầu màn là thẻ `reminders-hero` (nền gradient mint→lavender): chuông chibi `BellBuddy` (ngủ `data-mood="sleep"` khi chưa có việc, cười khi có; lắc khi bật Hôm nay) + 2 số `rem-stat-active` (đang theo dõi) / `rem-stat-done` (xong tuần này). Mỗi việc là một **thẻ sticker** màu xoay vòng peach → mint → butter → lavender (`data-tone`), nảy nhẹ khi xuất hiện: ô tick `Hoàn thành nhắc: <việc>`, chữ (chạm để sửa, ô `Sửa việc nhắc`), rồi **cùng hàng** là nút tròn chỉ có icon **☀** (`role="switch"` `Thêm vào hôm nay: <việc>`, tắt = nét đứt mờ, bật = vàng + chấm xanh ở góc; state cục bộ; chú thích trong thẻ hero vẫn ghi ☀ Hôm nay) và × xoá có xác nhận. Mục `Đã hoàn thành tuần này` (viền xanh nét đứt, huy hiệu `rem-done-count`; từ 4:00 thứ Hai, `doneThisWeek`), bỏ tick bằng `Bỏ hoàn thành nhắc: <việc>`.
  - **Bật Hôm nay:** thêm ngay vào **cuối buổi Sáng** hôm nay (nếu chưa xong và hôm nay chưa có todo cùng `reminderId`; hôm nay chưa có bản ghi thì chỉ đặt cờ). `ensureToday` thêm lại mọi việc `autoToday && doneAt === null` mỗi ngày mới (sau mẫu và việc đã lên lịch), nên chưa xong thì mai lại có; ngày cũ đã khoá giữ nguyên. **Tắt:** gỡ todo chưa xong khỏi hôm nay.
  - **Đồng bộ hai chiều** qua `Todo.reminderId`: tick/bỏ tick ở Hôm nay ↔ `doneAt` của việc nhắc; tick ở Nhắc việc mà việc đang ở hôm nay thì tick luôn todo (cây lớn); sửa chữ một bên thì bên kia (chỉ hôm nay) đổi theo; **xoá ở Hôm nay tự tắt Hôm nay**; xoá việc nhắc gỡ todo chưa xong ở hôm nay (todo đã xong giữ lại). Todo có `reminderId` hiện icon `bell` trước chữ.
  - Đồng bộ chạy trong `mutateDay(deps, date, kind, fn, sync)`: `sync` chạy trong cùng transaction `[days, reminders]` sau khi lưu ngày; chỉ được đụng 2 bảng đó.
- **Thói quen** (spec `docs/superpowers/specs/2026-10-08-habits-design.md`; `domain/habitService.ts`, `habitReport.ts`, `components/HabitStrip.tsx`, `HabitReport.tsx`, `HabitForm.tsx`, `screens/HabitsScreen.tsx`): việc lặp lại theo thứ, **điểm danh riêng, không phải todo** (không làm cây lớn theo tỉ lệ việc). Mỗi thói quen có tên, icon, màu và các thứ trong tuần (`weekdays`, `WeekdayPicker` dùng chung với form Mẫu, class `weekday-picker__day`). **Chỉ tick được hôm nay** (mốc 4:00); ngày tiết kiệm năng lượng không tính (không hiện chip, không vào mẫu số). Đổi lịch tính lại cả quá khứ theo lịch mới, nhưng lần tick cũ vẫn là `done`. Ô tính theo `startDate` (ngày tạo), trước đó bỏ qua.
  - **Dừng / Tiếp tục** (`stopHabit` / `resumeHabit`): không phải xoá. `Habit.pauses` = các khoảng `{ from, to }` (`from` tính, `to` = ngày tiếp tục, không tính; `to: null` = đang dừng; `stoppedSince`). Ngày trong khoảng dừng không có lịch (`isScheduled`) → ô `off`, không tính bỏ lỡ; tick cũ giữ. Dừng/tiếp tục tính từ hôm nay; dừng rồi tiếp tục trong ngày không để lại khoảng; dừng lại đúng ngày vừa tiếp tục thì nối khoảng cũ. Báo cáo bỏ thói quen đã dừng hẳn từ trước kỳ (`stoppedSince <= from`). Màn quản lý: thẻ đang làm có 3 nút tròn **chỉ icon** cùng hàng với tên (`habit-card__btn` 36px: bút chì `pencil` `Sửa: <tên>`, `pause` `Dừng: <tên>`, X `remove` `Xoá: <tên>`; `ConfirmButton` nhận `icon`; đang hỏi xác nhận xoá thì hàng nút xuống dòng riêng), thói quen đã dừng nằm ở mục `habits-stopped` `Đã dừng` (thẻ nét đứt, `Đã dừng từ dd/mm`, nút ▶ `play` `Tiếp tục: <tên>` + X). Mọi thói quen đã dừng thì Hôm nay chỉ hiện chip `Thêm thói quen`, mở **danh sách** (`'list'`).
  - **Hôm nay:** dải chip `habit-strip` ngay dưới Mục tiêu (ẩn được bằng công tắc `Hiện thói quen ở màn Hôm nay` trong thẻ **Thói quen** của Cài đặt, setting `showHabitStrip`, mặc định bật, có trong sao lưu; tắt thì ẩn cả chip `Thêm thói quen`, chưa đọc xong setting thì chưa hiện; Khu vườn/báo cáo/màn quản lý không đổi), mỗi chip là nút tròn `role="switch"` `Thói quen: <tên>` (state cục bộ, optimistic; đổi ngày thì reset theo ngày mới); tick thì cây cười. Chưa có thói quen nào thì chỉ hiện chip ＋ `Thêm thói quen`: bấm gọi `requestHabitManager('add')` rồi sang Khu vườn → tab Thói quen → màn quản lý **ở chế độ thêm** (form đã mở); chip ＋ cuối dải (đã có thói quen) gọi `requestHabitManager('list')`; Hôm nay luôn truyền thêm nơi mở `'today'` (`requestHabitManager(mode, 'today')`), `GardenScreen` `peekHabitManagerOrigin()` trong initializer rồi Back (nút và Back Android, cùng `leaveManager`) gọi `nav('today')` với nhãn `Quay lại Hôm nay` (`HabitsScreen backLabel`); mở từ Khu vườn thì Back về Khu vườn (tab Thói quen). `GardenScreen` `peek` cờ trong initializer của `useState` (`managing: false | 'list' | 'add'`; StrictMode gọi initializer hai lần) và `take` (xoá) trong effect lúc mount; nút `＋ Thói quen đầu tiên` ở trạng thái trống của báo cáo cũng mở chế độ thêm (`HabitsScreen startAdding`). Trạng thái trống có hình cây ngủ (`habit-empty-art`). Khu vườn chưa đọc xong setting `gardenView` thì chỉ vẽ tiêu đề + công tắc, chưa vẽ thân màn (khỏi nháy màn Cây). `HabitForm` chặn nộp hai lần khi đang lưu.
  - **Côn trùng thưởng** (`content/bugs.tsx`): ngày làm đủ thói quen (`perfectHabitDays(deps, from, to)` = "Ngày trọn vẹn" của báo cáo: ≥ 1 thói quen có lịch và mọi thói quen có lịch đều tick; ngày nghỉ không tính) thì một côn trùng chibi lượn cạnh mặt cây. **10 loài**: thường gặp `ladybug` Bọ rùa 5, `butterfly` Bướm 4, `bee` Ong 4, `caterpillar` Sâu xanh 4 (treo tơ đung đưa), `ant` Kiến 4 (cầm lá làm dù); hiếm `firefly` Đom đóm 2, `beetle` Bọ cánh cam 2, `cricket` Dế mèn 2; rất hiếm `dragonfly` Chuồn chuồn 1, `luna-moth` Bướm trăng 1 (số là `weight`, chỉ dùng để chia con **trong** nhóm và cho ngày cũ); `rarity` `common` Thường gặp / `rare` Hiếm / `epic` Rất hiếm. **Con của ngày được bốc thật rồi lưu** ở `DayRecord.bugId` (spec `docs/superpowers/specs/2026-10-09-bug-streak-odds-design.md`): `ensureDayBug(deps, date, BUGS)` (`domain/habitService.ts`, chỉ cho hôm nay; `TodayScreen` gọi khi hôm nay vừa làm đủ mà chưa có `bugId`) bốc **một lần** bằng `deps.rng`; bỏ tick thì ẩn, tick lại hiện đúng con cũ. **Tỉ lệ tăng theo chuỗi** (`domain/bugOdds.ts`): gốc `BASE_ODDS` Hiếm 6/29 ≈ 20,7%, Rất hiếm **2%**; mỗi ngày làm đủ liên tiếp trước hôm nay +`STEP` 1% cho mỗi nhóm (`streakBonus`, đi lùi từ hôm qua): gặp nhóm nào thì bộ đếm nhóm đó dừng (hai bộ đếm riêng), **ngày bỏ lỡ (có thói quen có lịch mà không làm đủ) làm đứt cả hai**, ngày không có lịch / ngày nghỉ bỏ qua; `bugOdds` chặn tổng ≤ 100% (Rất hiếm ưu tiên); `rollBug`: số ngẫu nhiên thứ nhất chọn nhóm (`pickTier`), thứ hai chọn con trong nhóm theo `weight`. Bộ đếm suy từ lịch sử (`habitDayStatus` + `bugId` các ngày), không lưu riêng; **không hiện tỉ lệ cho người dùng**. Đọc con của ngày luôn qua `dayBugId(record, date, todayKey, BUGS)`: có `bugId` thì lấy; ngày đã qua chưa có (dữ liệu trước bản này) thì theo cách bốc sẵn cũ `legacyBugFor` (băm khoá ngày) / `bugFor(date)`; hôm nay chưa bốc → không có. `bugId` có trong sao lưu (tuỳ chọn), không tăng `SCHEMA_VERSION`. **Con hiếm trông khác**: `BugAura` sau côn trùng (hiếm = quầng tím thở, `bug-aura` `data-rarity`; rất hiếm = quầng vàng + 4 sao lấp lánh `bug-sparkles`), rất hiếm bay vào ở Hôm nay để lại vệt kim tuyến (`bug-trail`). **Khung báo ở Hôm nay** (`bug-visit`, `data-kind`, ~5 giây, chỉ khi vừa chuyển sang làm đủ lúc màn đang mở): `bugVisitKind(bug, metBefore)` = `new` nếu loài chưa ghé ngày nào trước hôm nay (`Gặp bạn mới: <tên> (hiếm)!` + gợi ý xem bộ sưu tập), không thì `rare` / `epic` (`<tên> hiếm ghé thăm!` / `rất hiếm`), con thường không báo; khung nằm đúng chỗ bong bóng lời cây nói (bong bóng tạm ẩn) để không che cây, màu theo độ hiếm. Bảng chi tiết ngày ghi độ hiếm trong ngoặc cho con hiếm / rất hiếm. **Thẻ `Côn trùng đã gặp`** (`components/BugCollection.tsx`, `bug-collection`, dưới báo cáo ở Khu vườn → Thói quen; ẩn khi chưa có thói quen): `countBugs` trên mọi ngày làm đủ từ `startDate` sớm nhất tới hôm nay, pill `n/10`, mỗi loài một ô `bug-<id>` (`data-met`): đã gặp = hình + tên + `×N` + độ hiếm (Rất hiếm viền vàng), chưa gặp = ô nét đứt `?` / `???` nhưng vẫn ghi độ hiếm. Đếm theo `dayBugId` của các ngày làm đủ; ngày làm đủ suy từ lịch sử nên xoá thói quen / đổi lịch thì số có thể đổi. `PlantScene` nhận `bugId` (chỉ vẽ khi `mode === 'plant'`, `data-testid="habit-bug"` `data-bug`) + `bugEntrance` (bay vào bằng motion, chỉ ở Hôm nay); vị trí `bugSpot(faceAnchor)` phía trên bên phải mặt, phóng `BUG_SCALE` 1,4, kẹp trong khung; cánh vỗ / lượn bằng `<animateTransform>` (tắt khi giảm chuyển động). Hiện ở **Hôm nay** (bỏ tick thì bay đi), **ô Lịch** (`DayCell`/`MiniPlant` `bugId`) và **bảng chi tiết ngày** (dòng `<Tên> ghé thăm vì bạn làm đủ mọi thói quen`). Soát hình: `BugGallery` trong `src/dev/ArtGallery.tsx`. Thêm con mới: thêm vào `BUGS` + cập nhật `tests/unit/content/bugs.test.tsx`.
  - **Khu vườn:** công tắc `Cây | Thói quen` (`role="tab"`, setting `gardenView`, nhớ lại). Tab Thói quen có `Tuần | Tháng | Năm` + `Kỳ trước` / `Kỳ sau`, nút mở `HabitsScreen` (`habits-screen`, nút `Quay lại Khu vườn`, `＋ Thói quen mới`, form `Tên thói quen` / `Lưu thói quen`). **Tuần tính T2 → CN**: bảng cột tên (≤ 2 dòng) + 7 ô `habit-cell-<id>-<date>` (`data-state`) + huy hiệu ⭐ (`habit-perfect-<id>`), hàng cuối `Ngày trọn vẹn` (👑 chỉ hiện khi kỳ đã kết thúc, `to` <= hôm nay, có ≥ 1 ngày có lịch và mọi ngày có lịch đều trọn vẹn); Tháng là thẻ lưới mỗi thói quen (`habit-month-<id>`), Năm là 12 cột (`habit-year-<id>`). **4 số tổng** (`habit-stats`, một hàng): `% Đạt` = ô `done` ÷ ô có lịch (`done` + `missed` + `pending`); `Ngày trọn vẹn` = ngày có ≥ 1 ô có lịch và mọi ô có lịch đều `done`; `Tổng lần làm` = số lần tick trong kỳ; `Chuỗi dài nhất` = số ngày trọn vẹn liên tiếp dài nhất (ngày không có ô có lịch thì bỏ qua, không đứt chuỗi). E2E (`tests/e2e/habits.spec.ts`) kiểm 10 thói quen tên dài không làm bảng tuần tràn hay trang cuộn ngang ở 390px.
- **Xoá việc phải xác nhận** (`DeleteWithConfirm`, dùng ở Hôm nay và ngày tương lai): bấm `Xoá: <việc>` thì hàng hiện `Xác nhận xoá: <việc>` (nút "Xoá") và `Thôi`; chỉ nút Xoá mới xoá thật.
- **Thêm việc** (`components/InlineAdd.tsx`, dùng ở Hôm nay và ngày tương lai): không có nút ＋ nổi hay popup. Mỗi buổi có nút ＋ tròn 26px (cao bằng icon buổi để hàng không giãn, vùng chạm nới bằng `::after`; icon `plus`, nhãn `Thêm việc buổi Sáng|Chiều|Tối`) ngoài cùng bên phải hàng tiêu đề; bấm thì cuối buổi hiện **dòng việc trống** (`DraftRow`, ô `Việc mới buổi …`) đã focus. Enter: lưu rồi để trống gõ tiếp; rời ô hoặc bấm ＋ buổi khác: lưu nếu đã gõ chữ rồi đóng; Escape: đóng không lưu. **Việc rỗng không bao giờ được lưu** (cây sẽ tính sai). Bẫy Safari đã xử lý: nút ＋ chặn `mousedown` để không cướp focus (nếu không dòng cũ đóng, danh sách dịch và cú chạm trượt), mở dòng bằng `flushSync` để bàn phím iOS bật, và `onDone` chỉ đóng nếu dòng đang mở vẫn là của buổi đó. Ngày tiết kiệm năng lượng ẩn cả danh sách nên không thêm được.
- **Đổi cây & chậu** (`components/PlantPotSheet.tsx`): một nút `Đổi cây & chậu` (icon `plant-swap`) ở đầu hàng 4 nút dưới chậu (Đổi cây & chậu, Ghi chú, Ngày nghỉ, Nhắc việc) mở bảng `Đổi cây & chậu` có 2 tab **Cây → Chậu** (`role="tab"`, icon + chữ: `sprout` `Cây`, `pot` `Chậu`; tab chọn nền peach). Nội dung tab là `PlantPicker` / `PotPicker`. Mỗi lần mở về tab Cây; **ngày tiết kiệm năng lượng** nút vẫn bấm được, mở thẳng tab Chậu, tab Cây bị khoá. Màn dáng ẩn hàng tab. Chọn cây/chậu xong thì **đóng bảng**. Bảng đọc sẵn `listUnlockedStyles` cả lúc đóng (không nháy "1/3").
- **Đổi cây:** nếu đang dùng chậu mặc định của cây cũ thì chậu đổi theo cây mới; nếu người dùng đã tự chọn chậu khác thì giữ chậu đó. Chọn loài thường thì thành **cây thường** (`specialId = null`).
- **Cây đặc biệt đã mở khoá** (`domain/specialUnlocks.ts`): khi `ensureToday` tung trúng cây đặc biệt thì ghi cặp `'plantId|specialId'` vào setting `unlockedSpecials`. Mở khoá theo **đúng cặp** (Ngô · Phát sáng), không theo hiệu ứng. `listUnlockedSpecials` = setting ∪ các cặp có trong lịch sử ngày (dữ liệu trước khi có tính năng), bỏ cặp có loài/hiệu ứng đã xoá, xếp theo thứ tự nội dung. Tab Cây của bảng `Đổi cây & chậu` có mục `✨ Cây đặc biệt đã gặp` (`picker-specials`, nút `Ngô · Phát sáng`, viền vàng); chưa có thì hiện lời gợi ý 10%. `changePlant(deps, date, plantId, specialId)` từ chối cặp chưa mở khoá. Ngày tự chọn cây đặc biệt vẫn tính là ngày cây đặc biệt (✨ lịch, Khu vườn); khung ✨ giới thiệu chỉ hiện ở ngày tung trúng.
- **Dáng cây mở khoá** (`domain/styleUnlocks.ts`, spec `docs/superpowers/specs/2026-10-05-plant-styles-design.md`): mỗi loài có dáng `base` (Gốc) + 2 dáng (`PlantSpecies.styles`), mở khi loài đó **ra hoa đủ 10 rồi 20 ngày** (`bloomCounts`: `finalStage === 'bloom'` và **không** phải ngày nghỉ; tính cả ngày đặc biệt và mọi dáng). Đã mở thì giữ: `listUnlockedStyles` = setting `unlockedStyles` ∪ suy từ số ngày ra hoa **của các ngày đã qua** (đã khoá nên không tụt; hôm nay không tính vì bỏ tick làm nó tụt). Hôm nay chỉ góp khi **vừa chuyển sang ra hoa** (`mutateDay`, sau transaction): `unlockStylesFor` ghi `'plantId|styleId'` với số = ngày đã qua + 1 (không đọc lại hôm nay, nên bỏ tick ngay sau vẫn giữ); đổi loài trên ngày đã ra hoa không tính; **mỗi ngày chỉ góp một lần** (setting `styleBloomCredit` = ngày đã góp), nên bỏ tick → đổi loài → tick lại không mở thêm cho loài thứ hai. Thanh tiến độ (`styleProgress`) đếm cùng luật (chỉ ngày đã qua). `ensureToday` đọc danh sách **trước** transaction rồi random đều trong Gốc + dáng đã mở, **chỉ gọi RNG khi có ≥ 2 lựa chọn** (giữ chuỗi random cũ). Bài học: gọi hàm async lồng nhau (đọc setting, `days.each`) **bên trong** transaction rw của Dexie gây `PrematureCommitError` khi `App` và `useToday` cùng gọi `ensureToday` — đọc trước/ghi sau transaction. `changePlant(deps, date, plantId, specialId, styleId = 'base')` từ chối dáng khoá/không có. `DayRecord.styleId` (không có = Gốc); `PlantScene` nhận `styleId`, vẽ qua `getStageArt` (`content/plants/styles.ts`; `seed`/`sprout` và dáng lạ → Gốc), có `data-style`. Lịch/chi tiết ngày/Hôm nay vẽ đúng dáng của ngày; Khu vườn luôn vẽ Gốc. **Tab Cây (bảng Đổi cây & chậu):** ô loài có dáng thì có nút lá tròn ở góc (`Dáng cây: <loài> (n/3)`, icon `styles`, chấm hồng nếu hôm nay dùng dáng khác Gốc); bấm thì nội dung bảng thành **màn dáng** (`Dáng của <loài>`, nút `Quay lại chọn cây`, Back Android về lưới): dòng `Đã ra hoa N ngày`, thanh tiến độ `progressbar` `Tiến độ mở dáng` (`N/10` hoặc `N/20`), 3 ô `style-<id>`; dáng khoá là ô `is-locked` `Dáng bí ẩn` / `Ra hoa 10 ngày để mở` với `LockedStyleArt` (chậu trống + ? + ổ khoá) — **không render hình cây nào của dáng khoá**. Chọn loài ở lưới = Gốc; chọn cặp đặc biệt giữ dáng hôm nay nếu cùng loài. Hôm nay: dáng mới mở trong lúc màn đang mở → khung `style-unlock` ~5 giây (`Mở khoá dáng mới: <loài> · <dáng>!`); mở nhờ lịch sử cũ (kể cả lúc sang ngày mới) thì không mừng: chỉ mừng khoá vừa được ghi vào `unlockedStyles`. Loài chưa vẽ dáng (chưa có `styles`) thì ẩn nút dáng.
- **Ngày tiết kiệm năng lượng** (`isRestDay`): todo bị ẩn nhưng vẫn giữ, cây hiện hình hạt giống ôm gối ngủ.
- **Chào hỏi:** lần đầu trong ngày (`greetedAt === null`), App tự chuyển sang tab Hôm nay, rồi ghi `greetedAt`; câu chào chính là lời của ngày. Nếu là cây đặc biệt thì hiện thêm khung ✨ giới thiệu ~5 giây.
- **Lịch:** mỗi ô ngày mang một trạng thái (`dayCellStatus`):

  | Trạng thái | Khi nào |
  |---|---|
  | `plant` | ngày có bản ghi bình thường |
  | `rest` | ngày tiết kiệm năng lượng |
  | `missed` | không có bản ghi, nằm sau ngày dùng app đầu tiên → **cây héo** |
  | `before-start` | trước ngày dùng app đầu tiên → ô trống |
  | `today-pending` | hôm nay nhưng chưa có bản ghi |
  | `future` | ngày tương lai |

  Đi tới được tối đa **12 tháng sau** tháng hiện tại (`MAX_MONTHS_AHEAD`). **Chạm ô lịch:** ngày đã qua → `DayDetailSheet` (bảng cao, phủ gần hết màn Lịch) chỉ xem (việc chia 3 buổi `detail-section-*`, ghi chú `detail-note`); **hôm nay → chuyển thẳng sang tab Hôm nay**; **ngày tương lai → `FutureDayScreen`** (thay chỗ lưới lịch, nút `Quay lại Lịch`): bố cục giống Hôm nay (trời + chậu đứng yên, danh sách cuộn), chậu đất nung có **hạt giống bí ẩn đang ngủ** + bong bóng "Hẹn gặp bạn vào <thứ> nha!"; danh sách 3 buổi (`PlannedList`: sửa bằng chạm chữ, xoá; **không có ô tick**); nút ＋ ở mỗi buổi thêm dòng trống như Hôm nay, lưu thành việc đã lên lịch. Không có 4 nút đổi cây/chậu/ghi chú/ngày nghỉ. (`plannedService`: `addPlanned` chỉ nhận ngày **sau hôm nay**, `editPlanned`, `deletePlanned`.)  Ô có việc đã lên lịch hiện huy hiệu số việc (`planned-count`). Việc tương lai **chỉ thêm được từ Lịch** (mở ngày đó rồi bấm ＋ ở buổi).
- **Khu vườn (báo cáo)**: là **một tab** của menu nổi (icon `garden`, nhãn `Khu vườn`); màn Lịch không còn nút Khu vườn. `GardenScreen` (`data-testid="garden"`, nút `Quay lại Lịch` chuyển về tab Lịch). Chọn `Từ ngày` / `Đến ngày` (mặc định đầu tháng → hôm nay; ngược thì tự đổi chỗ) hoặc nút nhanh `Tháng này` / `30 ngày` / `Tất cả`. Vườn cỏ xanh, mỗi loài một luống (`garden-plant-<id>`, số ngày ở `.garden__count`), vẽ dạng ra hoa trong chậu mặc định; loài 0 ngày hiện mờ (`is-empty`). **Thứ tự luống** (`report.beds`): mọi luống > 0 ngày đứng trên mọi luống 0 ngày; trong mỗi nhóm: loài thường (nhiều ngày trước) → cây đặc biệt → Cây héo → Ngày nghỉ (cây thật luôn ở trên). Ngoài các loài còn có 2 luống riêng: `garden-wilted` **Cây héo** (ngày bỏ lỡ, cùng định nghĩa `missed` của ô lịch: không bản ghi, từ ngày dùng app đầu tiên tới hôm qua) và `garden-rest` **Ngày nghỉ**. Hai công tắc lọc **thu gọn mặc định** (để dành chỗ ngắm vườn): nút tròn `Tuỳ chọn hiển thị` (icon `options`, `aria-expanded`) ở cuối hàng tiêu đề xổ chúng ra ở cuối thẻ chọn ngày; mỗi lần mở màn đều thu gọn; đang lọc mà thu gọn thì nút có chấm hồng (`icon-btn__badge`). Công tắc `Chỉ hiện cây đã trồng` (`gardenOnlyPlanted`, nhớ lại, có trong sao lưu) ẩn mọi luống 0 ngày kể cả 2 luống riêng; không còn luống nào thì hiện "Chưa có cây nào trong khoảng này". Tóm tắt `garden-summary` **luôn một dòng** (`nowrap`; E2E thử số lớn nhất và đo chữ không tràn viền): `N ngày · N ra hoa · N việc · ✨ N đặc biệt`; công tắc `Tách riêng cây đặc biệt` (`gardenSeparateSpecial`) bỏ ngày đặc biệt khỏi loài thường và hiện luống `garden-special-<plant>-<special>` ("Ngô · Phát sáng", vẽ kèm hiệu ứng, viền vàng). Logic thuần ở `domain/garden.ts` (`gardenReport(records, ids, from, to, { todayKey, firstKey, separateSpecial })`): ngày tiết kiệm năng lượng **không** tính cho loài cây (đếm riêng `restDays`); loài đã xoá khỏi nội dung không có luống.
- **Nền theo giờ** (`timeOfDay`): sáng 4–11h, trưa 11–14h, chiều 14–18h, tối 18–4h.
- **Nhắc sao lưu:** khi đã quá 7 ngày kể từ lần sao lưu cuối, hoặc kể từ dữ liệu cũ nhất nếu chưa sao lưu lần nào.
- **Xoá toàn bộ dữ liệu** (`db/reset.ts` `resetAllData`, `components/ResetDataSheet.tsx`): nút đỏ nhạt `🗑 Xoá toàn bộ dữ liệu` (`btn--danger`) ở cuối thẻ Sao lưu & khôi phục, dưới vạch nét đứt. Mở bảng `Xoá toàn bộ dữ liệu?`: số liệu sẽ mất (`dataSummary`), lời nhắc sao lưu + nút `💾 Sao lưu dữ liệu`, ô `Gõ XOA để xác nhận` (tiếng Anh `DELETE`, không phân biệt hoa thường); nút `Xoá vĩnh viễn` chỉ bật khi gõ đúng, đóng bảng thì ô làm trống. Xoá cả 8 bảng và mọi setting **trong một transaction**, chỉ giữ `language`; xong thì `ensureToday` tạo ngày mới (chưa chào) và chuyển sang tab Hôm nay.
- **Ngôn ngữ** (setting `language: 'vi' | 'en'`): `resolveLang(db, todayKey)` lúc mở app: có setting → dùng; chưa có mà có ngày **trước hôm nay** (người dùng từ trước khi có song ngữ) → `vi`; không thì theo máy (`navigator.languages`: `vi*` → vi, còn lại en). Kết quả **ghi luôn** vào setting ở lần đầu (nếu không, máy mới tiếng Anh sang hôm sau sẽ có "ngày cũ" và bị đổi sang Việt), nên đổi ngôn ngữ máy sau đó không tự đổi app. `I18nProvider` (bọc `App` trong `main.tsx`) render ngay bằng gợi ý `localStorage` `goh-lang` cho khỏi nháy. Thẻ Cài đặt **`Ngôn ngữ · Language`** (dropdown **tự vẽ** `LanguagePicker`, không dùng `<select>` gốc vì phần thả xuống do hệ điều hành vẽ, lệch phong cách sticker: nút `aria-haspopup="listbox"` tên bắt đầu bằng `Ngôn ngữ · Language` + danh sách `listbox` 2 `option` `Tiếng Việt` / `English`, dòng đang chọn nền peach + ✓ vẽ bằng ảnh nền; chạm ra ngoài / Escape / Back Android (lớp `sheet`) thì đóng; phím lên/xuống/Enter) đổi ngay, ghi setting, cập nhật `<html lang>`. Không dịch dữ liệu người dùng gõ; **lời cây nói đã lưu của ngày giữ nguyên** ngôn ngữ lúc chọn. Sao lưu có `language` (tuỳ chọn): `replace` chỉ ghi khi file có (file cũ không xoá ngôn ngữ hiện tại), `merge` chỉ lấy khi máy chưa có; khôi phục xong thì lần mở app sau mới theo ngôn ngữ mới.

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
- **Mặt chibi dùng chung** (`content/Face.tsx`) có các `mood`: `normal | smile | talk | sleep | sad`. Mặt được gắn lên cây theo `faceAnchor`, nên cây dùng PNG cũng có mặt, không cần vẽ lại mặt cho từng cây.

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
  faceStyle?: 'cute' | 'cool' | 'lady';              // 'cool': kính râm + nhếch mép, không má hồng; 'lady': mi cong + môi son (ngủ/buồn vẫn mặt thường)
  styles?: PlantStyle[];                             // 2 dáng mở khoá (unlockAt 10, 20)
}
interface PlantStyle {                               // chỉ vẽ lại bud/bloom; seed/sprout dùng Gốc
  id: string; name: Localized<string>; unlockAt: number;
  stages: Record<'bud'|'bloom', Art>;
  faceAnchor: Record<'bud'|'bloom', FaceAnchor>;
  faceStyle?: FaceStyle;                             // không có = theo loài
  render: 'pixel' | 'clay';                         // chất liệu vẽ: dáng 2 Pixel, dáng 3 Đất sét (mặt + chậu vẽ theo)
}
```
**Thêm cây mới** gồm 3 bước:
1. Tạo `src/content/plants/<id>.tsx` export một `PlantSpecies`. Phần dùng chung trong `plants/parts.tsx` chỉ cho giai đoạn đầu và chi tiết nhỏ: `Seed`, `Sprout`, `LeafyStem`, `HeartLeaf`.

> **Quy tắc: mỗi loài mới phải KHÁC các loài đã có ở DÁNG (silhouette) ở giai đoạn `bud` và `bloom`**, không chỉ khác màu hay khác quả. Trước khi vẽ, đối chiếu cột *Dáng* trong bảng dưới và chọn một dáng chưa có (khối cầu, dù, cột, dây leo, bụi thấp, cây cao một bông, cụm hoa cầu…). Không tái dùng tán/thân của loài khác; nếu cần phần chung thì chỉ ở mức chi tiết (lá, hạt). Sau khi vẽ, soát bằng ảnh chụp WebKit màn **Khu vườn** (đủ mọi loài, dạng ra hoa) và lưới Lịch (dạng ra chồi): đặt cạnh nhau phải nhận ra ngay. Bài học: cam và cherry từng dùng chung tán mây tròn `Canopy` + thân `Trunk` nên trông như một, đã vẽ lại và xoá hai phần đó.

2. Thêm loài vào mảng `PLANTS` trong `src/content/plants/registry.ts`.
3. Chạy `npm test`. `tests/unit/content/plants.test.tsx` kiểm tra đủ 4 giai đoạn, chậu mặc định có tồn tại, và mỗi loài có chậu mặc định khác nhau.

Lưu ý: test này cũng cố định danh sách loài theo thứ tự, nên thêm loài thì phải cập nhật danh sách trong test (và `tests/unit/content/praises.test.ts`, `taps.test.ts`: mỗi loài cần ≥ 1 câu khen và ≥ 2 câu khi bị chạm; `sayings.test.ts`: ≥ 2 câu lời của ngày), **ở mỗi ngôn ngữ**. Tên và câu tiếng Anh viết lại theo giọng chibi + tính cách loài (xương rồng ngầu, hoa hồng quý cô), không dịch từng chữ.

Các loài hiện có:

| id | Tên | Chậu mặc định | Dáng (bud/bloom) |
|---|---|---|---|
| `sunflower` | Hướng dương | `terracotta` | thân cao, một bông tròn cánh vàng ở đỉnh |
| `corn` | Ngô | `rattan` | thân thẳng, lá dài cong rủ hai bên, bắp mũm mĩm (mang mặt) ôm hai lá bẹ, chỏm râu xoăn |
| `cactus` | Xương rồng (phong cách **ngầu**, `faceStyle: 'cool'`) | `concrete` | saguaro sa mạc: cột xanh đậm có sống dọc, tay gập góc vuông, gai kem dài, hoa đỏ trên đỉnh |
| `pothos` | Monstera (trước là Trầu bà; giữ id `pothos` để không mất dữ liệu cũ) | `mint` | bụi lá to xẻ thuỳ có lỗ trên cuống dài, xoè hình quạt |
| `orange` | Cây cam | `wood` | cây kẹo mút: thân thẳng mảnh + một khối cầu lá đậm, mép lá nhọn |
| `cherry` | Cherry | `polka` | cây dù rộng và thấp: thân chẻ đôi, vòm bông cong, quả đôi treo cuống dài |
| `rose` | Hoa hồng (phong cách **quý cô sang chảnh**, `faceStyle: 'lady'`) | `rose-porcelain` | một bông hồng nhiều lớp đội vương miện vàng lệch, cành mảnh thắt nơ satin hồng |
| `watermelon` | Dưa hấu | `tin-bucket` | dây bò lá tim xoè ngang + quả dưa giữa |
| `hydrangea` | Tulip (trước là Cẩm tú cầu; giữ id `hydrangea` để không mất dữ liệu cũ) | `blue-ceramic` | một bông tulip đỏ to mũm mĩm hình chén, mọi cánh bo tròn không mũi nhọn (mặt trên cánh trước), thân mập, hai lá to bản mũi nhọn xoè ở gốc |

**Dáng mở khoá = cùng cây, khác chất liệu vẽ** (thay hẳn 18 dáng vẽ tay cũ; Gốc giữ nguyên): mọi loài có 2 dáng, **dáng 2 `Pixel`** (mở ở 10 ngày, `render: 'pixel'`) và **dáng 3 `Đất sét` / Clay** (20 ngày, `render: 'clay'`). **Id dáng giữ như cũ** (`sunflower` `mini`/`giant`, `corn` `popcorn`/`rainbow`, `cactus` `bunny`/`barrel`, `pothos` `pole`/`trailing`, `orange` `kumquat`/`bonsai`, `cherry` `weeping`/`lantern`, `rose` `arch`/`dome`, `watermelon` `square`/`trellis`, `hydrangea` `parrot`/`bouquet`) để người đã mở khoá và `DayRecord.styleId` không mất.
- **Hình mỗi loài mô tả MỘT lần** trong `src/content/plants/styled/index.ts` bằng khối (`circle`/`ellipse`/`rect`/`poly`/`stick`, bảng màu `pal(màu, bóng?, sáng?)`), `styledPair(ids, { bud, bloom }, faceAnchor)` nặn ra cả hai bản. Lớp có `only: 'pixel' | 'clay'` (chi tiết riêng một bản), `flat` (đất sét tô phẳng), `gloss: false` (bỏ đốm bóng), `cut` (pixel: khoét trống, viền tự chạy vào, vd. khía lá Monstera).
- **Pixel** (`art/pixel.tsx`): `pixelize` đổ khối thành lưới ô `PX` = 5 đơn vị (lưới chung, gốc 0,0), tự đổ bóng mép dưới-phải / sáng mép trên-trái, viền `PIXEL_INK` quanh mọi ô, gộp ô thành `<rect>` theo hàng, `crispEdges`. **Mặt pixel** `PixelFace` là bản đồ 7 × 5 ô cùng cỡ lưới (không co theo `scale`), nên chỗ mang mặt phải rộng ≥ 35 đơn vị.
- **Đất sét** (`art/clay.tsx`): `useClay(colors)` tạo `radialGradient` sáng trên-trái cho từng màu + bộ lọc `feDropShadow` (id riêng mỗi cảnh); `clayOf` vẽ khối: bầu dục xoay viết bằng path cung (`ellipsePath`, không `transform`, để gradient luôn sáng cùng hướng), rect bo tròn, viền mảnh sẫm, `Gloss` tự thêm trên khối tròn đủ to. **Mặt đất sét** `ClayFace` (mắt hạt cườm, má loang) cùng hệ toạ độ/`scale` với mặt sticker.
- Cả hai đủ biểu cảm `normal|smile|talk|sleep|sad` + kiểu ngầu (xương rồng) / quý cô (hoa hồng). `PlantScene` theo `getStageArt(...).render`: vẽ `PixelFace`/`ClayFace`, chậu thành **`StyledPot`** (`data-testid="styled-pot"`, `data-render`, `data-pot`) cùng chất liệu nhưng **lấy màu chậu đang chọn** (`PotStyle.tint`), và gắn `data-render` lên cảnh; Gốc / seed / sprout / ngủ / héo vẫn chậu + mặt sticker.
- Soát hình: dựng trang tạm render `PlantScene` các dáng (ô cố định cỡ) rồi chụp WebKit; bài học: khe/vệt nhỏ giữa khối mất hút ở bản pixel và trông như đốm bóng ở bản đất sét, chi tiết nhận diện nên cắt từ mép (khía) hoặc đủ to; hoạ tiết 2–3 ô thì tô phẳng.

Hình dùng chung cho mọi loài: `common/SleepingSeed.tsx` (ngày nghỉ) và `common/WiltedPlant.tsx` (ngày bỏ lỡ).

### Chậu: `PotStyle`
```ts
interface PotStyle { id: string; name: Localized<string>; art: Art; tint: { body: string; rim: string; accent?: string; motif?: 'dots' | 'band' | 'heart' | 'cat' } }  // tint: màu cho chậu Pixel / Đất sét
```
**Thêm chậu mới:** vẽ component trong `src/content/pots/pots.tsx` (nên dùng `BasicPot({ body, rim, soil?, children })` cho chậu hình thang, `children` là hoạ tiết trên thân), hoặc dùng `{ image }`. Sau đó thêm một dòng vào `POTS` trong `pots/registry.ts`, **kèm `tint`** (màu thân/vành + hoạ tiết) để dáng Pixel / Đất sét vẽ được chậu cùng màu.

Chậu hiện có: `terracotta` (Đất nung, mặc định chung), `polka` (Sứ chấm bi), `mint` (Gốm mint), `rattan` (Giỏ mây), `wood` (Hộp gỗ), `pink-cup` (Cốc hồng), `rose-porcelain` (Sứ hoa hồng), `tin-bucket` (Xô thiếc), `blue-ceramic` (Gốm xanh lam), `concrete` (Bê tông), `glass-bowl` (Bể kính: bình tròn trong suốt thấy lớp đất/cát/sỏi, dùng `clipPath` có id riêng qua `useId`), `cat` (Chậu mèo: mèo mướp có tai, mặt, chân). Đủ 12 chậu; chậu mới nên khác dáng hẳn các chậu đã có.

### Hiệu ứng đặc biệt: `SpecialVariant`
```ts
interface SpecialVariant {
  id: string; name: string;
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
`components/PlantScene.tsx` vẽ theo thứ tự: Underlay → chậu (dáng Pixel / Đất sét: `StyledPot`) → cây (hoặc hạt ngủ / cây héo) + mặt → Overlay → lớp phụ (bình tưới, hiệu ứng bung lá).

Các thuộc tính để test bám vào: `data-testid` (mặc định `plant-scene`), `data-plant`, `data-pot`, `data-stage`, `data-mode` (`plant | sleeping | wilted`), `data-special`, `data-style` (`base` khi Gốc).

## Cơ sở dữ liệu (IndexedDB qua Dexie)

Tên DB: `chau-cay-chibi`, `SCHEMA_VERSION = 6` (`src/db/db.ts`).

- **v1**: bản đầu tiên.
- **v2**: thêm buổi. Bước `upgrade` gán `period: 'morning'` cho todo cũ và chuyển `items: string[]` của mẫu cũ thành `{ text, period: 'morning' }[]`.
- **v3**: thêm bảng `planned` (việc đã lên lịch cho ngày tương lai).
- **v4**: thêm bảng `plannedGoals` (mục tiêu đặt trước cho ngày tương lai).
- **v5**: thêm bảng `reminders` (việc nhắc, màn Nhắc việc).
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
interface Reminder { id: string; text: string; autoToday: boolean; doneAt: number | null; createdAt: number; updatedAt: number } // việc nhắc; autoToday = công tắc "Hôm nay"
interface Habit { id: string; name: string; icon: string; color: HabitColor; weekdays: number[]; order: number; startDate: string; pauses?: HabitPause[]; createdAt: number; updatedAt: number } // thói quen; weekdays 0 = CN … 6 = T7; startDate = ngày tạo, ngày trước đó không tính
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
menuIcon: 'auto' | 'flower' | 'cat' | 'dog' | 'grass' | 'rain' | 'gamer' | 'heart'   // icon nút menu nổi; không có = auto (theo hình nền); có trong sao lưu (gộp: chỉ lấy khi máy chưa chọn)
showCalendarBgButton: boolean                        // không có = bật
showNoteDot:  boolean                                // chấm đỏ ở ô lịch ngày có ghi chú; không có = bật
showPlantSpeech: boolean                             // hiện bong bóng lời cây nói của ngày; không có = BẬT
showHabitStrip: boolean                              // hiện dải thói quen ở màn Hôm nay; không có = BẬT; tắt vẫn vào Thói quen ở Khu vườn
language: 'vi' | 'en'                               // ngôn ngữ giao diện; không có = chưa giải lần nào (resolveLang ghi ở lần mở đầu); có trong sao lưu
gardenView: 'plants' | 'habits'                    // công tắc Cây | Thói quen của Khu vườn; có trong sao lưu (gộp: chỉ lấy khi máy chưa có)
gardenOnlyPlanted: boolean                           // Khu vườn chỉ hiện luống > 0 ngày; không có = TẮT
gardenSeparateSpecial: boolean                       // Khu vườn tách ngày cây đặc biệt thành luống riêng; không có = TẮT
unlockedSpecials: string[]                           // cây đặc biệt đã tung trúng, 'plantId|specialId'; có trong sao lưu (gộp = hợp hai danh sách)
unlockedStyles: string[]                             // dáng cây đã mở (đủ ngày ra hoa), 'plantId|styleId'; có trong sao lưu (gộp = hợp)
styleBloomCredit: string                             // ngày đã góp vào mở dáng (mỗi ngày một lần); không có trong sao lưu
// mọi công tắc bật/tắt liệt kê ở BOOLEAN_SETTINGS (db/settings.ts): backup tự sao lưu/khôi phục theo danh sách này
```

- **Ảnh lưu dạng `ArrayBuffer`, không dùng `Blob`**, vì IndexedDB của Safari xử lý Blob không ổn định.
- **Mọi thao tác sửa một ngày đi qua `mutateDay`** trong `dayService`. Hàm này kiểm tra khoá ngày, sắp xếp và đánh số lại `order`, tính lại `finalStage`, cập nhật `updatedAt`, tất cả trong một transaction.
- **Khi đổi cấu trúc dữ liệu:** thêm `this.version(2).stores(...).upgrade(...)` và tăng `SCHEMA_VERSION`. **Không sửa `version(1)`.**

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
  "language": "vi",                               // tuỳ chọn; file cũ không có
  "menuIcon": "auto"                              // tuỳ chọn; file cũ không có
}
```

File thiếu `planned` (phiên bản 1–2), `plannedGoals` (phiên bản 1–3) hoặc `reminders` (phiên bản 1–4) được coi là `[]`; khi gộp, việc nhắc theo `id`, bản `updatedAt` lớn hơn thắng; todo giữ `reminderId`; khi gộp, việc đã lên lịch chỉ được thêm nếu chưa có `id`. File phiên bản 1 vẫn khôi phục được: todo thiếu `period` được gán `'morning'`, mẫu có `items` dạng chuỗi được chuyển thành `{ text, period: 'morning' }`.

Thói quen (v6): file phiên bản 1–5 thiếu `habits` / `habitChecks` được coi là `[]`; khi gộp, thói quen theo `id` (`updatedAt` lớn hơn thắng), lần tick theo cặp `[habitId+date]` (hợp hai bên), rồi **bỏ tick mồ côi** (trỏ tới thói quen không còn); `gardenView` chỉ lấy khi máy chưa có.

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
- **Màu** (CSS variables trong `src/app/theme.css`):
  - peach `#FFD6DE`
  - mint `#CDEFE3`
  - butter `#FFF1C1`
  - lavender `#E3D9FF`
  - sky `#D4ECFF`
  - chữ cocoa `#5B4636`
- **Font:** Baloo 2 (tiêu đề) và Quicksand (nội dung), tự host qua `@fontsource` để chạy offline. Không gọi mạng lúc chạy; mọi file đều được precache bởi Workbox.
- **Màn Hôm nay:** cao đúng bằng khung app (`overflow: hidden`); **trời + cây đứng yên, chỉ `.today__list` tự cuộn** (chừa `padding-bottom` cho nút menu). Việc đã xong: chữ nhạt + dấu ✓, **không gạch ngang**. Nửa trên là bầu trời cao `46dvh`. `.sky__content` là khung flex dọc, `.today__stage` có `flex: 1 1 0; min-height: 0`, SVG cây được **định vị tuyệt đối** trong stage.
  - **Cài đặt, card "Lịch"**: hàng `settings__pickers` gồm bộ chọn hình nền (`Hình nền`) và **bộ chọn icon nút menu** (`MenuIconPicker`, nút `Đổi icon nút menu (đang dùng: …)` mở BottomSheet radiogroup `Icon nút menu`, 8 lựa chọn (lưới 4×2), `Theo hình nền` có đĩa nét đứt) đứng cạnh nhau, + 2 công tắc (`components/SettingSwitch.tsx`, giữ state cục bộ, `defaultOn` cho setting chưa lưu; CSS `.switch-row` ở `theme.css`): `Hiện nút đổi hình nền ở trang Lịch` (`showCalendarBgButton`) và `Hiện chấm đỏ ở ngày có ghi chú` (`showNoteDot`, ô lịch có `note-dot`). Cả hai mặc định bật và có trong file sao lưu.
  - **Nút tròn (`<button>` có `width`/`height` cố định) phải đặt `padding: 0`**: một số bản Safari gán padding ngang lớn cho `<button>`, làm nút trong hàng flex nở thành hình bầu dục và đẩy icon sang phải. Test E2E `nút tròn vẫn tròn…` giả lập trường hợp này.
  - **Không dùng `height: 100%` + `width: auto` cho SVG**: Safari tính sai và đẩy hàng nút dưới chậu ra khỏi khung.
- **Điều hướng = menu nổi** (`app/TabBar.tsx`): không còn thanh tab ở đáy. Chỉ có một nút tròn cố định ở góc phải dưới, có mặt ở cả 4 màn. Icon của nút (`MenuIcon kind`, tự vẽ trong `icons.tsx`) chọn được ở Cài đặt (setting `menuIcon`: `auto` = **Theo hình nền**, mặc định; hoặc `flower`/`cat`/`dog`/`grass`/`rain`/`gamer`/`heart`; `heart` = **Trái tim** chibi, không gắn hình nền nào nên chỉ chọn riêng); `resolveMenuIcon` (`domain/menuIcon.ts`) đổi lựa chọn + `calendarTheme` thành icon, `App` lấy qua `useMenuIcon()` rồi truyền `icon` vào `TabBar`. Theo nền: `default`/`photo` → bông hoa (`data-icon="menu"`), `cat` → chân mèo, `dog` → chân cún, `grass` → cỏ ba lá, `rain` → mây mưa, `gamer` → tay cầm pixel (`data-icon="menu-<kind>"`). Thêm hình nền mới thì nhớ vẽ icon menu cho nó. Bấm vào thì dải 4 tab (Lịch, Hôm nay, Khu vườn, Cài đặt; `Tab = 'calendar' | 'today' | 'garden' | 'settings'`) **trượt từ nút ra bên trái** (`clipPath` + các tab hiện lần lượt, tab gần nút hiện trước), nút chuyển thành ✕; bấm lần nữa thì trượt ngược về. Mặc định thu gọn khi mở app. **Chọn tab không đóng dải tab; chạm ra ngoài menu thì dải tự thu** (cú chạm vẫn tới chỗ được chạm; test E2E dùng helper `closeMenu`). `--tabbar-h` (60px) là cỡ nút menu.
- **Ủng hộ tôi** (cuối Cài đặt, `SupportCard`; dữ liệu ở `content/support.ts`): ảnh VietQR TPBank `public/support/qr-tpbank.jpg` (cắt từ ảnh gốc, đã kiểm tra quét được), nút `Lưu mã QR` (qua `shareOrDownload`, vì không thể quét mã trên chính màn hình điện thoại) và link `Ủng hộ qua PayPal` → `https://paypal.me/dattruong92`. Workbox precache thêm `jpg` để mã QR xem được khi offline.
- **Phiên bản & cập nhật:** Cài đặt hiện `Phiên bản <sha7> · <giờ build>` (app Android thêm `· Android`) (`__APP_VERSION__`/`__BUILD_TIME__` gắn trong `vite.config.ts`, CI dùng `GITHUB_SHA`). `main.tsx` gọi `registration.update()` mỗi khi app hiện lại (`visibilitychange`) và mỗi 30 phút, để PWA trên iPhone nhận bản mới mà không cần đóng hẳn app.
- **Chuyển tab không có hiệu ứng** (theo yêu cầu): `App` render thẳng màn của tab, đổi ngay.
- **Đóng bảng (`BottomSheet`)**: nút X (icon `close`, `aria-label="Đóng"`) ở góc phải trên hàng tiêu đề (`.sheet__head`) như cửa sổ Windows; không còn nút chữ "Đóng" ở đáy. Chạm nền mờ cũng đóng.
  - `BottomSheet` render qua **portal vào `<body>`**: màn Lịch đặt `position: relative` cho mọi con trực tiếp (`.screen--calendar > :not(.bg-scene)`), trước đây làm bảng mất `position: fixed` và nằm cuối trang. Đừng bỏ portal.
  - `tall`: bảng phủ gần hết màn hình (chừa 48px + safe-area ở trên), tiêu đề + X đứng yên, chỉ `.sheet__body` cuộn. Dùng cho `DayDetailSheet` (chạm ngày đã qua).
- **Icon:** không dùng emoji cho icon chức năng; dùng bộ SVG tự vẽ trong `components/icons.tsx` (khung 32×32, viền cocoa, màu pastel, `data-icon` để test). Hiện có: `calendar`, `sprout`, `garden`, `gear` (4 tab), `clipboard` (chưa dùng), `menu`, `close`, `plus` (nút ＋ mỗi buổi, nền `--butter` giống nút bông hoa), `back`, `plant-swap`, `pot`, `note`, `sleep-seed` (hạt giống đội mũ ngủ), `sun` (nút dưới chậu; ngày nghỉ đổi `sleep-seed` → `sun`), `styles` (ba lá xoè quạt, nút dáng trong bảng Đổi cây & chậu), `habits`, `pencil` / `pause` / `play` / `remove` (nút thẻ thói quen), `bell` (chuông nhỏ trước chữ của việc đến từ Nhắc việc), `period-morning` / `period-afternoon` / `period-evening` (dùng qua `<PeriodIcon period>` ở mọi chỗ hiện buổi: Hôm nay, ngày tương lai, thẻ mẫu, bảng chi tiết). Ô đánh dấu việc trong bảng chi tiết là `.detail__check` tự vẽ, không dùng emoji ✅/⬜. `IconButton` nhận `icon: ReactNode`.
- **Hình nền Lịch** (`BackgroundPicker`, radiogroup `Hình nền lịch`, setting `calendarTheme`: `default | cat | dog | grass | rain | gamer | photo`). Trên màn Lịch có **một nút tròn icon xem trước** (ẩn được bằng công tắc `Hiện nút đổi hình nền ở trang Lịch` trong Cài đặt, setting `showCalendarBgButton`, mặc định bật, có trong file sao lưu) (không chữ, nhãn `Đổi hình nền lịch (đang dùng: …)`) mở BottomSheet 7 lựa chọn (lưới 3 cột), chọn xong tự đóng; cùng bộ chọn có trong Cài đặt:
  - `cat` = **Mèo vươn vai** (`components/backgrounds/CatStretchScene.tsx`): nền pastel, mèo chibi duỗi người ở góc trái dưới (nâng lên `CAT_LIFT` 72 để không sát thanh Home), đuôi ve vẩy, tim bay lên (vị trí tim đặt ở `<g>` bao ngoài vì transform của keyframes đè transform của chính phần tử).
  - `dog` = **Cún vẫy đuôi** (`DogWagScene.tsx`): trời nắng vàng bơ → peach, mặt trời tia xoay chậm, đồi cỏ mint; **Corgi chibi nhìn nghiêng sang trái, thân nằm ngang như con mèo** (component `Corgi`; không vẽ cún nhìn thẳng): thân ngắn mũm mĩm, chân ngắn đi tất trắng, tai to dựng **vẽ trước đầu để chân tai chìm vào đầu** (vẽ đè lên thì tai trông rời rạc), mõm kem, vòng cổ đỏ + thẻ vàng, mông tròn mảng kem, đuôi cụt. Nằm giữa dưới nút đổi nền (x ~125–260, chừa góc phải dưới cho nút menu nổi; E2E kiểm cún nằm dưới nút đổi nền và bên trái nút menu), nâng `DOG_LIFT` 72 như mèo; đuôi cụt vẫy, đầu nghiêng, tai giật, chân trước nhún (`dog-leg`), bóng đỏ nảy trước mũi, dấu chân hiện rồi mờ trên cỏ. Ô xem trước là đầu Corgi nhìn nghiêng đeo vòng cổ đỏ. (Đã thử Shiba nhìn thẳng và Samoyed cục bông trắng; chủ repo chọn Corgi.)
  - `grass` = **Cỏ nở** (`GrassBloomScene.tsx`): nền xanh, **chu kỳ 10s**: cỏ mọc lên, đung đưa, hoa nở, thu lại, mọc lại.
  - `rain` = **Mưa chill** (`RainChillScene.tsx`): cửa sổ đêm mưa xanh tím, giọt nước chảy trên kính, nến + tách trà bốc khói.
  - `gamer` = **Gaming pixel** (`PixelGamingRoomScene.tsx`): phòng gaming vẽ kiểu pixel trên lưới 130×282 (1 ô = 3px, `shapeRendering=crispEdges`), hiệu ứng `steps()` như game cổ: LED/bàn phím/tai nghe đổi màu, sao nhấp nháy, nhân vật trên màn hình nhảy, chữ màn phụ chạy, quạt case nháy, cô gái nhún đầu. Góc bàn máy đặt sát đáy để lộ ra dưới thẻ lịch.
  - Nền động vẽ bằng SVG khung 390×844 (`preserveAspectRatio="xMidYMax slice"`) + keyframes trong `backgrounds.css`; tắt chuyển động khi `prefers-reduced-motion`.
  - `photo` = ảnh **hoặc nền động** của người dùng (`calendarBg`, ô chọn `accept="image/*,video/*"`, `prepareBackground` trong `utils/image.ts`). Ảnh tĩnh nén JPEG; GIF và video (mp4, mov) lưu nguyên tệp vì nén qua canvas làm mất chuyển động, tối đa `MAX_ANIMATED_BG_BYTES` 25 MB (quá thì báo lỗi). GIF làm `background-image`; video phát bằng `<video data-testid="calendar-video">` trong lớp `bg-scene` (autoplay + muted + loop + playsInline, bắt buộc để Safari iOS tự phát; giảm chuyển động thì không tự phát). Bản cũ chưa có `calendarTheme`: có ảnh → `photo`, không → `default` (`useCalendarTheme`). Đổi sang kiểu khác **không xoá ảnh**. `calendarTheme` có trong file sao lưu (tuỳ chọn).
- **Màn Lịch:** căn giữa theo chiều dọc. Khi hình nền khác `default`, thẻ tháng và lưới ngày nhận class `is-glass` (kính mờ trong suốt, `backdrop-filter`), chữ có viền sáng để dễ đọc.
- **Tôn trọng** `prefers-reduced-motion`, safe-area (`env(safe-area-inset-*)`) và chiều cao `100dvh`.
- **Các label và `data-testid` mà test dựa vào, không đổi tuỳ tiện** (đây là bản tiếng Việt; unit test render tiếng Việt mặc định qua `renderWithDeps(ui, deps, nav, lang = 'vi')` và E2E dùng `locale: 'vi-VN'`. Bản tiếng Anh tương ứng ở `src/i18n/en.ts`, E2E tiếng Anh ở `tests/e2e/i18n.spec.ts` với `test.use({ locale: 'en-US' })`, vd. `Open menu`, `Add morning task`, `Complete: <task>`, `Tap the plant`):
  - `Mục tiêu hôm nay` / `Mục tiêu ngày này` (placeholder `Đặt mục tiêu cho hôm nay…` / `…cho ngày này…`), `Quay lại Lịch`, `Thêm việc buổi Sáng|Chiều|Tối` (nút ＋ mỗi buổi), ô `Việc mới buổi Sáng|Chiều|Tối` (dòng trống), `Hoàn thành: <việc>`, `todo-section-morning|afternoon|evening`
  - Form mẫu: `Việc buổi Sáng|Chiều|Tối (mỗi dòng một việc)`
  - Menu nổi: nút `Mở menu` / `Đóng menu` (`aria-expanded`), dải `#fnav-tabs` với 4 nút tab (`aria-current="page"` cho tab hiện tại). Test E2E chuyển tab bằng helper `goTab(page, 'Lịch')`; mở màn Mẫu bằng `openTemplates(page)` (Cài đặt → `Quản lý mẫu`), màn Nhắc việc bằng `openReminders(page)` (Hôm nay → nút `Nhắc việc`).
  - `Đổi cây & chậu` (nút + tiêu đề bảng; tab `Cây` / `Chậu`), `Ghi chú`, `Ngày tiết kiệm năng lượng` / `Thức dậy`, `Nhắc việc`
  - `Quản lý mẫu`, `Quay lại Cài đặt`, `＋ Mẫu mới`, `Tên mẫu`, `Đặt làm mặc định: <tên>`
  - `💾 Sao lưu dữ liệu`
  - Ngày tương lai: `future-day`, nút `Quay lại Lịch`, `Thêm việc buổi …`, `Sửa việc`, `Xoá: <việc>`, `planned-count` (ô lịch)
  - Nhắc việc: nút chuông `Nhắc việc` (màn Hôm nay), `Quay lại Hôm nay`, `＋ Việc nhắc mới`, ô `Việc nhắc mới`, `Hoàn thành nhắc: <việc>`, `Bỏ hoàn thành nhắc: <việc>`, `Thêm vào hôm nay: <việc>`, `Sửa việc nhắc`, `reminders`, `reminders-active`, `reminders-done`, `reminder-<id>`, `reminders-hero`, `rem-stat-active`, `rem-stat-done`, `rem-done-count`
  - Thói quen: `Thói quen: <tên>`, `Sửa: <tên>`, `Dừng: <tên>`, `Xoá: <tên>`, `Tiếp tục: <tên>`, `habits-stopped`, `Thêm thói quen`, `Quản lý thói quen`, `Quay lại Khu vườn`, `＋ Thói quen mới`, `＋ Thói quen đầu tiên`, `Tên thói quen`, `Lưu thói quen`, tab `Cây` / `Thói quen`, `Tuần` / `Tháng` / `Năm`, `Kỳ trước` / `Kỳ sau`, `habit-strip`, `habit-report`, `habit-cell-<id>-<date>` (`data-state`), `habit-perfect-<id>`, `habit-stats`, `habit-month-<id>`, `habit-year-<id>`, `habits-screen`
  - `day-YYYY-MM-DD` (+ `data-status`), `calendar-card`, `calendar-head`, `speech-bubble` (`data-kind` `daily|praise|tap`), `Sửa lời cây nói`, `Lời cây nói`, `Ẩn lời cây nói` / `Hiện lời cây nói`, `special-intro`, `rest-message`, `habit-bug` (`data-bug`)
  - Dáng cây: `Dáng cây: <loài> (n/3)`, `Dáng của <loài>`, `Quay lại chọn cây`, `style-<id>` (`style-base`), `locked-style-art`, `Dáng bí ẩn`, `Tiến độ mở dáng`, `style-unlock`

## Lỗi nhỏ đã biết (chưa sửa)

- Lúc vừa qua 4:00, màn Hôm nay có thể hiện ngày cũ trong chốc lát. Nếu NoteSheet đang mở đúng lúc đó, ghi chú sẽ lưu vào ngày mới.
- `src/dev/ArtGallery.tsx` dùng lưới 4 cột không cố định cỡ ô, xem ở khổ hẹp thì các giai đoạn đầu bị bóp; muốn soát hình thì render `PlantScene` trong ô cỡ cố định.
- Để app mở qua sang tháng mới thì lịch vẫn ở tháng cũ.
- `setDefaultTemplate` / `deleteTemplate` / `file.text()` thiếu `.catch`, nên lỗi không hiện thông báo.
- Trợ năng: sửa todo bằng cách chạm vào `<span>`; BottomSheet chưa giữ focus và chưa xử lý Escape; `user-scalable=no`; chưa có cách sắp xếp lại không cần kéo thả.
- Regex ngày trong file backup chấp nhận cả ngày không tồn tại.
