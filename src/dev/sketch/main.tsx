import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import '../../app/theme.css';
import { I18nProvider } from '../../i18n/I18nProvider';
import { StylesGrid } from './kit';
import { CherrySketches } from './cherry';
import { RoseSketches } from './rose';
import { SunflowerSketches } from './sunflower';
import { TulipSketches } from './tulip';
import { WatermelonSketches } from './watermelon';

/**
 * Sổ phác thảo: chỉ chạy với `npm run dev` (http://localhost:5173/sketch.html), không vào bản build.
 * Chọn trang bằng `?s=<tên>`; chụp WebKit: `npm run sketch:shot -- <tên> [ảnh.png] [rộng]`.
 * Thêm trang mới: viết component trong thư mục này rồi thêm một dòng vào SHEETS.
 */
const SHEETS: Record<string, { title: string; render: (q: URLSearchParams) => ReactNode }> = {
  styles: { title: 'Mọi loài + dáng mở khoá (?p=rose,hydrangea để lọc; Tulip có id hydrangea)', render: (q) => <StylesGrid only={q.get('p')?.split(',')} /> },
  rose: { title: 'Hoa hồng: các bản phác thảo dáng 2 / 3 (10/2026)', render: () => <RoseSketches /> },
  sunflower: { title: 'Hướng dương: dáng 2 kiểu game thủ thành (10/2026)', render: () => <SunflowerSketches /> },
  tulip: { title: 'Tulip: lưu trữ dáng Bó hoa cũ (10/2026)', render: () => <TulipSketches /> },
  watermelon: { title: 'Dưa hấu: dáng 3 kiểu máy bắn đá (10/2026, chưa dùng)', render: () => <WatermelonSketches /> },
  cherry: { title: 'Cherry: dáng 2 thay Rủ (10/2026)', render: () => <CherrySketches /> },
};

function Index() {
  return (
    <ul style={{ font: '16px sans-serif' }}>
      {Object.entries(SHEETS).map(([id, s]) => (
        <li key={id}><a href={`?s=${id}`}>{id}</a> · {s.title}</li>
      ))}
    </ul>
  );
}

const q = new URLSearchParams(location.search);
const sheet = SHEETS[q.get('s') ?? ''];
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <div style={{ padding: 10, background: '#D4ECFF', width: 'max-content', minWidth: '100%', boxSizing: 'border-box' }}>
      {sheet ? sheet.render(q) : <Index />}
    </div>
  </I18nProvider>,
);
