// Tạo ảnh nguồn cho icon + màn chờ Android từ public/favicon.svg, rồi để @capacitor/assets
// sinh mọi cỡ vào android/app/src/main/res. Chạy: npm run icons:android
import { mkdirSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg', 'utf8');
// bỏ nền hồng bo góc: Android tự cắt icon theo hình của máy (tròn, vuông bo…)
const art = svg.replace(/<rect width="512" height="512"[^>]*\/>/, '');
const PINK = '#FFD6DE';
const CREAM = '#FFF8F0';

/** Đặt hình chậu cây (không nền) vào giữa khung `size`, chiếm `ratio` cạnh. */
async function centered(size, ratio, background) {
  const inner = Math.round(size * ratio);
  const png = await sharp(Buffer.from(art), { density: 600 }).resize(inner, inner).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: png, gravity: 'center' }])
    .png();
}

mkdirSync('assets', { recursive: true });
await sharp(Buffer.from(svg), { density: 600 }).resize(1024, 1024).png().toFile('assets/icon-only.png');
// icon thích ứng: capacitor-assets đã thu lớp này vào 66% ở giữa (inset 16.7%), nên hình chiếm 90% lớp
await (await centered(1024, 0.9, { r: 0, g: 0, b: 0, alpha: 0 })).toFile('assets/icon-foreground.png');
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: PINK } }).png().toFile('assets/icon-background.png');
await (await centered(2732, 0.3, CREAM)).toFile('assets/splash.png');
await (await centered(2732, 0.3, CREAM)).toFile('assets/splash-dark.png');

execSync(
  `npx capacitor-assets generate --android --iconBackgroundColor "${PINK}" --splashBackgroundColor "${CREAM}" --splashBackgroundColorDark "${CREAM}"`,
  { stdio: 'inherit' },
);
