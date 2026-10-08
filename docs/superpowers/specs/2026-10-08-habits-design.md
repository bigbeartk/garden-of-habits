# Thói quen & báo cáo thói quen (Habit Reports)

Ngày: 2026-10-08 · Trạng thái: chờ duyệt

## Mục đích

Vợ chủ repo muốn tính năng giống "Habit Reports" của app Habit Tracker: một danh sách **thói quen** lặp lại theo thứ trong tuần, tick mỗi ngày, rồi xem lại bảng Tuần / Tháng / Năm để biết thói quen nào giữ đều, thói quen nào hay bỏ. Khu vườn hiện chỉ đếm cây, không trả lời câu hỏi này.

Tiêu chí thành công:
- Tạo thói quen (tên, emoji, màu, các thứ trong tuần) trong vài chạm.
- Mở app → tick thói quen hôm nay ngay ở màn Hôm nay, không phải chuyển màn.
- Khu vườn → Thói quen cho thấy bảng tuần giống ảnh mẫu, xem được tháng/năm, có 4 số tổng.
- Giữ phong cách sticker chibi, song ngữ, offline, vừa iPhone 13 (390×844), có trong sao lưu.

## Quyết định đã chốt

| Câu hỏi | Chốt |
|---|---|
| Thói quen là gì | Danh sách **riêng** (bảng mới), có tên, emoji, màu |
| "Đã làm" tính thế nào | **Điểm danh riêng**, tách khỏi todo: không thêm todo, không tính vào tỉ lệ việc xong/giai đoạn cây |
| Tick được ngày nào | **Chỉ hôm nay** (theo `dayKey(now)`, mốc 4:00) |
| Lịch | Mỗi thói quen chọn **các thứ trong tuần** (mặc định đủ 7) |
| Tick ở đâu | **Dải chip** đầu danh sách ở màn Hôm nay |
| Báo cáo + quản lý ở đâu | Tab **Khu vườn**, công tắc `Cây | Thói quen`; màn con `Quản lý thói quen` |
| Kiểu xem | **Tuần + Tháng + Năm**, có 4 số tổng |
| Cây khi tick | **Cười ~1,5 giây rồi về mặt cũ**, không nói câu nào |
| Quay lại từ màn quản lý | Luôn về **Khu vườn (tab Thói quen)**, kể cả khi mở từ chip ＋ ở Hôm nay |
| Ngoài phạm vi | Nút Filter, chia sẻ ảnh báo cáo, nhắc giờ, mục tiêu "n lần/tuần", tick bù ngày cũ |

## Dữ liệu

DB `chau-cay-chibi` lên **v6** (`SCHEMA_VERSION = 6`), thêm 2 bảng, không cần `upgrade`:

```ts
this.version(6).stores({ ...v5, habits: 'id, order', habitChecks: '[habitId+date], habitId, date' });
```

```ts
// src/domain/types.ts
interface Habit {
  id: string;
  name: string;          // cắt khoảng trắng, 1–40 ký tự (HABIT_NAME_MAX)
  icon: string;          // một emoji trong HABIT_ICONS (content/habits.ts, ~24 cái)
  color: HabitColor;     // 'peach' | 'mint' | 'butter' | 'lavender' | 'sky' | 'rose' | 'sage' | 'cocoa' (8 màu, HABIT_COLORS)
  weekdays: number[];    // 0 = CN … 6 = T7, cleanWeekdays (dùng chung với Mẫu); không được rỗng
  order: number;         // thứ tự hiển thị = thứ tự tạo (0..n-1)
  startDate: string;     // dayKey lúc tạo; ngày trước đó không tính
  createdAt: number;
  updatedAt: number;
}
interface HabitCheck { habitId: string; date: string; at: number } // có bản ghi = ngày đó đã làm
```

- Emoji ở đây là **nội dung người dùng chọn** (như tên), không phải icon chức năng, nên không trái quy tắc "không dùng emoji cho icon".
- Màu lấy biến CSS trong `theme.css` (thêm `--rose`, `--sage` nếu chưa có); ô "chưa làm" dùng cùng màu ở độ đậm 25%.
- Setting mới `gardenView: 'plants' | 'habits'` (không có = `plants`), có trong sao lưu.

## Logic (domain thuần, test độc lập)

