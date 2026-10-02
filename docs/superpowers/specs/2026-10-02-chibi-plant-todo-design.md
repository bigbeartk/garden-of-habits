# Spec: App Todo "Chậu Cây Chibi" (PWA cho iPhone, offline)

## Context
Bạn muốn một app todo cá nhân trên iPhone có yếu tố "nuôi cây" để tạo động lực mỗi ngày: không cần tài khoản, không lên App Store, chạy offline, và **không được mất dữ liệu**. Máy phát triển là Windows và thư mục `D:\Learning\Shop_Claude` đang trống → đây là dự án mới.
Thiết kế dưới đây đã được duyệt qua brainstorming (3 phần).

**Các bước sau khi duyệt:**
1. Lưu spec này vào `docs/superpowers/specs/2026-10-02-chibi-plant-todo-design.md` (git init + commit).
2. Gọi skill `superpowers:writing-plans` để lập kế hoạch triển khai chi tiết.
3. Triển khai; phần giao diện dùng skill `frontend-design`.

## Các quyết định đã chốt
| Chủ đề | Quyết định |
|---|---|
| Nền tảng | **PWA**: mở bằng Safari → "Thêm vào MH chính", chạy offline, host miễn phí trên GitHub Pages |
| Tech | **React + Vite + TypeScript**, vite-plugin-pwa, Dexie (IndexedDB), Framer Motion, zod, Vitest, Playwright |
| Cây lớn | Theo **tỉ lệ** todo xong trong ngày: chưa xong cái nào → hạt giống; ≥1 → nảy mầm; ≥50% → ra chồi; 100% → ra hoa (0 todo → hạt giống) |
| Ngày tiết kiệm năng lượng | **Chỉ bật cho hôm nay**, trên màn Todo; todo bị ẩn nhưng vẫn giữ, tắt đi thì hiện lại |
| Todo chưa xong | **Ở lại ngày cũ**; ngày mới chỉ lấy danh sách từ mẫu mặc định |
| Ngày đã qua | **Khoá**: chỉ sửa được ghi chú |
| Mốc sang ngày mới | **4:00 sáng** |
| Ngày không mở app | Lịch hiện **cây héo** (một hình chung cho mọi loài) |
| Backup | Xuất **file JSON** qua menu Chia sẻ (Tệp/iCloud) + nhắc nếu quá 7 ngày chưa backup; restore chọn **Thay thế / Gộp** |
| Hình ảnh | **Kết hợp**: mình vẽ SVG trước; định dạng hỗ trợ thay bằng ảnh PNG cho từng giai đoạn |

## Kiến trúc
```
src/
  app/        App.tsx, TabBar, theme.css (biến CSS pastel), safe-area
  content/    plants/<id>/, pots/, specials/, faces/, greetings.ts  ← chỗ thêm nội dung
  domain/     dayKey.ts (mốc 4h), dayService.ts, growth.ts, random.ts, timeOfDay.ts
  db/         db.ts (Dexie + migrate), backup.ts (export/import/merge, zod schema)
  components/ PlantStage, PlantArt, Face, WateringCan, SpeechBubble, SkyBackground,
              TodoList, BottomSheet, MiniPlant, NoteSheet
  screens/    CalendarScreen (màn mở đầu), TodayScreen, TemplatesScreen, SettingsScreen
public/       icons, apple-touch-icon, fonts tự host (Baloo 2, Quicksand), ảnh PNG tuỳ chọn
tests/        unit/ (vitest), e2e/ (playwright)
```

## Định dạng mở rộng
**Loài cây** — `content/plants/<id>/index.ts`, đăng ký trong `content/plants/registry.ts`:
```ts
type GrowthStage = 'seed' | 'sprout' | 'bud' | 'bloom';
type Art = { svg: React.FC<ArtProps> } | { image: string };
interface PlantSpecies {
  id: string; name: string; defaultPotId: string;
  stages: Record<GrowthStage, Art>;
  faceAnchor: Record<GrowthStage, { x: number; y: number; scale: number }>;
  greetings?: string[];
}
```
- 6 loài ban đầu: hướng dương, ngô, xương rồng, trầu bà, cam, cherry.
- **Khuôn mặt chibi dùng chung** (`Face`: normal / smile / talk / sleep) gắn theo `faceAnchor`. Ngoài ra có thêm `SleepingSeed` (hạt giống ôm gối) và `WiltedPlant` (cây héo) dùng chung cho mọi loài.

