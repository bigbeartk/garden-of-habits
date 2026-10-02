# Chậu Cây Chibi (garden-of-habits)

PWA todo cho iPhone, có phần "nuôi cây": mỗi việc làm xong là một lần tưới cây, cây lớn qua 4 giai đoạn, có lịch dễ thương lưu lại cây của từng ngày.
- Chạy offline, không cần tài khoản, không lên App Store.
- Người dùng chính là vợ của chủ repo, dùng **iPhone 13** (390×844, Safari / PWA cài ra màn hình chính).
- Toàn bộ chữ trên giao diện là **tiếng Việt**.

- Spec gốc: `docs/superpowers/specs/2026-10-02-chibi-plant-todo-design.md`
- Kế hoạch triển khai: `docs/superpowers/plans/2026-10-02-chibi-plant-todo.md`
- Deploy: push `main` lên https://github.com/bigbeartk/garden-of-habits, GitHub Actions chạy test, build rồi đăng lên https://bigbeartk.github.io/garden-of-habits/

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

- Chỉ commit và push khi mọi test đều pass. Nối lệnh bằng `&&`, không dùng `;`.
- Thay đổi giao diện phải chạy E2E trên **WebKit**: Chrome không bắt được lỗi bố cục riêng của Safari.

## Kiến trúc