`src/domain/habitService.ts` (nhận `DayDeps`):
- `addHabit(deps, { name, icon, color, weekdays })`: kiểm tên (rỗng/quá dài → `AppError`), `weekdays` rỗng → lỗi; `startDate = dayKey(now)`, `order` = cuối.
- `editHabit(deps, id, patch)`: cùng kiểm tra, cập nhật `updatedAt`. Không đổi `startDate`.
- `deleteHabit(deps, id)`: xoá thói quen **và mọi `habitChecks` của nó** trong một transaction.
- `toggleHabit(deps, id)`: chỉ ngày `dayKey(now)`; thói quen không có lịch hôm nay hoặc hôm nay là ngày tiết kiệm năng lượng → lỗi. Trả về trạng thái mới (`true` = đã làm).
- `habitsForDay(habits, date, isRestDay)`: các thói quen **có lịch** ngày đó.

`src/domain/habitReport.ts` (hàm thuần, không đụng DB):

```ts
habitReport(habits, checks, restDays: Set<string>, period: { kind: 'week'|'month'|'year'; from: string; to: string }, todayKey)
```

Luật:
- Ô (thói quen, ngày) **có lịch** khi: thứ của ngày ∈ `weekdays`, `date ≥ startDate`, `date ≤ todayKey`, và ngày không phải ngày tiết kiệm năng lượng.
- Trạng thái ô: `done` (có check, **kể cả ngày nay không còn trong lịch** sau khi đổi thứ), `missed` (có lịch, chưa check, ngày đã qua), `pending` (có lịch, hôm nay, chưa check), `off` (không lịch / ngày nghỉ / trước `startDate`), `future`.
- Đổi lịch thứ → quá khứ tính lại theo lịch mới (chấp nhận).
- **% Đạt** = số ô `done` ÷ số ô có lịch (`done` + `missed` + `pending`), làm tròn; 0 ô có lịch → hiện `–`.
- **Ngày trọn vẹn** = ngày có ≥ 1 ô có lịch và mọi ô có lịch đều `done`.
- **Tổng lần làm** = số check trong kỳ.
- **Chuỗi dài nhất** = số ngày trọn vẹn liên tiếp dài nhất trong kỳ; ngày không có ô nào có lịch thì bỏ qua (không đứt chuỗi).
- Mỗi thói quen: `perfect` = có ≥ 1 ô có lịch và mọi ô có lịch đều `done` (huy hiệu ⭐ ở bảng tuần); `rate` (%) cho tháng/năm.
- Kỳ: **tuần T2 → CN** (khớp `doneThisWeek` của Nhắc việc), **tháng** theo lịch, **năm** 1/1 → 31/12. Không đi tới kỳ sau kỳ hiện tại.

## Giao diện

### Dải chip ở Hôm nay (`components/HabitStrip.tsx`)
- Ngay dưới `GoalInput`, trong `.today__list` (cuộn cùng danh sách). Tiêu đề nhỏ `Thói quen hôm nay` + `2/4`.
- Chip tròn ~48px (emoji giữa, tên 1 dòng cắt `…` bên dưới), `role="switch"`, `aria-checked`, nhãn `Thói quen: <tên>`. Chưa làm: viền nét đứt, nền trắng. Đã làm: nền màu thói quen + ✓ nhỏ ở góc, nảy nhẹ. **State cục bộ (optimistic).**
- Nhiều chip thì cuộn ngang (`overflow-x: auto`, không làm cả trang cuộn ngang). Chip cuối là ＋ `Quản lý thói quen`.
- Ẩn cả dải khi hôm nay là ngày tiết kiệm năng lượng hoặc có thói quen nhưng không cái nào có lịch hôm nay. Chưa có thói quen nào → chỉ một chip ＋ mờ chữ `Thêm thói quen`.
- Tick (bật) → cây `smile` ~1,5 giây (không có `speech`), dùng cùng cơ chế `celebrating` của TodayScreen; bỏ tick không làm gì.
- Chip ＋ → `nav` sang tab Khu vườn, `gardenView = 'habits'`, mở màn quản lý.

