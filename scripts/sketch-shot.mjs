// Chụp một trang của sổ phác thảo (sketch.html) bằng WebKit, tự bật/tắt server Vite.
// Dùng: npm run sketch:shot -- <trang> [ảnh.png] [rộng]
//   vd. npm run sketch:shot -- rose
//       npm run sketch:shot -- "styles&p=rose,tulip" out/styles.png 900
import { createServer } from 'vite';
import { webkit } from '@playwright/test';

const [sheet = '', out = `sketch-${sheet.split('&')[0] || 'index'}.png`, width = '1200'] = process.argv.slice(2);

const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ viewport: { width: Number(width), height: 800 }, deviceScaleFactor: 2 });
  await page.goto(`${url}sketch.html?s=${sheet}`);
  await page.locator('#root > div').waitFor();
  await page.waitForTimeout(800); // font + SVG
  const box = await page.locator('#root > div').boundingBox();
  await page.screenshot({ path: out, fullPage: true, clip: box ?? undefined });
  console.log(`Đã chụp: ${out}`);
} finally {
  await browser.close();
  await server.close();
}
