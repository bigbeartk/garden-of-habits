# Song ngữ Việt / Anh — Thiết kế

Ngày: 2026-10-06 · Yêu cầu của chủ repo: "tạo phiên bản song ngữ", để chuẩn bị đưa app lên Google Play.

## Mục đích

Người không đọc được tiếng Việt cũng dùng được Garden of Habits (PWA và APK Android). App có **một** ngôn ngữ giao diện tại một thời điểm (Tiếng Việt hoặc English), đổi được trong Cài đặt.

Tiêu chí thành công:
- Máy để tiếng Anh, cài mới → mọi chữ do app viết ra đều là tiếng Anh, không sót chữ Việt nào.
- Người dùng hiện tại (vợ chủ repo, đã có dữ liệu) **không thấy gì thay đổi**, kể cả khi iPhone để tiếng Anh.
- Thêm chuỗi mới mà quên dịch → `tsc` hoặc unit test báo lỗi.
- Bố cục khổ iPhone 13 không vỡ với chữ tiếng Anh (thường dài hơn).

Ngoài phạm vi (dự án "Lên Google Play" riêng): store listing, chính sách quyền riêng tư, AAB, kiểm tra chính sách Play về link ủng hộ PayPal / VietQR, thêm ngôn ngữ thứ ba.

## Quyết định chính

| Vấn đề | Quyết định |
|---|---|
| Thư viện | Không dùng. Lớp i18n tự viết, kiểu chặt (cách A). |
| Dữ liệu người dùng gõ (việc, mẫu, ghi chú, mục tiêu, việc nhắc, lời cây nói đã sửa) | **Không dịch.** |
| Lời cây nói của ngày đã lưu (`DayRecord.speech`) | Giữ nguyên ngôn ngữ lúc chọn. Đổi ngôn ngữ giữa ngày thì câu hôm nay vẫn tiếng cũ, mai mới đổi (chấp nhận được, không đụng DB). |
| Ngôn ngữ mặc định | Theo máy (`vi*` → `vi`, còn lại `en`); DB đã có dữ liệu mà chưa chọn ngôn ngữ → `vi`. |
| Tên app | Giữ `Garden of Habits` cho cả hai ngôn ngữ (manifest, Android `app_name`). Tên DB, mã sao lưu, `appId` giữ nguyên. |
| `SCHEMA_VERSION` (DB và sao lưu) | Không đổi: chỉ thêm một setting và một trường sao lưu tuỳ chọn. |

## 1. Lõi i18n (`src/i18n/`)

```
src/i18n/
  vi.ts      export const vi = { common: {...}, calendar: {...}, today: {...}, ... }   // nguồn chuẩn
  en.ts      export const en: Messages = { ... }                                       // Messages = typeof vi (đã nới literal)
  index.ts   Lang, LANGS, detectLang, I18nProvider, useI18n, fmt, errorText
```

- Chuỗi có tham số là **hàm**: `deleteConfirm: (task: string) => \`Xác nhận xoá: ${task}\``. Số nhiều tiếng Anh viết trong hàm (`days: (n) => n === 1 ? '1 day' : \`${n} days\``).
- `Messages` lấy từ `vi` bằng một kiểu đệ quy đổi literal thành `string` (để `en` không bị buộc trùng chữ). Thiếu khoá, thừa khoá, sai chữ ký hàm → `tsc` báo lỗi.
- `useI18n()` trả `{ lang, t, setLang }`. Component gọi `t.today.addTask(period)` thay chữ cứng. Không có khoá dạng chuỗi.
- **Định dạng ngày/giờ/tháng** (`fmt`, trong `index.ts`): `monthLabel(y, m)`, `longDate(d)`, `weekdaysShort`, `dateTime(ms)` theo ngôn ngữ đang chọn. `vi` giữ đúng chữ hiện tại (`T2…CN`, `Tháng 10, 2026`, `Thứ Hai, 06/10/2026`, `toLocaleString('vi-VN')`); `en` dùng `Mon…Sun`, `October 2026`, `Monday, Oct 6, 2026`, `toLocaleString('en-US')`. Lịch vẫn bắt đầu từ thứ Hai ở cả hai ngôn ngữ.
- `domain/calendar.ts` bỏ `WEEKDAY_SHORT`/`WEEKDAY_LONG`/`monthLabel`/định dạng ngày dài (chuyển sang `fmt`); `growth.ts` bỏ `STAGE_LABEL`, `period.ts` bỏ `PERIOD_LABEL` (chuyển vào `t.stage`, `t.period`). Tầng domain chỉ còn logic.

### Chọn và lưu ngôn ngữ

