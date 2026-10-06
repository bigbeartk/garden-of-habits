# App Android (Capacitor)

App Android là **cùng mã nguồn** với PWA (`src/`), được Capacitor đóng gói thành APK. Thêm tính năng
một lần là có ở cả PWA lẫn app; chỉ cần build lại APK.

## Lấy APK để cài thử

1. Push `main` → GitHub Actions chạy job `android` (song song với deploy PWA).
2. Mở https://github.com/bigbeartk/garden-of-habits/actions → chọn lần chạy mới nhất →
   mục **Artifacts** → tải `garden-of-habits-android-<số>` (file zip chứa `.apk`, và `.aab` nếu đã có khoá ký).
3. Chép `.apk` vào điện thoại, mở nó, cho phép **"Cài ứng dụng không rõ nguồn gốc"** khi được hỏi.
4. Bản sau cài đè lên bản trước, **dữ liệu giữ nguyên** (chỉ khi mọi bản ký cùng một khoá, xem dưới).

## Khoá ký (làm MỘT lần, cực kỳ quan trọng)

Android chỉ cho cài đè khi bản mới ký **cùng khoá** với bản cũ. Mất khoá = phải gỡ app = mất dữ liệu
(trừ khi đã sao lưu). Khi chưa có khoá, CI chỉ build APK *debug*: dùng thử được nhưng mỗi lần build có
khoá khác, không cài đè được.

1. Cài JDK (PowerShell): `winget install EclipseAdoptium.Temurin.21.JDK`, mở lại terminal.
2. Tạo khoá (PowerShell, ở thư mục ngoài repo, ví dụ `D:\keys`):
   ```powershell
   keytool -genkeypair -v -keystore garden-of-habits.keystore -alias garden -keyalg RSA -keysize 2048 -validity 10000
   ```
   Nhớ mật khẩu. **Cất file `.keystore` + mật khẩu ở 2 nơi an toàn** (ví dụ Google Drive + USB). Không commit vào repo.
3. Đổi file sang base64:
   ```powershell
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("D:\keys\garden-of-habits.keystore")) | Set-Clipboard
   ```
4. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   | Tên | Giá trị |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | chuỗi vừa chép |
   | `ANDROID_KEYSTORE_PASSWORD` | mật khẩu keystore |
   | `ANDROID_KEY_ALIAS` | `garden` |
   | `ANDROID_KEY_PASSWORD` | mật khẩu khoá (thường trùng mật khẩu keystore) |

## Ngôn ngữ

App song ngữ Việt / Anh. Máy mới: theo ngôn ngữ của máy (tiếng Việt → Việt, còn lại → Anh); đổi được ở
**Cài đặt → Ngôn ngữ · Language**. Soát tay khi đổi giao diện: máy để tiếng Anh, cài mới → app tiếng Anh;
chọn Tiếng Việt, thoát hẳn rồi mở lại vẫn tiếng Việt; nút Back và menu Chia sẻ vẫn chạy.

## Chuyển dữ liệu giữa PWA và app

Hai bên có kho dữ liệu riêng. Dùng **Cài đặt → Sao lưu dữ liệu** ở bên cũ, rồi **Khôi phục từ file**
ở bên mới (định dạng sao lưu giống hệt nhau). Trên Android, sao lưu mở menu Chia sẻ: chọn Google Drive / Tệp.

## Build trên máy (tuỳ chọn)

- `npm run build:android`: build web + `cap sync android` (không cần Android SDK).
- Muốn build APK trên máy thì cần Android Studio (hoặc SDK + JDK 21): `cd android && ./gradlew assembleDebug`.
- `npm run icons:android`: tạo lại icon + màn chờ Android từ `public/favicon.svg`.

## Checklist khi lên CH Play (chưa làm)

- Tài khoản Play Console (25 USD, một lần). Tải file `.aab` từ CI; bật **Play App Signing**
  (khoá hiện tại thành *upload key*, Google giữ khoá phát hành).
- `appId` `io.github.bigbeartk.gardenofhabits` **không đổi được** sau khi phát hành.
- Trang chính sách quyền riêng tư (app không thu thập dữ liệu, mọi thứ ở trên máy) — có thể đặt trên GitHub Pages.
- Khai báo Data safety (không thu thập/chia sẻ dữ liệu), xếp loại nội dung, ảnh chụp màn hình, mô tả.
- ⚠️ Thẻ **"Ủng hộ tôi"** (QR ngân hàng + PayPal): chính sách thanh toán của Google Play hạn chế nhận
  ủng hộ qua kênh ngoài Play Billing → bản Play có thể phải ẩn thẻ này (thêm cờ ở `src/platform`).
- `targetSdk` theo yêu cầu của Play năm đó (`android/variables.gradle`).