### Khu vườn: `Cây | Thói quen`
- Hàng tiêu đề có 2 tab (`role="tab"`, kiểu tab Cây/Chậu): `Cây` / `Thói quen`. Nhớ ở setting `gardenView`.
- Tab Cây: giữ nguyên màn hiện tại. Tab Thói quen: ẩn nút `Tuỳ chọn hiển thị`, hiện nút `Quản lý thói quen` (icon SVG mới `habits` trong `icons.tsx`: tờ lịch nhỏ có 2 ô ✓; dùng cho cả chip ＋) cuối hàng tiêu đề.
- `components/HabitReport.tsx` (`data-testid="habit-report"`):
  - 3 tab con `Tuần | Tháng | Năm`; hàng `‹ <kỳ> ›` (`Kỳ trước` / `Kỳ sau`, nút sau tắt ở kỳ hiện tại). Mở màn → tuần hiện tại.
  - **Tuần:** cột tên (emoji + tên, tối đa 2 dòng) + 7 cột T2…CN + cột huy hiệu ⭐ (`habit-perfect-<id>`). Ô `habit-cell-<id>-<date>` có `data-state`. Cột hôm nay viền đậm. Hàng cuối `Ngày trọn vẹn`: 🏅 ở ngày trọn vẹn, 👑 cuối hàng nếu mọi ngày có lịch trong tuần đều trọn vẹn.
  - **Tháng:** mỗi thói quen một thẻ: tên + `%` + lưới lịch 7 cột (ô ~14px, cùng luật màu).
  - **Năm:** mỗi thói quen một hàng 12 thanh dọc T1…T12 cao theo `%` tháng (tháng không có ô có lịch → thanh trống).
  - Hàng 4 số (`habit-stats`): `% Đạt` · `Ngày trọn vẹn` · `Tổng lần làm` · `Chuỗi dài nhất`, mỗi số một màu pastel.
  - Chưa có thói quen: hình chibi + nút `＋ Thói quen đầu tiên` (mở màn quản lý ở chế độ thêm).
- Phải vừa 390px, không cuộn ngang trang; E2E đo bảng tuần không tràn thẻ.

### Màn `Quản lý thói quen` (`screens/HabitsScreen.tsx`)
- Thay chỗ GardenScreen (như TemplatesScreen trong Cài đặt), nút `Quay lại Khu vườn`. Back Android: màn lớp `screen`, form lớp `form`.
- `＋ Thói quen mới` (nét đứt), rồi các thẻ sticker theo `order`: emoji trên nền màu, tên, nhãn lịch `Mỗi ngày` hoặc `T2 · T4 · T6`, nút `Sửa` và xoá có xác nhận (`DeleteWithConfirm`, cảnh báo mất lịch sử).
- Form (`components/HabitForm.tsx`): ô `Tên thói quen` (maxLength 40), radiogroup `Biểu tượng` (lưới emoji), radiogroup `Màu` (8 chấm), hàng `Lịch` 7 nút thứ. **Tách hàng chọn thứ khỏi `TemplateForm` thành `components/WeekdayPicker.tsx`** và dùng chung cho cả hai. Nút Lưu tắt khi tên rỗng hoặc chưa chọn thứ nào.
- Chừa `padding-bottom` cho nút menu nổi.

### Chữ
Mọi chữ thêm vào `src/i18n/vi.ts` và `en.ts` (Habits, Today's habits, Week/Month/Year, Met, Perfect days, Total done, Best streak, Every day…). Ngày/kỳ định dạng qua `fmt.ts`. Lỗi qua `AppError` + `errorText`.

## Sao lưu, khôi phục, xoá dữ liệu
- `schemaVersion` 6; thêm `habits: Habit[]`, `habitChecks: HabitCheck[]` (zod, file 1–5 không có → `[]`), `gardenView` (tuỳ chọn).
- `replace`: xoá rồi ghi lại. `merge`: thói quen theo `id` (`updatedAt` lớn hơn thắng); check theo cặp `habitId+date` (hợp); bỏ check có `habitId` không tồn tại sau khi gộp.
- Transaction của `exportBackup` / `restoreBackup` / `resetAllData` thêm 2 bảng mới; `dataSummary` thêm số thói quen.
- Cập nhật mục *Format file sao lưu* và *Cơ sở dữ liệu* trong `CLAUDE.md`.

## Kiểm thử
- **Unit (TDD):** `habitService` (kiểm tên/thứ, chỉ tick hôm nay, mốc 4:00, ngày nghỉ, xoá kèm check); `habitReport` (mọi trạng thái ô, đổi lịch, `startDate`, ngày nghỉ, %, ngày trọn vẹn, chuỗi bỏ qua ngày trống, ranh giới tuần T2/CN, tháng, năm); backup v6 + file v5 cũ; merge; reset; `HabitStrip` (optimistic, ẩn khi ngày nghỉ, chip ＋); `HabitReport` render tuần; `WeekdayPicker` (TemplateForm vẫn pass).
- Test i18n không chữ Việt cứng vẫn pass.
- **E2E WebKit iPhone 13:** tạo thói quen → tick ở Hôm nay → reload vẫn đã tick → Khu vườn/Thói quen thấy ô `done`; bảng tuần không tràn; chuyển Tháng/Năm; E2E tiếng Anh một luồng ngắn. Soát ảnh chụp WebKit cả 3 kiểu xem và dải chip.
- Chạy thêm test kiểu CI (Node 20, UTC) trước khi push.
