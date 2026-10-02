# Chậu Cây Chibi 🌱

App todo nuôi cây chibi cho iPhone — chạy offline, không cần tài khoản, không cần App Store.

## Phát triển
- `npm install`
- `npm run dev`: chạy thử trên máy
- `npm test`: unit test
- `npm run e2e`: test giả lập iPhone 13

## Đưa lên iPhone
1. Đẩy code lên một repo GitHub, vào **Settings → Pages → Source: GitHub Actions**.
2. Mỗi lần push lên `main`, app được build và đăng tại `https://<tên-github>.github.io/<tên-repo>/`.
3. Trên iPhone: mở link bằng **Safari** → **Chia sẻ** → **Thêm vào MH chính**.
4. Nhớ thỉnh thoảng vào **Cài đặt → Sao lưu dữ liệu** và lưu file vào Tệp/iCloud.

## Thêm nội dung
- **Cây mới:** tạo `src/content/plants/<id>.tsx` (export `PlantSpecies`), rồi thêm vào `src/content/plants/registry.ts`.
- **Chậu mới:** thêm component vào `src/content/pots/pots.tsx` (hoặc dùng `{ image }`), rồi thêm 1 dòng vào `src/content/pots/registry.ts`.
- **Hiệu ứng đặc biệt mới:** thêm overlay vào `src/content/specials/specials.tsx`, rồi thêm 1 dòng vào `src/content/specials/registry.ts`.
- **Ảnh PNG thay cho SVG:** đặt file vào `public/plants/<id>/<stage>.png` (khung 200×240, mặt đất ở 2/3 chiều cao) và dùng `{ image: import.meta.env.BASE_URL + 'plants/<id>/<stage>.png' }`.
- Xem trước toàn bộ hình: render `src/dev/ArtGallery.tsx`.