**Chậu** — `content/pots/<id>.tsx` + `registry.ts`: `{ id, name, art: Art, soilY }`. Có 6 chậu mặc định, mỗi cây đi kèm 1 chậu: đất nung, sứ chấm bi, gốm mint, giỏ mây, gỗ vuông, cốc hồng.

**Hiệu ứng đặc biệt** (xác suất 10%/ngày) — `content/specials/` + `registry.ts`: `{ id, name, weight, Overlay, filter? }`. Ban đầu có: Phát sáng, Cầu vồng, Lấp lánh, Vàng ròng, Pha lê.

**Thêm cây / chậu / hiệu ứng mới = thêm 1 file hoặc thư mục + 1 dòng đăng ký.**

## Dữ liệu (Dexie, có `schemaVersion` + migrate)
- `days` (khoá là `date: 'YYYY-MM-DD'`, tính theo mốc 4h): `{ date, plantId, potId, specialId|null, isRestDay, greetedAt|null, note, todos: Todo[], finalStage, createdAt, updatedAt }`
  - `Todo = { id, text, done, doneAt|null, order }`
- `templates`: `{ id, name, items: string[], isDefault }` — chỉ 1 mẫu được là mặc định
- `settings`: `calendarBg` (Blob), `lastBackupAt`, `schemaVersion`

## Logic (`domain/`, thuần TS)
- `dayKey(now)`: trước 4:00 thì vẫn tính là ngày hôm trước.
- `ensureToday()`: chạy khi mở app và khi `visibilitychange`. Nếu hôm nay chưa có record thì tạo mới:
  - random loài cây đều nhau, chậu = `defaultPotId`
  - `specialId` với xác suất 10% (chọn hiệu ứng theo `weight`)
  - todos copy từ mẫu mặc định
  - tất cả chạy trong 1 transaction, đảm bảo idempotent.
- `stageFor(done, total)`: tính giai đoạn theo bảng ở trên; ngưỡng nằm trong config. Mỗi lần tick sẽ cập nhật `finalStage`.
- Đổi cây/chậu hôm nay: chỉ đổi `plantId`/`potId`, giữ nguyên todo và `specialId`.
- Chào hỏi: nếu `greetedAt` là null thì hiện câu ngẫu nhiên (lấy từ pool chung + pool của loài cây), rồi ghi `greetedAt`.
- `timeOfDay(now)`: sáng 4–11h, trưa 11–14h, chiều 14–18h, tối 18–4h; cập nhật mỗi phút.
- Ngày đã qua: thao tác sửa todo bị chặn ở tầng domain, ghi chú vẫn được phép sửa.

## Màn hình
Thanh tab dạng bong bóng: **Lịch** (màn mở đầu) · **Hôm nay** · **Mẫu** · **Cài đặt**

- **Lịch**
  - Lưới tháng; mỗi ô hiện mini-cây (đúng loài + giai đoạn cuối ngày + chậu). Ngày nghỉ = hạt ôm gối ngủ, không có dữ liệu = cây héo, ngày đặc biệt có ✨, ngày có ghi chú có chấm nhỏ.
  - Vuốt hoặc bấm ‹ › để xem các tháng trước.
  - Chạm vào ngày → bảng chi tiết (cây, todo, ghi chú; ngày cũ chỉ sửa được ghi chú).
  - Nền: ảnh chọn từ máy (`input type=file`, nén còn khoảng 1600px, lưu dạng Blob) hoặc nền mặc định.
