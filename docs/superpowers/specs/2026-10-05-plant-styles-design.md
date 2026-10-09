# Spec: Dáng cây mở khoá (mỗi loài thêm 2 dáng)

## Context
Mỗi loài cây hiện chỉ có một hình. Muốn có thêm động lực "sưu tầm": mỗi loài có **3 dáng** (Gốc + 2 dáng mới). Hai dáng mới **bị khoá** từ đầu, mở dần khi loài đó **ra hoa đủ 10 rồi 20 ngày**. Bảng `Chọn cây hôm nay` có icon để đổi dáng. Dáng chưa mở thì **không cho xem trước**, để người dùng tò mò.

## Các quyết định đã chốt
| Chủ đề | Quyết định |
|---|---|
| Đếm gì | Số ngày có `plantId = X` và `finalStage = 'bloom'`, tính cả ngày cây đặc biệt và mọi dáng của loài. Ngày nghỉ không bao giờ ra hoa nên không tính |
| Mốc | Dáng 2 mở ở **10** ngày ra hoa, dáng 3 mở ở **20** ngày |
| Lịch sử cũ | **Có tính**: loài nào đã ra hoa đủ ngày thì mở khoá ngay khi cập nhật |
| Mở rồi thì giữ | Có. Hôm nay vừa chạm mốc rồi bỏ tick, dáng vẫn mở (lưu ở setting `unlockedStyles`) |
| Hôm nay tính thế nào | (Sửa sau review) phần suy từ lịch sử chỉ đếm **ngày đã qua**; hôm nay chỉ góp khi vừa chuyển sang ra hoa (ghi setting với số = ngày đã qua + 1). Đổi loài trên ngày đã ra hoa không tính cho loài mới |
| Dáng của ngày mới | `ensureToday` **random đều** trong các dáng đã mở của loài vừa tung (kể cả Gốc) |
| Đổi tay | Trong bảng Đổi cây, chỉ hôm nay, chỉ chọn được dáng đã mở |
| Mức khác biệt | **Biến hình hẳn**: dáng (silhouette) khác ở `bud` và `bloom`; `seed` và `sprout` dùng chung bản Gốc |
| Lịch / chi tiết ngày / Hôm nay | Vẽ đúng dáng đã lưu của ngày đó |
| Khu vườn | Không đổi: mỗi loài một luống, vẽ bản Gốc |

## Dữ liệu

### Nội dung (`src/content/types.ts`)
```ts
type StyleStage = 'bud' | 'bloom';
interface PlantStyle {
  id: string;                                  // 'giant' (duy nhất trong loài; 'base' dành cho Gốc)
  name: string;                                // 'Khổng lồ'
  unlockAt: 10 | 20;                           // số ngày ra hoa cần có
  stages: Record<StyleStage, Art>;
  faceAnchor: Record<StyleStage, FaceAnchor>;
  faceStyle?: FaceStyle;                       // không có = theo loài
}
interface PlantSpecies { ...; styles?: PlantStyle[] }   // đúng 2 dáng mỗi loài, theo thứ tự unlockAt
```
- `BASE_STYLE_ID = 'base'`, tên hiển thị `Gốc`.
- `getStageArt(species, styleId, stage)` → `{ art, faceAnchor, faceStyle }`: `seed`/`sprout`, `styleId` là `'base'`/`null`/không tồn tại → bản Gốc. **Không bao giờ crash** (giống fallback của `getSpecies`).
- `CATALOG.plants[i].styles = [{ id, unlockAt }]` cho tầng domain.

### `DayRecord`
- Thêm `styleId?: string`. Không có (bản ghi cũ) = `'base'`.
- Không có index mới nên **không tăng phiên bản Dexie**.
- Mọi chỗ tạo `DayRecord` (`ensureToday`, test helpers) ghi `styleId`.

### Setting `unlockedStyles: string[]`
- Dạng `'plantId|styleId'` (vd. `'sunflower|giant'`), giống `unlockedSpecials`.
- Thêm vào `SettingMap` trong `db/settings.ts`.

