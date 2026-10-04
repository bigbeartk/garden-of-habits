# Spec: App Android (Capacitor) + hỗ trợ nhiều màn hình

## Context
Garden of Habits đang là PWA cho iPhone 13. Chủ repo muốn có thêm **app Android** cho các điện thoại Android thông dụng, sau này **đưa lên CH Play để kiếm tiền**. Cả PWA lẫn app Android phải hiển thị tốt trên nhiều cỡ màn hình và nhiều máy Android.
Thiết kế đã được duyệt qua brainstorming (4 phần).

**Mục tiêu đợt này:** app Android làm được đúng như PWA, chạy offline hoàn toàn, sẵn sàng về mặt kỹ thuật để lên Play sau này. iPhone vẫn là máy ưu tiên, nên không được làm thay đổi hành vi của PWA trên iPhone.

## Các quyết định đã chốt
| Chủ đề | Quyết định |
|---|---|
| Cách làm | **Capacitor** bọc chung code React; `dist/` đóng gói sẵn trong APK, nên không cần mạng kể cả lần mở đầu tiên |
| Lý do chọn | Có plugin Play Billing và AdMob cho việc kiếm tiền sau này, plugin thông báo local, và Play đánh giá app offline đầy đủ tốt hơn app bọc web (TWA) |
| `applicationId` | `io.github.bigbeartk.garden` (**không bao giờ đổi**) |
| Tên app | `Garden of Habits` |
| Phát hành | Push tag `v*` thì CI build **APK + AAB đã ký** và đưa lên GitHub Releases. Push `main` vẫn chỉ deploy PWA |
| Dữ liệu | DB `chau-cay-chibi` trong WebView nằm riêng trên máy Android; chuyển dữ liệu từ iPhone bằng file sao lưu (định dạng không đổi) |
| Thông báo | **Không làm đợt này** (spec riêng sau) |
| Kiếm tiền, đăng Play | **Không làm đợt này** (spec riêng sau) |
| Màn hình | Điện thoại dọc mọi cỡ (rộng 320–480, cao 568–1000+) hiện đẹp; tablet/màn rộng: app là **một cột tối đa 480px căn giữa**, không vỡ giao diện |
| Xoay | Khoá dọc trên điện thoại; trên màn ≥ 600dp (Android 16 bỏ qua khoá xoay) màn ngang vẫn phải đúng |
| Cỡ chữ hệ thống | Khoá `textZoom = 100` (giống PWA trên iOS) |

## Kiến trúc

```
Một codebase React (src/) ──┬─ build "web"     → GitHub Pages (PWA, như hiện nay)
                            └─ build "android" → dist/ ─ cap sync → android/ (Gradle) → APK + AAB
```

### Lớp nền tảng `src/platform/`
Chỉ chỗ này biết app đang chạy trên web hay trong Capacitor. Màn hình và component **không import `@capacitor/*` trực tiếp**.

| Hàm / hook | Web (PWA) | Android (Capacitor) |
|---|---|---|
| `isNativeApp()` | `false` | `true` (`Capacitor.isNativePlatform()`) |
| `saveFile(file)` | `shareOrDownload` hiện có (chuyển từ `db/share.ts`) | ghi vào thư mục cache bằng `@capacitor/filesystem`, rồi mở bảng Chia sẻ bằng `@capacitor/share`; người dùng huỷ thì ném `AbortError` như bản web |
| `openExternal(url)` | `<a target="_blank">` như hiện tại | mở bằng trình duyệt của máy (`@capacitor/browser` hoặc `App.openUrl`) |
| `useBackHandler(active, fn)` | không làm gì | đăng ký vào ngăn xếp Back (xem dưới) |
| `onResume(fn)` | `visibilitychange`/`focus` | thêm sự kiện `resume` của `@capacitor/app` |

Ở unit test, các plugin Capacitor được mock. Mặc định jsdom chạy như bản web.

### Biến build
- `VITE_TARGET=android`: `main.tsx` **không** đăng ký service worker và bỏ vòng `registration.update()`. Workbox không cần thiết vì file đã nằm trong APK.
- `VITE_PLAY_BUILD=1`: **chừa sẵn** để sau này ẩn thẻ `Ủng hộ tôi` ở bản đăng Play (VietQR/PayPal có thể vi phạm chính sách thanh toán của Play). Đợt này chỉ làm cờ và một test, chưa có bản build Play.
- Base path của bản Android là `/`.