```
src/
  app/        App (tab + tự sang ngày mới), TabBar, nav (NavContext), deps (DepsContext), theme.css
  domain/     logic thuần TS, test độc lập: dayKey, growth, random, timeOfDay, dayService,
              templateService, calendar, types
  db/         Dexie (db.ts), settings, queries, backup (export/import/merge), share
  content/    NỘI DUNG mở rộng được: plants/, pots/, specials/, common/, Face, ArtView, catalog, greetings
  components/ PlantScene, SkyBackground, TodoList, BottomSheet, DayCell, ...
  screens/    CalendarScreen (màn mở đầu), TodayScreen, TemplatesScreen, SettingsScreen
  hooks/      useNow, useToday, useBackupReminder, useCalendarBg
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
  - todo lấy từ **mẫu mặc định**. Việc chưa xong hôm qua ở lại ngày cũ, không chuyển sang.
- **Giai đoạn cây** tính theo tỉ lệ việc xong trong ngày (`stageFor`):
  - 0 việc xong, hoặc chưa có việc nào → `seed` (hạt giống)
  - ≥ 1 việc → `sprout` (nảy mầm)
  - ≥ 50% → `bud` (ra chồi)
  - 100% → `bloom` (ra hoa)
- **Ngày đã qua bị khoá** (`LockedDayError`): chỉ sửa được ghi chú.
- **Chỉ hôm nay** mới được: thêm/sửa/xoá/tick/sắp xếp todo, đặt **tiêu đề ngày** (`setTitle`), đổi cây, đổi chậu, bật ngày tiết kiệm năng lượng.
- **Tiêu đề ngày** (`title`): ô ở đầu danh sách màn Hôm nay, lưu khi rời ô hoặc Enter, tối đa 60 ký tự. Ngày đã qua chỉ xem được tiêu đề trong bảng chi tiết ngày ở Lịch.
- **Buổi Sáng / Chiều / Tối** (`domain/period.ts`): mỗi todo và mỗi việc trong mẫu có `period`. Màn Hôm nay luôn hiện đủ 3 mục (mục trống ghi "Chưa có việc"); mỗi mục có số việc xong/tổng riêng; mục của buổi hiện tại (`periodOf`: 4–11h sáng, 11–18h chiều, còn lại tối) có viền đậm. Kéo thả chỉ sắp xếp trong cùng một buổi. Cây vẫn lớn theo tỉ lệ việc xong của **cả ngày**.
- **Cây khen:** xong một việc thì cây cười và nói một câu khen khoảng 3,5 giây (`pickPraise`: câu chung `COMMON_PRAISES` + `species.praises`); xong việc cuối cùng (cây vừa ra hoa) thì dùng `BLOOM_PRAISES`. Câu chào đầu ngày và câu khen dùng chung một bong bóng thoại; khung ✨ cây đặc biệt chỉ hiện khi chào.
- **Thêm việc:** nút ＋ nổi cố định ở góc phải dưới, ngay trên thanh tab (không cuộn theo danh sách), mở popup "Thêm việc cần làm" có 3 nút chọn buổi (mặc định là buổi hiện tại, giữ lựa chọn khi thêm liên tiếp). Popup không tự đóng sau mỗi lần thêm, để thêm liên tiếp. Nút bị ẩn trong ngày tiết kiệm năng lượng.
- **Đổi cây:** nếu đang dùng chậu mặc định của cây cũ thì chậu đổi theo cây mới; nếu người dùng đã tự chọn chậu khác thì giữ chậu đó. Không đổi `specialId`.
- **Ngày tiết kiệm năng lượng** (`isRestDay`): todo bị ẩn nhưng vẫn giữ, cây hiện hình hạt giống ôm gối ngủ.
- **Chào hỏi:** lần đầu trong ngày (`greetedAt === null`), App tự chuyển sang tab Hôm nay, cây nói một câu ngẫu nhiên (câu chung + câu riêng của loài), rồi ghi `greetedAt`. Nếu là cây đặc biệt thì hiện thêm khung ✨ giới thiệu.
- **Lịch:** mỗi ô ngày mang một trạng thái (`dayCellStatus`):

  | Trạng thái | Khi nào |
  |---|---|
  | `plant` | ngày có bản ghi bình thường |
  | `rest` | ngày tiết kiệm năng lượng |
  | `missed` | không có bản ghi, nằm sau ngày dùng app đầu tiên → **cây héo** |
  | `before-start` | trước ngày dùng app đầu tiên → ô trống |
  | `today-pending` | hôm nay nhưng chưa có bản ghi |
  | `future` | ngày tương lai |

  Không đi tới được các tháng sau tháng hiện tại.
- **Nền theo giờ** (`timeOfDay`): sáng 4–11h, trưa 11–14h, chiều 14–18h, tối 18–4h.
- **Nhắc sao lưu:** khi đã quá 7 ngày kể từ lần sao lưu cuối, hoặc kể từ dữ liệu cũ nhất nếu chưa sao lưu lần nào.

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
  name: string;                                      // 'Hướng dương'
  defaultPotId: string;                              // phải có trong POTS
  stages: Record<'seed'|'sprout'|'bud'|'bloom', Art>;
  faceAnchor: Record<'seed'|'sprout'|'bud'|'bloom', FaceAnchor>;
  greetings?: string[];                              // câu chào riêng
  praises?: string[];                                // câu khen riêng khi xong việc
}
```
**Thêm cây mới** gồm 3 bước:
1. Tạo `src/content/plants/<id>.tsx` export một `PlantSpecies`. Dùng lại các phần có sẵn trong `plants/parts.tsx`: `Seed`, `Sprout`, `LeafyStem`, `Trunk`, `Canopy`, `HeartLeaf`.
2. Thêm loài vào mảng `PLANTS` trong `src/content/plants/registry.ts`.
3. Chạy `npm test`. `tests/unit/content/plants.test.tsx` kiểm tra đủ 4 giai đoạn, chậu mặc định có tồn tại, và mỗi loài có chậu mặc định khác nhau.

Lưu ý: test này cũng cố định danh sách 6 loài ban đầu, nên thêm loài thì phải cập nhật danh sách trong test.

Các loài hiện có:

| id | Tên | Chậu mặc định |
|---|---|---|
| `sunflower` | Hướng dương | `terracotta` |
| `corn` | Ngô | `rattan` |
| `cactus` | Xương rồng | `pink-cup` |
| `pothos` | Trầu bà | `mint` |
| `orange` | Cây cam | `wood` |
| `cherry` | Cherry | `polka` |

Hình dùng chung cho mọi loài: `common/SleepingSeed.tsx` (ngày nghỉ) và `common/WiltedPlant.tsx` (ngày bỏ lỡ).

### Chậu: `PotStyle`
```ts
interface PotStyle { id: string; name: string; art: Art }
```
**Thêm chậu mới:** vẽ component trong `src/content/pots/pots.tsx` (nên dùng `BasicPot({ body, rim, soil?, children })` cho chậu hình thang, `children` là hoạ tiết trên thân), hoặc dùng `{ image }`. Sau đó thêm một dòng vào `POTS` trong `pots/registry.ts`.