## Domain: `src/domain/styleUnlocks.ts` (mới)
- `styleKey({ plantId, styleId })`.
- `bloomCounts(db): Promise<Map<plantId, number>>`: đếm ngày `finalStage === 'bloom'` theo `plantId`.
- `listUnlockedStyles(deps): Promise<Set<string>>` = setting ∪ suy từ `bloomCounts` (mọi dáng có `unlockAt ≤ count`). Bỏ khoá của loài/dáng không còn trong catalog. Gốc luôn được coi là mở, không cần nằm trong set.
- `styleProgress(deps, plantId)` → `{ bloomDays, styles: [{ id, unlockAt, unlocked }] }` cho giao diện.
- `unlockStylesFor(db, catalog, plantId)`: đếm lại rồi ghi các khoá vừa đủ mốc vào setting. Gọi trong transaction có `days` + `settings`.

### Thay đổi trong `dayService`
- **`mutateDay`**: transaction mở rộng thành `db.days, db.settings`. Sau khi tính `finalStage`, nếu ngày là hôm nay và `finalStage === 'bloom'` thì `put` trước, rồi gọi `unlockStylesFor(db, catalog, day.plantId)`.
- **`ensureToday`**: tung loài và đặc biệt **như cũ, giữ nguyên thứ tự gọi RNG**. Sau đó lấy danh sách dáng đã mở của loài (Gốc + đã mở). **Chỉ gọi `rng` khi có ≥ 2 dáng**, nếu không thì `'base'`. Nhờ vậy chuỗi random hiện có và mọi test cố định seed `mulberry32(42)` không bị lệch.
- **`changePlant(deps, date, plantId, specialId = null, styleId = 'base')`**: từ chối dáng chưa mở (`'Dáng cây này chưa mở khoá'`) và dáng không có trong catalog. Ghi `d.styleId`.

## Hiển thị
- `PlantScene` nhận thêm `styleId?: string | null`, dùng `getStageArt`. Thêm thuộc tính `data-style` (giá trị `'base'` khi không có) để test bám vào.
- Truyền `styleId` từ bản ghi ngày ở: `TodayScreen`, `MiniPlant` / `DayCell` (lịch), `DayDetailSheet`. `GardenScreen` và `FutureDayScreen` không đổi.

## Giao diện bảng `Chọn cây hôm nay`

### Lưới loài (giữ như cũ, thêm nút dáng)
- Mỗi ô loài là một khung `div.picker__cell` chứa **nút chọn loài** (như cũ, vẽ bản Gốc, chọn = `changePlant(id, null, 'base')`) và **một nút tròn nhỏ ở góc phải trên**: icon SVG mới `styles` (ba chiếc lá xếp quạt, theo bộ `icons.tsx`), nhãn `Dáng cây: <tên loài>`, kèm chữ nhỏ `1/3`, `2/3` hoặc `3/3` (số dáng đã mở). Không lồng `<button>` trong `<button>`.
- Hôm nay đang dùng dáng khác Gốc thì ô loài đó viền chọn và nút dáng có chấm hồng (`icon-btn__badge`).

### Màn dáng (thay nội dung bảng, không chồng thêm bảng)
- Bấm nút dáng: nội dung bảng chuyển sang danh sách dáng của loài đó, tiêu đề `Dáng của <tên loài>` + nút `BackButton` nhãn `Quay lại chọn cây`. Đăng ký `useBackHandler(…, 'sheet')`: Back của Android quay về lưới loài chứ không đóng bảng. Đóng bảng thì lần mở sau về lưới.
- Dòng tiến độ: `🌸 Đã ra hoa N ngày` + thanh tiến độ tới mốc kế tiếp (`N/10` hoặc `N/20`; đủ cả hai thì ghi `Đã mở hết dáng!`).
- 3 ô, lưới 3 cột (`data-testid="style-<id>"`):
  - **Đã mở:** `PlantScene` dạng `bloom` của dáng đó, chậu mặc định, kèm tên dáng. Bấm = `changePlant(plantId, null, styleId)` rồi đóng bảng. Dáng đang dùng hôm nay có `aria-pressed="true"`.
  - **Chưa mở** (`is-locked`, `aria-disabled`): **không render `PlantScene` và không có hình cây nào trong DOM**. Thay vào đó là chậu đất nung trống có dấu `?` lớn và ổ khoá (SVG tĩnh dùng chung `LockedStyleArt`), tên ghi `Dáng bí ẩn`, dòng dưới `Ra hoa 10 ngày để mở` (hoặc 20). Bấm thì không làm gì; có thể rung nhẹ (tắt khi giảm chuyển động).
