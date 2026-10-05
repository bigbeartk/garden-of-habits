# Nhắc việc (việc dài hạn) — Thiết kế

Ngày: 2026-10-05 · Nguồn: bản vẽ tay "Nhắc việc" của chủ repo.

## Mục đích

Có những việc hạn còn xa (mua điện thoại cho mẹ, xin nghỉ phép, vẽ tranh…), chưa cần đưa vào Hôm nay. Màn **Nhắc việc** gom chúng lại để theo dõi. Khi muốn bắt tay làm thì bật nút **Hôm nay**: việc tự vào Hôm nay, buổi Sáng, và **mỗi ngày đều được thêm lại cho tới khi xong**. Xong rồi thì việc chuyển xuống mục **Đã hoàn thành tuần này**.

Tiêu chí thành công: người dùng không phải tự chép lại việc dài hạn mỗi sáng; việc xong ở bất kỳ màn nào thì cả hai màn đều thấy đã xong.

## Dữ liệu

### Bảng `reminders` (DB `SCHEMA_VERSION = 5`)

```ts
interface Reminder {
  id: string;
  text: string;             // đã trim, không rỗng
  dueDate: string | null;   // 'YYYY-MM-DD'; null = không hạn
  autoToday: boolean;       // nút gạt "Hôm nay"
  doneAt: number | null;    // ms; null = chưa xong
  createdAt: number;
  updatedAt: number;        // gộp sao lưu: bản mới hơn thắng
}
```

`db.version(5).stores({ ...v4, reminders: 'id' })`. Không cần bước `upgrade`.

### Todo nối với việc nhắc

Thêm vào `Todo` trường tuỳ chọn `reminderId?: string`. Việc tạo từ việc nhắc mang id của việc nhắc đó. Mỗi ngày có tối đa **một** todo cho mỗi `reminderId`.

## Quy tắc (`src/domain/reminderService.ts`)

Mọi thao tác nhận `DayDeps`. Thao tác chạm tới hôm nay ghi `reminders` và `days` trong **cùng một transaction**. Không gọi hàm async lồng nhau đọc settings bên trong transaction (xem bài học `PrematureCommitError` trong CLAUDE.md).

| Thao tác | Kết quả |
|---|---|
| `addReminder(text, dueDate)` | Tạo việc nhắc với `autoToday = false`. Chữ rỗng → từ chối. |
| `setReminderAutoToday(id, true)` | Bật cờ. Nếu việc **chưa xong**, bản ghi hôm nay đã có và chưa có todo nào mang `reminderId` này, thì thêm todo vào **cuối buổi Sáng**. |
| `setReminderAutoToday(id, false)` | Tắt cờ. Gỡ todo nối với việc này khỏi hôm nay nếu todo đó **chưa xong**. |
| `ensureToday` (tạo ngày mới) | Sau việc của mẫu và việc đã lên lịch, thêm vào buổi Sáng mọi việc nhắc có `autoToday && doneAt === null` (thứ tự `createdAt`). Ngày cũ đã khoá nên vẫn giữ todo ở trạng thái chưa xong. |
| `toggleTodo` của todo có `reminderId` | `doneAt` của việc nhắc = `todo.doneAt` (xong) hoặc `null` (bỏ tick). |
| `toggleReminderDone(id)` | Đảo trạng thái xong. Nếu hôm nay có todo nối với việc này thì todo đó cũng được đảo theo; khi đó trả về `ToggleResult` để màn hình (nếu có) cho cây khen. |
| `editTodo` của todo có `reminderId` | Đổi chữ của việc nhắc theo. |
| `editReminder(id, { text?, dueDate? })` | Đổi việc nhắc. Đổi chữ thì cập nhật cả todo nối với nó ở **hôm nay** (ngày cũ giữ nguyên). |
| `deleteTodo` của todo có `reminderId` | Tự **tắt** `autoToday` của việc nhắc, để mai không quay lại. |
| `deleteReminder(id)` | Xoá việc nhắc và gỡ todo nối với nó ở hôm nay nếu todo đó chưa xong. Todo đã xong vẫn giữ, vì nó góp vào cây; lúc đó todo chỉ còn trỏ tới một id không tồn tại, và mọi chỗ đều bỏ qua id lạ. |

Quy tắc chung: chỉ **hôm nay** được thêm, gỡ hoặc sửa todo. Ngày tiết kiệm năng lượng vẫn thêm todo (ẩn như các việc khác).

### Hiển thị và sắp xếp (logic thuần, test riêng)

- `activeReminders`: các việc `doneAt === null`, xếp theo `dueDate` tăng dần, việc không hạn ở cuối; cùng hạn thì theo `createdAt`.
- `doneThisWeek(reminders, todayKey)`: các việc có `dayKey(doneAt) >= thứ Hai của tuần chứa todayKey` (mốc 4:00), mới xong đứng trên.
- `dueStatus(dueDate, todayKey)`: `'overdue'` khi hạn < hôm nay, `'soon'` khi còn 0–3 ngày, `'normal'` khi còn xa hơn, `null` khi không hạn.