Chậu hiện có: `terracotta` (Đất nung, mặc định chung), `polka` (Sứ chấm bi), `mint` (Gốm mint), `rattan` (Giỏ mây), `wood` (Hộp gỗ), `pink-cup` (Cốc hồng).

### Hiệu ứng đặc biệt: `SpecialVariant`
```ts
interface SpecialVariant {
  id: string; name: string;
  weight: number;            // trọng số khi đã trúng 10%
  Overlay: FC;               // vẽ đè lên cây
  Underlay?: FC;             // vẽ sau chậu và cây
  plantFilter?: string;      // CSS filter cho lớp cây
  plantClassName?: string;   // class CSS động cho lớp cây (keyframes trong specials.css)
}
```
**Thêm hiệu ứng mới:** viết overlay trong `src/content/specials/specials.tsx` rồi thêm một dòng vào `SPECIALS` trong `specials/registry.ts`.

Hiệu ứng hiện có: `glow` Phát sáng (3), `sparkle` Lấp lánh (3), `rainbow` Cầu vồng (2), `gold` Vàng ròng (1), `crystal` Pha lê (1). Số trong ngoặc là `weight`.

### Fallback (không bao giờ crash)
Với id không còn tồn tại (đã xoá khỏi nội dung, hoặc đến từ file backup của bản mới hơn):
- `getSpecies(id)` trả về loài đầu tiên;
- `getPot(id)` trả về `terracotta`;
- `getSpecial(id)` trả về `null`.

`content/catalog.ts` sinh `CATALOG` (chỉ id, chậu mặc định và weight) cho tầng domain từ 3 registry.

### Ghép cảnh
`components/PlantScene.tsx` vẽ theo thứ tự: Underlay → chậu → cây (hoặc hạt ngủ / cây héo) + mặt → Overlay → lớp phụ (bình tưới, hiệu ứng bung lá).

Các thuộc tính để test bám vào: `data-testid` (mặc định `plant-scene`), `data-plant`, `data-pot`, `data-stage`, `data-mode` (`plant | sleeping | wilted`), `data-special`.

## Cơ sở dữ liệu (IndexedDB qua Dexie)

Tên DB: `chau-cay-chibi`, `SCHEMA_VERSION = 2` (`src/db/db.ts`).

- **v1**: bản đầu tiên.
- **v2**: thêm buổi. Bước `upgrade` gán `period: 'morning'` cho todo cũ và chuyển `items: string[]` của mẫu cũ thành `{ text, period: 'morning' }[]`.

| Bảng | Khoá / index | Nội dung |
|---|---|---|
| `days` | `date` | `DayRecord`, mỗi ngày một bản ghi |
| `templates` | `id`, index `createdAt` | `Template` |
| `settings` | `key` | `{ key, value }` |

```ts
// src/domain/types.ts
type Period = 'morning' | 'afternoon' | 'evening';
interface Todo { id: string; text: string; done: boolean; doneAt: number | null; order: number; period: Period }
interface TemplateItem { text: string; period: Period }

interface DayRecord {
  date: string;              // 'YYYY-MM-DD' theo mốc 4:00
  plantId: string;
  potId: string;
  specialId: string | null;
  isRestDay: boolean;
  title?: string;            // tiêu đề ngày; bản ghi cũ không có → coi là ''
  greetedAt: number | null;  // ms; null = chưa chào hôm nay
  note: string;
  todos: Todo[];             // luôn lưu theo order tăng dần, order = 0..n-1
  finalStage: 'seed' | 'sprout' | 'bud' | 'bloom';  // cập nhật mỗi lần sửa todo
  createdAt: number;
  updatedAt: number;         // dùng khi gộp backup (bản mới hơn thắng)
}

interface Template { id: string; name: string; items: TemplateItem[]; isDefault: boolean; createdAt: number; updatedAt: number }
// chỉ một mẫu được isDefault = true (setDefaultTemplate đảm bảo)

// settings
calendarBg:   { mime: string; data: ArrayBuffer }   // ảnh nền lịch, đã nén JPEG ≤ 1600px
lastBackupAt: number
```

