# Spec: 4 loài cây mới, mở khoá bằng ngày ra hoa

## Context
Sổ phác thảo đã có 4 loài mới (Cà chua, Việt quất, Cúc hoạ mi, Dâu tây), mỗi loài 3 bản vẽ. Đưa cả 4 vào app như phần thưởng sưu tầm: ban đầu **bị khoá**, cứ đủ **30 ngày ra hoa** (cộng dồn, mọi loài) thì người dùng được **tự chọn mở 1 cây**. Mỗi loài có Gốc + 2 dáng mở khoá như 9 loài cũ.

## Các quyết định đã chốt
| Chủ đề | Quyết định |
|---|---|
| Ngày được tính | `finalStage === 'bloom'` và không phải ngày nghỉ, của **mọi loài**, mọi dáng, kể cả ngày cây đặc biệt |
| Lịch sử cũ | **Có tính**: người dùng lâu năm có thể có sẵn vài lượt ngay khi cập nhật |
| Hôm nay | Tính nếu hôm nay đang ra hoa (bỏ tick thì lượt chưa dùng tụt theo; cây đã mở thì không) |
| Mốc | Lượt mở thứ k cần `30 × k` ngày ra hoa; tối đa 4 lượt (= số loài khoá) |
| Chọn cây | **Người dùng tự chọn** cây muốn mở trong bảng Đổi cây |
| Mở rồi thì giữ | Có, lưu ở setting `unlockedPlants` |
| Cây khoá | Không bốc cho ngày mới (kể cả lượt cây đặc biệt), không chọn được, ẩn khỏi Khu vườn |
| Báo | Khung mừng ~5 giây **chỉ khi hôm nay vừa chuyển sang ra hoa và đúng lúc đó đủ thêm một mốc**; đủ mốc nhờ lịch sử thì chỉ hiện chấm đỏ |
| Dáng mở khoá | Bản phác thảo không được chọn làm dáng 2 (10 ngày) và dáng 3 (20 ngày), luật mở dáng như loài cũ |

## Nội dung 4 loài
| id | Tên (vi / en) | Gốc | Dáng 2 · 10 ngày | Dáng 3 · 20 ngày | Chậu mặc định | Kiểu mặt |
|---|---|---|---|---|---|---|
| `tomato` | Cà chua / Tomato | T1 thân móc câu | T2 cành cong ôm quả | T3 cọc tre | `pink-cup` | `doll` (E6 + M3) |
| `blueberry` | Việt quất / Blueberry | B2 cặp đôi | B3 cây nhánh | B1 chùm quả | `cat` | `sparkle` (E4 + M0) |
| `daisy` | Cúc hoạ mi / Daisy | D2 bó cúc | D3 đèn nến | D1 một bông | `glass-bowl` | `happy` (E5 + M3) |
| `strawberry` | Dâu tây / Strawberry | S3 dâu khổng lồ | S2 bụi thấp | S1 cành treo quả | `basket` (mới) | `cheeky` (E7 + M4) |

- Hình chép từ `src/dev/sketch/{tomato,blueberry,daisy,strawberry}.tsx` sang `src/content/plants/<id>.tsx`; giữ file phác thảo, ghi bản đã chọn. Hạt / mầm vẽ bằng `Seed` / `Sprout` với màu riêng của loài.
- Tên id dáng (tiếng Anh, ngắn): cà chua `arch`, `staked`; việt quất `branchy`, `cluster`; cúc `candelabra`, `single`; dâu `patch`, `twig`. Tên hiển thị vi/en viết theo bản phác thảo.
- **Ngoại lệ dáng do chủ repo chọn** (ghi vào CLAUDE.md): dáng `staked` gần cột xương rồng, `cluster` gần khối cầu của cam, `single` trùng dáng Gốc của Hướng dương. Chỉ là dáng mở khoá, Gốc của cả 4 loài đều khác mọi loài cũ.
- **Mặt mới** (`FaceStyle` thêm `doll | sparkle | happy | cheeky`) chép từ các mắt/miệng E4–E7, M0/M3/M4 của `src/dev/sketch/faces.tsx` vào `src/content/Face.tsx`, đủ 5 `mood`. Mặt mini trên quả phụ vẽ sẵn trong hình (không đổi nét).
- **Chậu mới `basket` Giỏ đan**: phác thảo trước trong sổ phác thảo cho chủ repo chọn, rồi thêm vào `POTS` (13 chậu).
- **Chữ** mỗi loài, cả vi và en: ≥ 2 lời của ngày (≤ 100 ký tự), ≥ 1 câu khen, ≥ 2 câu khi bị chạm; giọng theo tính cách mặt (búp bê, lấp lánh, hí hửng, tinh nghịch). Viết nháp cho chủ repo duyệt.
- Nội dung loài thêm `locked?: true`; `CATALOG.plants[i].locked` cho tầng domain. Thứ tự trong `PLANTS`: 9 loài cũ rồi tomato, blueberry, daisy, strawberry.

## Dữ liệu
- Setting mới `unlockedPlants: string[]` (id loài đã mở, theo thứ tự mở). Không có = `[]`.
- Sao lưu: trường tuỳ chọn `unlockedPlants` (file cũ không có), `replace` ghi khi file có, `merge` = hợp hai danh sách. **Không** tăng `SCHEMA_VERSION`.
- Xoá toàn bộ dữ liệu: mất `unlockedPlants` như mọi setting khác.