## Giao diện

### Cài đặt

Thẻ **"Nhắc việc"** là thẻ **đầu tiên**, nằm trước "Mẫu việc". Thẻ ghi `N việc đang theo dõi` (hoặc `Chưa có việc nhắc nào`) và có nút `Mở nhắc việc`. Bấm nút thì `SettingsScreen` hiện `RemindersScreen` (prop `onBack`) thay cho trang Cài đặt, giống cách màn Mẫu đang làm. Màn có `BackButton` nhãn `Quay lại Cài đặt` và `useBackHandler(…, 'screen')`.

### `RemindersScreen` (`data-testid="reminders"`)

- **Tiêu đề:** `Nhắc việc`.
- **Nút thêm:** `＋ Việc nhắc mới` (rộng, viền nét đứt). Bấm thì hiện dòng trống gồm ô `Việc nhắc mới` (đã focus) và ô ngày `Hạn của việc mới` (`<input type="date">`, để trống được). Enter hoặc nút `Lưu` thì lưu rồi đóng dòng; Escape thì huỷ. Việc rỗng không bao giờ được lưu.
- **Danh sách đang theo dõi** (`reminders-active`): hàng tiêu đề cột `Việc · Hạn · Hôm nay`. Mỗi dòng `reminder-<id>` gồm:
  - ô tick tròn `Hoàn thành nhắc: <việc>`;
  - chữ việc (chạm để sửa tại chỗ, nút `Sửa việc nhắc`);
  - hạn `dd/mm` (ô `<input type="date">` trong suốt phủ lên chữ, nhãn `Hạn: <việc>`; không hạn thì ghi `—`). Có `data-due` = `overdue|soon|normal`: cam khi `soon`; hồng đậm kèm chữ `Quá hạn` khi `overdue`;
  - công tắc `Thêm vào hôm nay: <việc>`, giữ state cục bộ (optimistic) như `SettingSwitch`;
  - nút xoá dùng `DeleteWithConfirm`.
- **Đã hoàn thành tuần này** (`reminders-done`): ☑ cộng chữ nhạt (không gạch ngang). Chạm ô tick thì bỏ hoàn thành. Chưa có việc thì ghi `Chưa xong việc nào tuần này`.
- Màn có `padding-bottom` chừa chỗ cho nút menu nổi, và tôn trọng safe-area.

### Hôm nay

Todo có `reminderId` hiện icon SVG mới `bell` (16px, `data-icon="bell"`) trước chữ. Mọi thứ khác giữ nguyên: kéo thả sang buổi khác được.

## Sao lưu

- `schemaVersion: 5`, thêm `reminders: Reminder[]`. File phiên bản 1–4 không có trường này thì coi là `[]`.
- Todo trong `days` có thể mang `reminderId` (tuỳ chọn).
- `replace`: xoá hết rồi ghi lại. `merge`: gộp theo `id`, bản có `updatedAt` lớn hơn thắng.

## Kiểm thử

- **Unit** (TDD):
  - mọi dòng trong bảng quy tắc;
  - `ensureToday` thêm việc nhắc;
  - `activeReminders` / `doneThisWeek` / `dueStatus`;
  - xuất, khôi phục (replace/merge) sao lưu, cả file v4 thiếu `reminders`;
  - `RemindersScreen`: thêm, gạt, tick, xoá;
  - thẻ trong Cài đặt;
  - icon chuông ở Hôm nay.
- **E2E WebKit iPhone 13:**
  - Cài đặt → Mở nhắc việc → thêm việc có hạn → bật Hôm nay → việc có ở buổi Sáng của Hôm nay → tick → việc xuống mục Đã hoàn thành;
  - đồng hồ sang ngày hôm sau thì việc chưa xong lại có mặt;
  - chụp ảnh màn Nhắc việc để soát hình.
- Chạy thêm test giống CI (`TZ=UTC` Node 20) trước khi push.

## Ngoài phạm vi

- Thông báo đẩy hoặc báo thức.
- Lặp định kỳ (hằng tuần/tháng).
- Xem lịch sử việc nhắc đã xong từ trước tuần này (vẫn lưu trong DB).
- Chọn buổi khi tự thêm: luôn là buổi Sáng, người dùng tự kéo sang buổi khác.

## CLAUDE.md

Cập nhật: quy tắc nghiệp vụ Nhắc việc, thứ tự thẻ Cài đặt, bảng DB v5, định dạng sao lưu, icon `bell`, các label/testid test dựa vào, và việc đăng ký nút Back.