- **Ảnh lưu dạng `ArrayBuffer`, không dùng `Blob`**, vì IndexedDB của Safari xử lý Blob không ổn định.
- **Mọi thao tác sửa một ngày đi qua `mutateDay`** trong `dayService`. Hàm này kiểm tra khoá ngày, sắp xếp và đánh số lại `order`, tính lại `finalStage`, cập nhật `updatedAt`, tất cả trong một transaction.
- **Khi đổi cấu trúc dữ liệu:** thêm `this.version(2).stores(...).upgrade(...)` và tăng `SCHEMA_VERSION`. **Không sửa `version(1)`.**

## Format file sao lưu

Tên file: `chau-cay-backup-YYYY-MM-DD.json`. Khi lưu, app mở menu Chia sẻ của iOS; nếu Safari chặn (`NotAllowedError`) thì tải file xuống thay thế.

```json
{
  "format": "chau-cay-chibi-backup",
  "schemaVersion": 2,
  "exportedAt": 1790000000000,
  "days": [DayRecord, ...],
  "templates": [Template, ...],
  "calendarBg": { "mime": "image/jpeg", "base64": "..." } | null
}
```

File phiên bản 1 vẫn khôi phục được: todo thiếu `period` được gán `'morning'`, mẫu có `items` dạng chuỗi được chuyển thành `{ text, period: 'morning' }`.

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
- **Màn Hôm nay:** nửa trên là bầu trời cao `46dvh`. `.sky__content` là khung flex dọc, `.today__stage` có `flex: 1 1 0; min-height: 0`, SVG cây được **định vị tuyệt đối** trong stage.
  - **Không dùng `height: 100%` + `width: auto` cho SVG**: Safari tính sai và đẩy hàng 4 nút ra khỏi khung.
- **Màn Lịch:** căn giữa theo chiều dọc. Khi có ảnh nền, thẻ tháng và lưới ngày nhận class `is-glass` (kính mờ trong suốt, `backdrop-filter`), chữ có viền sáng để dễ đọc.
- **Tôn trọng** `prefers-reduced-motion`, safe-area (`env(safe-area-inset-*)`) và chiều cao `100dvh`.
- **Các label và `data-testid` mà test dựa vào, không đổi tuỳ tiện:**
  - `Tiêu đề hôm nay`, `Thêm việc mới` (nút ＋), popup `Thêm việc cần làm` với radio `Sáng`/`Chiều`/`Tối`, ô `Nội dung việc` + nút `Thêm`, `Hoàn thành: <việc>`, `todo-section-morning|afternoon|evening`
  - Form mẫu: `Việc buổi Sáng|Chiều|Tối (mỗi dòng một việc)`
  - `Đổi cây`, `Đổi chậu`, `Ghi chú`, `Ngày tiết kiệm năng lượng` / `Thức dậy`
  - `＋ Mẫu mới`, `Tên mẫu`, `Đặt làm mặc định: <tên>`
  - `💾 Sao lưu dữ liệu`
  - `day-YYYY-MM-DD` (+ `data-status`), `calendar-card`, `calendar-head`, `speech-bubble`, `special-intro`, `rest-message`

## Lỗi nhỏ đã biết (chưa sửa)

- Lúc vừa qua 4:00, màn Hôm nay có thể hiện ngày cũ trong chốc lát. Nếu NoteSheet đang mở đúng lúc đó, ghi chú sẽ lưu vào ngày mới.
- Để app mở qua sang tháng mới thì lịch vẫn ở tháng cũ.
- `setDefaultTemplate` / `deleteTemplate` / `file.text()` thiếu `.catch`, nên lỗi không hiện thông báo.
- Trợ năng: sửa todo bằng cách chạm vào `<span>`; BottomSheet chưa giữ focus và chưa xử lý Escape; `user-scalable=no`; chưa có cách sắp xếp lại không cần kéo thả.
- Regex ngày trong file backup chấp nhận cả ngày không tồn tại.
- Emoji 🪴 (nút đổi chậu) không hiển thị trên Chrome Windows, trên iPhone thì bình thường.