### Thư mục và lệnh
- `capacitor.config.ts` ở gốc repo (`appId`, `appName`, `webDir: 'dist'`).
- Thư mục `android/` do `npx cap add android` sinh ra, **commit vào repo**. Mọi chỉnh sửa native (MainActivity, theme, manifest) nằm ở đây.
- Lệnh npm mới:
  - `android:build`: build web với `VITE_TARGET=android` → `cap sync android` → `gradlew assembleRelease bundleRelease`.
  - `android:run`: build + cài lên máy đang cắm (`cap run android` hoặc `adb install -r`).
- `minSdk`/`targetSdk`/`compileSdk`: theo mặc định của bản Capacitor ổn định mới nhất (đáp ứng mức targetSdk Play đang yêu cầu).

### Ký app
- Chủ repo tạo **một keystore duy nhất** (`keytool`), cất ngoài repo và sao lưu ở ít nhất hai nơi. Mất keystore thì không cài đè hay cập nhật được nữa. Khi lên Play, keystore này đóng vai **upload key** (Play App Signing).
- Máy dev: `android/keystore.properties` (đường dẫn file + mật khẩu) nằm trong `.gitignore`. Thiếu file này thì build release không ký, build debug vẫn chạy.
- CI: secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (dán qua giao diện web GitHub vì máy không có `gh`).

### CI
- Giữ nguyên `deploy.yml` (push `main` → test → build → GitHub Pages).
- Workflow mới `android-release.yml`, chạy khi push tag `v*`: Node 20 → `npm ci` → `npm test` → JDK 21 (hoặc bản Capacitor yêu cầu) + Android SDK → `android:build` → tạo GitHub Release đính kèm `garden-of-habits-<tag>.apk` và `.aab`. Quyền: `contents: write`.
- `versionName` lấy theo tag (`v1.2.0` → `1.2.0`); `versionCode` tính từ tag (`major*10000 + minor*100 + patch`) để luôn tăng.
- Dòng `Phiên bản` trong Cài đặt ở bản Android hiện thêm `versionName`.

## Hành vi riêng của Android

### 1. Nút / cử chỉ Back
Ngăn xếp xử lý trong `platform/back.ts`: `useBackHandler(active, fn)` đăng ký khi `active` là `true` và tự huỷ khi unmount hoặc khi `active` thành `false`. Bấm Back thì gọi handler đăng ký **sau cùng**; ngăn xếp rỗng thì thoát app (`App.exitApp()`).

Các chỗ đăng ký, xếp theo thứ tự lồng nhau:
| Lớp | Back làm gì |
|---|---|
| `App`, khi tab ≠ `calendar` | về tab Lịch |
| `SettingsScreen`, khi đang hiện `TemplatesScreen` | về Cài đặt |
| `CalendarScreen`, khi đang hiện `FutureDayScreen` | về lưới Lịch |
| Menu nổi đang mở | thu menu |
| `DraftRow` (dòng việc mới) đang mở | đóng, không lưu (giống Escape) |
| `BottomSheet` đang mở | đóng bảng |

Lớp nào mở sau thì đăng ký sau, nên được xử lý trước. Đợt này PWA trên Android **không** xử lý Back.

### 2. Tràn viền và vùng an toàn
- Trong CSS, thay mọi `env(safe-area-inset-*)` bằng biến `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left`, khai báo trong `:root` của `theme.css` với giá trị mặc định là `env(safe-area-inset-*, 0px)`. Trên iPhone kết quả không đổi.
- Android: `MainActivity` bật edge-to-edge, lắng nghe `WindowInsets` (`systemBars | displayCutout`, cộng thêm `ime` nếu cần cho mục 5), quy ra px CSS (chia `density`) rồi gọi JS để đặt 4 biến trên `document.documentElement.style`. Cập nhật lại khi insets đổi (xoay, đổi chế độ cử chỉ ↔ 3 nút).
- Thanh trạng thái và thanh điều hướng trong suốt, icon tối. Ở màn Hôm nay và ngày tương lai, khi trời tối (`timeOfDay` = tối) thì đổi sang icon sáng (`@capacitor/status-bar` `Style.Dark`/`Style.Light`, gọi qua `platform/`).

### 3. Chặn ép giao diện tối
Theme Android: `android:forceDarkAllowed="false"`, kế thừa theme sáng (`Theme.Material3.Light.NoActionBar` hoặc theme của Capacitor). WebView: `WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)`. Máy bật "ép giao diện tối cho mọi app" (có trên Samsung, Xiaomi, Oppo…) thì màu app vẫn giữ nguyên.

### 4. Cỡ chữ
`MainActivity`: `webView.settings.textZoom = 100`. Vẫn giữ `user-scalable=no` như bản hiện tại.