- **Hôm nay**
  - Nửa trên: nền theo giờ + chậu + cây + mặt + hiệu ứng đặc biệt; các nút 🔄 đổi cây, 🪴 đổi chậu, 📝 ghi chú, 😴 ngày tiết kiệm năng lượng.
  - Nửa dưới: danh sách todo (thêm, sửa, xoá, kéo sắp xếp, tick).
  - Tick xong → bình tưới nghiêng, giọt nước rơi → cây cười nhún nhảy → nếu lên giai đoạn mới thì có hiệu ứng bung lá/hoa.
  - Lần đầu mở trong ngày: hiệu ứng ✨ nếu là cây đặc biệt, rồi bong bóng chào.
  - Ngày nghỉ: ẩn danh sách, cây ôm gối ngủ, có "zzz" bay lên.
- **Mẫu**: tạo/sửa/xoá nhiều mẫu, ⭐ đánh dấu mẫu mặc định, nút "Thêm vào hôm nay".
- **Cài đặt**: backup/restore, đổi nền lịch, hướng dẫn cài lên màn hình chính.

## Phong cách (dùng `frontend-design`)
- Màu pastel dạng biến CSS: hồng đào `#FFD6DE`, mint `#CDEFE3`, vàng bơ `#FFF1C1`, lavender `#E3D9FF`, xanh trời `#D4ECFF`; chữ nâu ca cao `#5B4636`.
- Font Baloo 2 (tiêu đề) + Quicksand (nội dung), có tiếng Việt, tự host để chạy offline.
- Bo góc 20–28px, bóng mềm, nút nảy khi chạm; chừa khoảng an toàn tai thỏ/home indicator; tôn trọng `prefers-reduced-motion`.

## An toàn dữ liệu
- `navigator.storage.persist()` + hướng dẫn cài lên màn hình chính (PWA đã cài không bị Safari xoá dữ liệu sau 7 ngày).
- Mọi thao tác ghi đều chạy trong transaction; có `schemaVersion` + migrate Dexie.
- Backup: `chau-cay-backup-YYYY-MM-DD.json` (toàn bộ bảng, ảnh nền dạng base64) qua `navigator.share`; dự phòng bằng tải file.
- Restore: validate bằng zod → xem trước (số ngày, số mẫu) → **Thay thế** hoặc **Gộp** (gộp theo `date`, bản có `updatedAt` mới hơn thắng). File hỏng thì báo lỗi rõ ràng và không ghi gì.
- Quá 7 ngày chưa backup → cây nhắc nhẹ trên màn Hôm nay.

## Thứ tự triển khai
1. Khung dự án: Vite + React + TS + PWA (manifest iOS, precache) + theme + tab bar
2. Domain + DB (TDD): dayKey, ensureToday, growth, random, timeOfDay, khoá ngày cũ, backup/merge
3. Hệ thống hình ảnh: registry, Face, 6 cây × 4 giai đoạn, 6 chậu, cây héo, hạt ôm gối, 5 hiệu ứng
4. Màn Hôm nay + hoạt ảnh
5. Màn Lịch
6. Màn Mẫu + Cài đặt
7. Hoàn thiện giao diện, icon, hướng dẫn cài, deploy GitHub Pages

## Kiểm thử / xác minh
- **Vitest**:
  - `stageFor` ở các mốc 0 / 1 / 50% / 100% / 0 todo
  - `dayKey` quanh 3:59 và 4:00
  - `ensureToday` chạy 2 lần vẫn chỉ ra 1 record, copy đúng mẫu
  - tỉ lệ cây đặc biệt khoảng 10% (RNG có seed)
  - ranh giới giờ của `timeOfDay`
  - chặn sửa ngày cũ
  - backup → restore khứ hồi giống hệt; gộp theo `updatedAt`
- **Playwright** (giả lập "iPhone 14"):
  - tick todo → cây đổi giai đoạn
  - reload vẫn còn dữ liệu
  - giả lập đồng hồ sang ngày mới → cây mới + mẫu tự lên + câu chào
  - bật ngày nghỉ → lịch hiện hạt ngủ
  - ngày bỏ trống hiện cây héo
  - `setOffline(true)` → app vẫn mở được
- **iPhone thật**: cài từ GitHub Pages → bật chế độ máy bay vẫn chạy; chọn ảnh nền; backup ra Tệp rồi restore.