- **Cây đặc biệt đã gặp** (mục cũ): chọn cặp thì giữ dáng hôm nay nếu cùng loài, khác loài thì về Gốc.

### Mừng mở khoá (màn Hôm nay)
- `TodayScreen` theo dõi `unlockedStyles` bằng `useLiveQuery`. Khi tập này **tăng thêm trong lúc màn đang mở** (không tính lần nạp đầu), hiện khung `style-unlock` ~5 giây, cùng kiểu với `special-intro`, `pointer-events: none`: `🔓 Mở khoá dáng mới: <Loài> · <Dáng>! Vào Đổi cây để thử nha`. Mở nhiều dáng cùng lúc thì hiện dáng đầu tiên kèm `+N`.
- Dữ liệu cũ đủ mốc từ trước (mở khoá nhờ lịch sử) thì **không** bật khung mừng. Người dùng tự thấy trong bảng.

## Sao lưu
- `DaySchema` thêm `styleId: z.string().optional()`. Zod mặc định bỏ trường lạ, nên bản app cũ đọc file mới chỉ mất dáng, không lỗi.
- `unlockedStyles` vào file sao lưu (tuỳ chọn), xử lý y như `unlockedSpecials`: `replace` ghi đè hoặc xoá, `merge` lấy hợp hai danh sách.
- `schemaVersion` sao lưu giữ **4** (chỉ thêm trường tuỳ chọn).

## Hình vẽ: 18 dáng mới
Quy tắc CLAUDE.md vẫn áp dụng: mỗi dáng **khác dáng mọi loài khác** và khác hai dáng còn lại của chính loài đó ở `bud`/`bloom`. Đồng thời vẫn **nhận ra là loài đó** (giữ màu đặc trưng, kiểu lá, quả). `bud` là bản nhỏ hoặc chưa nở của `bloom`. Mỗi dáng có `faceAnchor` riêng, mặt nằm trên phần to và dễ thấy nhất.

| Loài | Dáng 2 (10 ngày) | Dáng 3 (20 ngày) |
|---|---|---|
| Hướng dương | `giant` **Khổng lồ**: thân cao vồng nhẹ, bông to gật đầu bên phải | `mini` **Mặt trời nhỏ** (trước là Mini): thân ngắn, hai lá sát đất, đầu to tròn hai vòng cánh, lòng vàng nghệ mang mặt |
| Ngô | `popcorn` **Bỏng ngô**: thân ngắn, bắp nổ bung thành đám mây bỏng ngô lổn nhổn | `rainbow` **Cầu vồng**: ba bắp bóc vỏ, hạt nhiều màu, xoè như bó hoa |
| Xương rồng | `bunny` **Tai thỏ**: lá dẹt hình bầu dục chồng lên nhau như tai thỏ, chấm gai | `barrel` **Cầu vàng**: khối cầu thấp có sống dọc, gai vàng, vương miện hoa |
| Monstera | `pole` **Leo cột**: cột rêu thẳng đứng, lá ôm cột leo lên | `trailing` **Rủ**: lá thả rủ tràn qua mép chậu xuống hai bên |
| Cây cam | `kumquat` **Quất Tết**: tán tỉa tròn nhiều tầng, quả nhỏ dày, treo bao lì xì | `bonsai` **Bonsai**: thân xoắn nghiêng, 2–3 tầng tán mây dẹt, vài quả cam |
| Cherry | `weeping` **Bụi** (trước là Rủ): bụi lá tròn thấp, chùm cherry đôi quanh chân, mặt giữa bụi | `lantern` **Cần câu**: thân cong một bên như cần câu, treo một chùm cherry to |
| Hoa hồng | `arch` **Cành ba bông** (trước là Cổng vòm): một cành chẻ hai nhánh, ba bông hồng nhìn từ trên, bông đỉnh mang mặt | `dome` **Hồng bắp cải** (trước là Chuông kính): một bông cầu nhiều lớp cánh tròn, lòng trơn mang mặt |
| Dưa hấu | `square` **Vuông**: quả dưa khối vuông ngồi trên lá | `trellis` **Giàn leo**: giàn thẳng đứng treo nhiều dưa tí hon trong túi lưới |
| Tulip | `parrot` **Hồng** (trước là Vẹt): cùng dáng Gốc, tulip hồng | `bouquet` **Vàng** (trước là Bó hoa): cùng dáng Gốc, tulip vàng |