- Setting mới `language: 'vi' | 'en'` trong `SettingsShape`.
- `detectLang(navigator.languages)`: phần tử đầu tiên bắt đầu bằng `vi` hoặc `en` quyết định; không có → `en`.
- `resolveLang(db)`: có setting → dùng; chưa có nhưng bảng `days` có bản ghi → `'vi'` (người dùng cũ); chưa có gì → `detectLang`. Kết quả suy ra **không ghi** vào DB; chỉ ghi khi người dùng tự chọn.
- `I18nProvider` bọc `App` (trong `main.tsx`, cạnh `DepsProvider`). Trong lúc đọc DB, dùng `detectLang` để render ngay (không màn trắng). Đổi ngôn ngữ: state cục bộ đổi ngay (optimistic), rồi ghi setting; cập nhật `document.documentElement.lang`.
- **Cài đặt** thêm thẻ **"Ngôn ngữ · Language"** đứng sau "Lịch": radiogroup 2 nút `Tiếng Việt` / `English` (nhãn nút luôn viết bằng chính ngôn ngữ đó). Thứ tự thẻ: Nhắc việc → Mẫu việc → Lịch → Ngôn ngữ → Sao lưu & khôi phục → Ủng hộ tôi.
- **Sao lưu:** thêm trường tuỳ chọn `"language": "vi" | "en"`. `replace` → ghi theo file (nếu có); `merge` → giữ ngôn ngữ của máy nếu máy đã có setting, không thì lấy từ file.

## 2. Nội dung (`src/content/`)

```ts
type Localized<T> = { vi: T; en: T };
```

- `PlantSpecies.name`, `PlantStyle.name`, `PotStyle.name`, `SpecialVariant.name`: `Localized<string>`.
- `PlantSpecies.sayings | praises | taps`: `Localized<string[]>`. `COMMON_SAYINGS`, `COMMON_PRAISES`, `BLOOM_PRAISES`, `COMMON_TAPS`, `SLEEPY_TAPS`: `Localized<string[]>`.
- `pickSaying(species, rng, lang)`, `pickPraise(..., lang)`, `pickTap(..., { lang, ... })`. Số lần gọi RNG không đổi (chọn trong danh sách của ngôn ngữ đang dùng).
- Câu tiếng Anh do Claude viết, giữ giọng chibi dễ thương + emoji như bản Việt (không dịch word-by-word). Chủ repo duyệt câu chữ trong PR/commit.
- Test nội dung (`plants.test.tsx`, `praises/taps/sayings.test.ts`) kiểm **cả hai** ngôn ngữ: mỗi loài ≥ 1 câu khen, ≥ 2 câu chạm, ≥ 2 lời của ngày ở mỗi ngôn ngữ; mọi `name` có đủ `vi`/`en` không rỗng.
- `content/support.ts`: chữ của thẻ Ủng hộ vào `t.support`; ảnh VietQR và link PayPal giữ nguyên ở cả hai ngôn ngữ.
- `CATALOG` (tầng domain) không chứa tên nên không đổi.

## 3. Lỗi ở tầng domain / db

- `src/domain/errors.ts`: `class AppError extends Error { code: ErrorCode; params }`. Các `throw new Error('…tiếng Việt…')` trong `dayService`, `plannedService`, `reminderService`, `templateService` đổi thành `AppError` có mã (`emptyTask`, `emptyReminder`, `emptyTemplateName`, `dayNotFound`, `todoNotFound`, `templateNotFound`, `reminderNotFound`, `plannedNotFuture`, `specialLocked`, `styleLocked`, `unknownPlant`, `unknownPot`, `unknownStyle`). `LockedDayError` kế thừa `AppError` (`dayLocked`, param `date`). `message` vẫn là câu tiếng Việt để log/test cũ đọc được.
- `parseBackup` trả `{ ok: false, error: BackupErrorCode, path? }` (`notJson`, `wrongFormat`, `tooNew`, `corrupt`); màn hình dịch bằng `t.backup.errors`.
- `errorText(e, t)`: `AppError` → `t.errors[code](params)`; lỗi khác → `e.message`. Mọi chỗ `setError(e.message)` đổi thành `setError(errorText(e, t))`.
- Lỗi nội bộ không bao giờ tới tay người dùng (`pickUniform: danh sách rỗng`) giữ nguyên.
- `platform`: `DOMException('Đã huỷ chia sẻ', 'AbortError')` chỉ để nhận diện bằng `name`, giữ nguyên.

## 4. Giao diện và bố cục

