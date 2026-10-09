# Côn trùng: tỉ lệ con hiếm tăng theo chuỗi ngày làm đủ thói quen

Ngày: 2026-10-09 · Trạng thái: đã triển khai

## Mục tiêu

Thưởng cho người làm thói quen đều đặn: mỗi ngày làm đủ liên tiếp, cơ hội gặp con **Hiếm** và **Rất hiếm** tăng thêm 1%.
Gặp được nhóm nào thì nhóm đó quay về tỉ lệ gốc. Hai bộ đếm Hiếm và Rất hiếm chạy riêng.

## Quy tắc (đã chốt với người dùng)

| Câu hỏi | Chốt |
|---|---|
| Ngày bỏ lỡ (có thói quen có lịch mà không làm đủ) | **Mất hết**: cả hai bộ đếm về 0 |
| +1% cộng vào đâu | **Cả nhóm** (cộng điểm phần trăm vào tổng của nhóm, rồi chia trong nhóm theo `weight`) |
| Có hiện tỉ lệ cho người dùng không | **Không**, để bí mật |

### Tỉ lệ khi bốc con của một ngày

- Tỉ lệ gốc của nhóm là **hằng số riêng** `BASE_ODDS` (không suy từ `weight` nữa):
  - Rất hiếm: **2%** (đã chốt; trước là 2/29 ≈ 6,9%)
  - Hiếm: 6/29 ≈ 20,7% (giữ như cũ)
  - Thường gặp: phần còn lại
- `weight` vẫn giữ, nhưng chỉ dùng để chia con **trong** nhóm và cho `bugFor(date)` của ngày cũ (để các ngày đã qua vẫn hiện đúng con cũ).
- `bonusEpic` = số ngày làm đủ liên tiếp ngay trước hôm nay mà **chưa gặp con Rất hiếm**.
- `bonusRare` = số ngày làm đủ liên tiếp ngay trước hôm nay mà **chưa gặp con Hiếm**.
- `pEpic = min(1, gốcEpic + 1% × bonusEpic)`
- `pRare = min(1 − pEpic, gốcRare + 1% × bonusRare)`
- `pCommon = 1 − pEpic − pRare`
- Bốc nhóm theo các tỉ lệ đó, rồi bốc con trong nhóm theo `weight`.

### Cách đếm chuỗi (đi lùi từ hôm qua)

| Ngày | Bộ đếm Hiếm | Bộ đếm Rất hiếm |
|---|---|---|
| Làm đủ, gặp con thường | +1 | +1 |
| Làm đủ, gặp con Hiếm | dừng (về 0 tính từ đây) | +1 |
| Làm đủ, gặp con Rất hiếm | +1 | dừng (về 0 tính từ đây) |
| **Không làm đủ** (có thói quen có lịch) | **chuỗi đứt: cả hai dừng** | **chuỗi đứt** |
| Không có thói quen nào có lịch / ngày nghỉ | bỏ qua, không cộng, không đứt | bỏ qua |
| Hôm nay chưa làm xong | chưa tính (chỉ ngày đã qua) | |

Ví dụ: làm đủ 10 ngày liền, toàn gặp con thường → hôm nay Hiếm 30,7%, Rất hiếm 12%.
Hôm nay gặp Đom đóm (Hiếm) → mai: Hiếm 20,7%, Rất hiếm 13%.

## Thay đổi lớn: bốc thật và lưu lại

Bỏ cách "bốc sẵn theo ngày" (`bugFor(date)`). Tỉ lệ giờ phụ thuộc lịch sử, nên phải bốc lúc làm đủ rồi lưu:

- **`DayRecord.bugId?: string`**: con của ngày, bốc **một lần** bằng `deps.rng` ngay khi hôm nay vừa thành "làm đủ" (trong `toggleHabit`, cùng transaction).
  - Bỏ tick: con vẫn được lưu nhưng ẩn.
  - Tick lại: hiện đúng con cũ, không bốc lại (không "ăn gian" được).