### 5. Bàn phím
- Mục tiêu: khi gõ `DraftRow`/`GoalInput`/ghi chú, ô đang gõ nằm trên bàn phím, còn trời và cây **không bị bóp méo**.
- Hướng làm: bàn phím phủ lên nội dung (`windowSoftInputMode="adjustNothing"` hoặc `@capacitor/keyboard` `resize: 'none'`), đặt `--keyboard-h` từ chiều cao bàn phím. `.today__list` và `BottomSheet` cộng `--keyboard-h` vào `padding-bottom`, ô đang focus thì `scrollIntoView({ block: 'nearest' })`.
- Kiểm chứng trên trình giả lập Android với Gboard. Nếu `adjustResize` cho kết quả tốt hơn mà không bóp trời (vì `.today` đã dùng `dvh`), được phép chọn cách đó; ghi lý do vào CLAUDE.md.

### 6. Lưu file và link ngoài
- `💾 Sao lưu dữ liệu` và `Lưu mã QR` gọi `saveFile`. Hành vi ghi nhận `lastBackupAt` giữ như hiện tại: người dùng huỷ thì không tính là đã sao lưu.
- `Ủng hộ qua PayPal` → `openExternal`.
- Khôi phục sao lưu và chọn nền ảnh/video: giữ `<input type="file">`, vì WebView của Capacitor đã hỗ trợ ô chọn file.

### 7. Vòng đời
`useNow` thêm `onResume` để cập nhật ngày ngay khi app quay lại (ngoài `visibilitychange`/`focus` sẵn có).

## Bố cục nhiều màn hình (cả PWA và Android)

### Cột app
- `.app`: `max-width: 480px; margin-inline: auto`. Ngoài cột, `body` tô nền pastel.
- Mọi phần tử `position: fixed` bám theo cột, không bám mép màn hình. Dùng biến `--col-gutter: max(0px, (100vw - 480px) / 2)`:
  - nút menu nổi / dải tab: `right: calc(var(--col-gutter) + 16px + var(--safe-right))`;
  - `BottomSheet` (portal vào `body`): `max-width: 480px`, căn giữa;
  - mọi thứ khác đang `fixed` (bong bóng, lớp phủ) rà lại theo cùng quy tắc.
- Hình nền Lịch (`bg-scene`: mèo, cỏ, mưa, gaming, ảnh/video) vẫn phủ toàn màn hình; chỉ thẻ lịch nằm trong cột.

### Khoảng điện thoại
- **Máy nhỏ** (360×640, và 320×568 ở mức không vỡ): đủ 7 cột lịch, hàng 4 nút dưới chậu nằm gọn, trời không đè danh sách, không có thanh cuộn ngang ở màn nào.
- **Máy dài** (≥ 900 cao): trời `46dvh` rất cao. **Giới hạn cỡ cây**: khung cây 200×240 tối đa khoảng 1,5 lần (con số cụ thể chốt khi soát ảnh) và đặt `max-height` cho trời, để phần còn lại dành cho danh sách việc.
- **Tablet** dọc (800×1280) và ngang (1280×800): cột 480 căn giữa, mọi màn dùng được, không có phần tử nào nằm ngoài cột.

## Kiểm thử

### Unit (Vitest, chạy trong CI)
- `platform/back.ts`: đúng thứ tự (đăng ký sau xử lý trước), huỷ khi unmount hoặc khi `active` thành `false`, ngăn xếp rỗng thì gọi thoát app.
- `platform/` chọn đúng cách lưu file / mở link theo `isNativeApp()` (mock Capacitor); bản native truyền đúng tên file và nội dung; huỷ → `AbortError`.
- Tích hợp Back: mở `BottomSheet` + Back → đóng bảng; ở Mẫu + Back → về Cài đặt; ở ngày tương lai + Back → về Lịch; ở Hôm nay + Back → về Lịch; có `DraftRow` đang mở + Back → đóng dòng, không lưu.
- `main.tsx` / cờ build: không đăng ký service worker khi `VITE_TARGET=android`; `VITE_PLAY_BUILD` ẩn `SupportCard`.

### E2E (Playwright, chạy trên máy dev)
- Projects:
  - `iphone-13` (WebKit): như hiện tại, khổ chính;
  - `android-pixel-7` (Chromium, `devices['Pixel 7']`, 412×915): khổ Android chính, đại diện máy màn dài phổ biến;
  - `android-galaxy` (Chromium 360×800, DPR 3, `isMobile`, `hasTouch`): khổ của dòng Samsung Galaxy A/S thông dụng;
  - `android-small` (Chromium 360×640);
  - `tablet-portrait` (800×1280);
  - `tablet-landscape` (1280×800).