## Domain: `src/domain/plantUnlocks.ts`
```ts
export const PLANT_UNLOCK_EVERY = 30;
/** Số ngày ra hoa (không nghỉ), mọi loài, mọi ngày có bản ghi tính cả hôm nay. */
export async function bloomDayCount(db): Promise<number>;
/** Lượt đã kiếm = min(số loài khoá, floor(bloomDays / 30)). */
export function earnedSlots(bloomDays: number, lockedTotal: number): number;
export interface PlantUnlockState {
  locked: string[];          // id loài khoá chưa mở, theo thứ tự nội dung
  unlocked: string[];        // id loài khoá đã mở
  freeSlots: number;         // max(0, earned - unlocked.length)
  bloomDays: number;
  nextAt: number | null;     // mốc tiếp theo (30, 60…); null khi đã mở hết
}
export async function plantUnlockState(deps: { db; catalog }): Promise<PlantUnlockState>;
/** Mở một loài: phải là loài khoá, chưa mở, và còn lượt; không thì AppError('plantUnlockUnavailable'). */
export async function unlockPlant(deps, plantId: string): Promise<void>;
/** Loài chọn được (cho ensureToday / changePlant): loài không khoá + loài khoá đã mở. */
export async function availablePlants(deps): Promise<CatalogPlant[]>;
```
- `unlockedPlants` lọc bỏ id không còn trong nội dung hoặc không khoá.
- **Bài học Dexie:** `ensureToday` đọc `availablePlants` **trước** transaction (như `listUnlockedStyles`), rồi `pickUniform` trong danh sách đó. Khi chưa có loài khoá nào được mở, danh sách = 9 loài cũ nên **chuỗi random không đổi** với người dùng hiện tại.
- `changePlant` từ chối loài khoá chưa mở: `AppError('plantLocked', { id })` (thêm vào `errors.ts` + `errorText` vi/en).
- Báo mừng: `TodayScreen` giữ `earnedSlots` lần đọc trước; khi hôm nay vừa chuyển sang `bloom` lúc màn đang mở và `earnedSlots` tăng thì hiện khung `plant-unlock-ready` (~5 giây, cùng chỗ khung mừng dáng). Lần đọc đầu tiên khi mở màn không báo.

## Giao diện
- **Bảng Đổi cây & chậu, tab Cây** (`PlantPicker`): mục mới `picker-new-plants` **Cây mới** dưới lưới loài.
  - 4 ô `new-plant-<id>`; loài khoá vẽ dạng ra hoa **mờ + ổ khoá** (`data-locked`), loài đã mở như ô loài thường (chọn được, có nút dáng).
  - Thanh `plant-unlock-progress`: `x/30 ngày ra hoa` tới mốc tiếp theo; đã mở hết thì ẩn.
  - Có lượt (`freeSlots > 0`): dòng `Bạn được mở {n} cây mới, chạm để chọn`; chạm ô khoá → hai nút `Mở khoá: <loài>` / `Thôi` (kiểu `DeleteWithConfirm`). Mở xong: khung mừng `plant-unlocked` ~5 giây, ô thành chọn được (không tự đổi cây hôm nay).
  - Không có lượt: chạm ô khoá chỉ hiện dòng nhắc `Ra hoa thêm {n} ngày để mở` dưới ô (không đổi gì).
  - Ngày nghỉ: tab Cây vẫn khoá như cũ (không mở được cây trong ngày nghỉ).
- **Chấm đỏ** trên nút `Đổi cây & chậu` (màn Hôm nay) khi `freeSlots > 0`.
- **Khu vườn**: bỏ luống của loài khoá chưa mở (`gardenReport` nhận danh sách id hiển thị).
- **Mọi chữ mới** vào `vi.ts` và `en.ts`.

## Kiểm thử
- Unit (viết test đỏ trước):
  - `plantUnlocks`: đếm bỏ ngày nghỉ / ngày chưa ra hoa; 29 → 0 lượt, 30 → 1, 125 → 4; lượt trừ cây đã mở; `unlockPlant` từ chối khi hết lượt, loài thường, loài đã mở; id lạ bị lọc.
  - `ensureToday`: không bao giờ bốc loài khoá; bốc được loài đã mở; chuỗi random cũ không đổi khi chưa mở gì.
  - `changePlant`: từ chối loài khoá.
  - Sao lưu: xuất / khôi phục / gộp `unlockedPlants`; file cũ không có.
  - Nội dung: `plants.test` (danh sách 13 loài, chậu mặc định riêng, đủ dáng), `sayings` / `praises` / `taps` cho 4 loài ở cả hai ngôn ngữ; `Face` đủ 5 mood cho 4 kiểu mới.
- E2E (WebKit, iPhone 13): nạp sao lưu có 30 ngày ra hoa → chấm đỏ → mở Cà chua → chọn Cà chua cho hôm nay; tiếng Anh ở `i18n.spec.ts`. Thêm mục Cây mới vào `layout.spec.ts`.
- Soát hình: ảnh WebKit Khu vườn (đủ 13 loài khi đã mở hết) và lưới Lịch; trang `styles` của sổ phác thảo.

## Ngoài phạm vi
Khoá lại cây, hiện tỉ lệ / số liệu ngoài thanh tiến độ, hiệu ứng đặc biệt mới, thứ tự mở cố định.