- Không đổi `SCHEMA_VERSION`, vì trường mới không có index. Sao lưu: thêm `bugId` (tuỳ chọn) vào schema của ngày. Gộp sao lưu theo `updatedAt` như cũ (bốc xong thì cập nhật `updatedAt`).
- **Ngày cũ chưa có `bugId`** (dữ liệu từ trước bản này, hoặc file sao lưu cũ): vẫn dùng `bugFor(date)` như hiện tại để hiển thị và tính chuỗi, nên những gì đã thấy không đổi.
- Bộ đếm **suy ra từ lịch sử lúc bốc**, không lưu riêng: không cần thêm setting, sao lưu tự đúng.
- Thêm loài mới về sau không làm đổi con của các ngày đã bốc.

## Những chỗ đọc "con của ngày"

Đều đổi sang `day.bugId ?? bugFor(date)`:
- `PlantScene` ở Hôm nay, ô Lịch, bảng chi tiết ngày
- Thẻ "Côn trùng đã gặp" (`countBugs`)
- Khung báo "Gặp bạn mới / hiếm ghé thăm" (`metBefore`)

Không hiện tỉ lệ ở đâu cả (theo yêu cầu).

## Con số (mô phỏng, làm đủ mọi ngày, không đứt chuỗi)

| Nhóm | Trước (cố định) | Sau: làm đều, không đứt chuỗi | Sau: hay đứt chuỗi (gần như chỉ tỉ lệ gốc) |
|---|---|---|---|
| Hiếm (gốc 20,7%) | ~4,8 ngày | ~4,2 ngày (90% gặp trong 9 ngày) | ~4,8 ngày làm đủ |
| Rất hiếm (gốc **2%**) | ~14,5 ngày | **~11,3 ngày** (90% gặp trong 20 ngày) | ~50 ngày làm đủ |

Công thức: tỉ lệ ngày thứ k (tính từ lần reset) = gốc + (k − 1) × 1%. P(chưa gặp sau n ngày) = tích các (1 − tỉ lệ ngày). Số ngày trung bình = tổng các P(chưa gặp) trước mỗi ngày.
Cân nhắc đã bàn: phần +1%/ngày lấn át tỉ lệ gốc với người làm đều. Muốn Rất hiếm thưa hơn nữa thì giảm bước cộng (ví dụ +0,5%/ngày); hiện giữ +1% như yêu cầu, đổi sau chỉ là sửa hằng số.

## Các bước triển khai (TDD)

1. **Domain thuần** `domain/bugOdds.ts`:
   - `streakBonus(history)` → `{ rare, epic }`, đi lùi theo bảng trên.
   - `bugOdds(bonus)` → `{ common, rare, epic }`, từ hằng số `BASE_ODDS = { rare: 6/29, epic: 0.02 }` và `STEP = 0.01`.
   - `rollBug(odds, rng)`.
   - Test: chuỗi đứt, ngày nghỉ, bộ đếm riêng, chặn 100%, ngày cũ không có `bugId`.
2. **`toggleHabit`**: vừa thành làm đủ mà ngày chưa có `bugId` → đọc lịch sử, tính tỉ lệ, bốc, ghi `bugId`, tất cả trong một transaction.
   - Bài học cũ: đọc trước, ghi sau, không gọi async lồng nhau trong transaction (`PrematureCommitError`).
   - Test: bốc một lần, tick lại giữ con cũ, RNG `mulberry32(42)` cho kết quả cố định.
3. **Đọc con của ngày**: helper `dayBug(record)`. Sửa Hôm nay / Lịch / chi tiết / bộ sưu tập / khung báo; cập nhật test hiện có.
4. **Sao lưu**: `bugId` trong schema zod; test xuất → khôi phục giữ `bugId`; file cũ vẫn khôi phục được.
5. **E2E WebKit**: tick đủ → có côn trùng; bỏ tick → tick lại vẫn đúng con đó; reload vẫn giữ.
6. Cập nhật CLAUDE.md (mục Côn trùng thưởng, `DayRecord`, định dạng sao lưu).