- `tests/e2e/app.spec.ts` chạy trên `iphone-13` + `android-pixel-7`.
- File mới `tests/e2e/layout.spec.ts` chạy trên **mọi project**, gồm:
  - không có thanh cuộn ngang ở mọi màn (Lịch, Hôm nay, Khu vườn, Cài đặt, Mẫu, ngày tương lai);
  - hàng 4 nút và cây nằm gọn trong viewport;
  - cây không vượt cỡ tối đa;
  - nút menu và `BottomSheet` nằm trong cột 480;
  - đủ 7 cột lịch;
  - giả lập insets (đặt `--safe-*` như tai thỏ 48px / thanh 3 nút 48px): nút menu và hàng nút không bị che.
- Chụp ảnh mỗi màn ở mỗi khổ vào `test-results/` để soát bằng mắt.
- `PW_CHANNEL=chrome` vẫn dùng được cho các project Chromium.

### Checklist trên trình giả lập Android (`emulator` của SDK + `adb` + `chrome://inspect`)
Dùng AVD Pixel (API mới nhất, có camera đục lỗ). Nếu có máy Android thật cắm vào thì chạy thêm trên đó, không bắt buộc.
1. Cài APK release và mở khi tắt mạng.
2. Vuốt Back ở mọi màn và lớp (bảng, dòng mới, Mẫu, ngày tương lai, tab), cuối cùng thoát app.
3. Camera đục lỗ và thanh trạng thái không che nội dung; chế độ cử chỉ và 3 nút đều không che nút menu.
4. Bật tối hệ thống + ép tối (Developer options → Override force-dark): màu không đổi.
5. Cỡ hiển thị lớn nhất + cỡ chữ lớn nhất: bố cục không vỡ.
6. Thêm việc bằng bàn phím: ô gõ không bị che, trời và cây không méo.
7. Sao lưu ra Drive/Files; khôi phục từ file sao lưu của iPhone (cả Thay thế và Gộp).
8. Nền Lịch dạng video và GIF; `Lưu mã QR`; link PayPal mở trình duyệt.
9. Để app chạy qua 4:00 (hoặc đổi giờ máy): sang ngày mới khi mở lại.
10. Cài đè bản mới (tag sau): dữ liệu còn nguyên.

## Tiêu chí xong
- `npm test`, test giống CI (`TZ=UTC npx -y node@20 …`), `npx tsc --noEmit`, E2E mọi project đều pass.
- Checklist trên trình giả lập đạt cả 10 mục.
- Push tag `v1.0.0` thì GitHub Releases có APK + AAB đã ký, cài được lên trình giả lập (và máy thật nếu có).
- PWA trên iPhone không đổi hành vi: E2E WebKit pass, ảnh chụp các màn ở khổ iPhone 13 không lệch so với trước.
- CLAUDE.md cập nhật: lệnh Android, `platform/`, ngăn xếp Back, biến `--safe-*`, cột 480, ký app, quy trình phát hành.

## Rủi ro và lưu ý cho sau này
- **Keystore** là thứ duy nhất không thể làm lại; chủ repo phải sao lưu.
- **Play (spec sau):** tài khoản cá nhân mới phải chạy thử kín với ≥ 12 người trong 14 ngày; cần chính sách quyền riêng tư (app không thu dữ liệu, dễ viết), trang giới thiệu, ảnh chụp màn hình; thẻ Ủng hộ có thể phải ẩn (`VITE_PLAY_BUILD`).
- WebView trên máy rất cũ (Android 7–8, WebView chưa cập nhật) có thể thiếu `dvh`/`aspect-ratio`. Đợt này chỉ đảm bảo trên WebView được cập nhật qua Play Store; nếu `minSdk` mặc định làm lộ vấn đề thì nâng `minSdk`.
- Inset và bàn phím chỉ kiểm được trên trình giả lập/máy thật; E2E chỉ giả lập. Các bản Android tuỳ biến của hãng (One UI, MIUI/HyperOS, ColorOS…) có thể khác chút; xử lý khi có báo lỗi cụ thể.

## Không làm trong đợt này
Thông báo · kiếm tiền (quảng cáo/mua trong app) · đăng Play · Back cho PWA trên Android · bố cục tablet riêng · xoay ngang trên điện thoại · cho phóng cỡ chữ theo hệ thống · đồng bộ dữ liệu giữa máy.