- Mọi chữ trong `src/app`, `src/components`, `src/screens` (nhãn, `aria-label`, placeholder, câu trống, xác nhận) lấy từ `t`. Nhãn `aria-label` tiếng Anh viết song song đúng mẫu tiếng Việt (vd. `Xoá: <việc>` ↔ `Delete: <task>`) để E2E tiếng Anh bám được.
- **Không đổi `data-testid`** (vốn không theo ngôn ngữ).
- Chỗ dễ tràn khi sang tiếng Anh, phải soát bằng ảnh chụp WebKit iPhone 13: tóm tắt Khu vườn (`garden-summary`, luôn một dòng), dải 4 tab của menu nổi, hàng 4 nút dưới chậu, hàng nút thẻ mẫu `[Add to today][Edit][Delete]`, nút viên `☀ Today` ở Nhắc việc, khung `style-unlock`, bong bóng lời cây (tối đa 3 dòng). Tràn thì rút gọn chữ tiếng Anh trước, chỉ sửa CSS khi bắt buộc.
- `index.html` giữ `lang="vi"` lúc tải; `I18nProvider` đặt lại theo ngôn ngữ. Manifest giữ nguyên (tên app tiếng Anh sẵn).
- Tên file sao lưu `chau-cay-backup-YYYY-MM-DD.json` giữ nguyên.

## 5. Kiểm tra

**Lưới an toàn chống sót chữ Việt** — unit test `tests/unit/i18n/no-hardcoded-vi.test.ts`: dùng TypeScript compiler API duyệt mọi file `.ts/.tsx` trong `src/app`, `src/components`, `src/screens`, `src/domain`, `src/db`, `src/hooks`, `src/platform`; mọi **string literal / template literal / JSX text** (không tính comment) chứa chữ có dấu tiếng Việt → fail, trừ danh sách cho phép ngắn có lý do (vd. `message` của `AppError`, chuỗi nội bộ của `platform`). `src/i18n/vi.ts` và `src/content/` nằm ngoài phạm vi quét (đã có test riêng bắt đủ `en`).

**Unit (Vitest):**
- `detectLang`, `resolveLang` (máy mới → theo máy; có ngày cũ → `vi`; có setting → setting).
- `fmt` cho cả hai ngôn ngữ (tháng, thứ, ngày dài, số nhiều).
- `errorText` cho mọi `ErrorCode`; `parseBackup` trả mã.
- Sao lưu/khôi phục setting `language` (replace và merge; file cũ không có trường này).
- `renderWithDeps` bọc `I18nProvider` với **`lang: 'vi'` mặc định** (jsdom báo `en-US`), có tham số để render tiếng Anh → test cũ không phải sửa. Thêm test render vài màn bằng `en` (Cài đặt đổi ngôn ngữ, Hôm nay, Lịch).

**E2E (Playwright WebKit iPhone 13):**
- Config đang `locale: 'vi-VN'` → test cũ vẫn tiếng Việt, không phải sửa.
- File mới `e2e/i18n.spec.ts` với `test.use({ locale: 'en-US' })`: máy tiếng Anh mở lần đầu ra tiếng Anh; đổi sang Tiếng Việt trong Cài đặt, reload vẫn giữ; dữ liệu cũ + máy tiếng Anh vẫn tiếng Việt; luồng chính bằng tiếng Anh (thêm việc, tick, cây khen, mở Lịch, Khu vườn); tóm tắt Khu vườn tiếng Anh với số lớn vẫn một dòng; nút tròn vẫn tròn.
- Chụp ảnh WebKit bản tiếng Anh mọi màn để soát tràn chữ (không commit ảnh).

**Android:** soát tay theo `docs/android.md`: máy để tiếng Anh cài mới → tiếng Anh; nút Back và menu Chia sẻ hoạt động bình thường.

## 6. Thứ tự triển khai (gợi ý cho kế hoạch)

1. Lõi `src/i18n` + setting `language` + `resolveLang` + `I18nProvider` + helper test.
2. Thẻ Ngôn ngữ trong Cài đặt + sao lưu `language`.
3. `fmt` (lịch, ngày, giờ) và chuyển nhãn buổi/giai đoạn.
4. Chuyển chữ từng nhóm màn: menu/chung → Lịch → Hôm nay (+ InlineAdd, TodoList, các bảng) → ngày tương lai → Khu vườn → Cài đặt/Mẫu/Nhắc việc/Ủng hộ → nền Lịch.
5. Nội dung `Localized` + câu tiếng Anh cho cây/chậu/dáng/hiệu ứng/lời nói.
6. `AppError` + mã lỗi sao lưu + `errorText`.
7. Bật test chống sót chữ Việt (lúc này phải xanh).
8. E2E tiếng Anh + soát ảnh WebKit + sửa tràn.
9. Cập nhật `CLAUDE.md` (bỏ "toàn bộ chữ là tiếng Việt", thêm quy tắc: chữ mới phải vào `vi.ts` + `en.ts`; nội dung mới phải có `{ vi, en }`), `docs/android.md` (mục soát ngôn ngữ).

Mỗi bước giữ mọi test xanh; push được sau từng bước (người dùng tiếng Việt không thấy khác cho tới bước 2).