Soát hình: một trang dev (mở rộng `src/dev/ArtGallery.tsx`, ô cỡ cố định) vẽ đủ 27 dáng × `bud`/`bloom`. Chụp WebKit khổ iPhone 13 và đặt cạnh nhau.

## Kiểm thử
**Unit (TDD):**
- `styleUnlocks`: đếm ngày ra hoa theo loài; suy từ lịch sử; hợp với setting; bỏ khoá lạ; tiến độ.
- `mutateDay`: hôm nay ra hoa lần thứ 10 thì ghi `unlockedStyles`; bỏ tick về 9 ngày thì vẫn giữ; ngày cũ không kích hoạt.
- `ensureToday`: chưa mở dáng nào thì `styleId = 'base'` và **chuỗi RNG giống hệt bản cũ** (các test cũ không đổi); đã mở thì random trong các dáng đã mở.
- `changePlant`: từ chối dáng chưa mở hoặc không tồn tại; ghi `styleId`.
- `getStageArt`: fallback; `seed`/`sprout` luôn là Gốc.
- Nội dung: mỗi loài đủ 2 dáng, id duy nhất, `unlockAt` là 10 rồi 20, đủ `bud`/`bloom` + `faceAnchor`.
- Sao lưu: khứ hồi `styleId` + `unlockedStyles`; file cũ không có vẫn khôi phục được; gộp lấy hợp.
- Picker: ô khoá không có `picker-scene` trong DOM; chọn dáng đã mở gọi đổi cây; Back về lưới.

**E2E (WebKit, iPhone 13):** seed 10 ngày Hướng dương ra hoa → mở bảng Đổi cây → `Dáng cây: Hướng dương` → dáng 2 chọn được và cây Hôm nay có `data-style`, dáng 3 khoá và không có hình cây. Thêm một test mừng mở khoá: ngày thứ 10 tick việc cuối thì thấy `style-unlock`.

## Triển khai theo 2 đợt
1. **Hệ thống + 1 loài mẫu** (Hướng dương đủ 2 dáng): dữ liệu, domain, picker, mừng mở khoá, sao lưu, test. Đợt này phải dùng được trọn vẹn.
   - Loài chưa vẽ dáng thì chưa có `styles`: **ẩn nút dáng**, không mở khoá gì, `ensureToday` luôn cho `'base'`. Vẽ xong loài nào thì thêm `styles` cho loài đó; nhờ đếm từ lịch sử, dáng đủ mốc tự mở ngay (không bật khung mừng).
2. **8 loài còn lại**: mỗi loài một task (vẽ, soát ảnh WebKit, commit).

## Không làm
- Không thêm dáng cho cây héo, hạt ngủ (ngày nghỉ) hay ngày tương lai.
- Không tách luống Khu vườn theo dáng.
- Không cho xem trước dáng khoá dưới bất kỳ hình thức nào (kể cả bóng đen).
