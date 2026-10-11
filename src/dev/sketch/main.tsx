import { createRoot } from 'react-dom/client';
import type { ReactNode } from 'react';
import '../../app/theme.css';
import { I18nProvider } from '../../i18n/I18nProvider';
import { StylesGrid } from './kit';
import { BlueberrySketches } from './blueberry';
import { DaisySketches } from './daisy';
import { StrawberrySketches } from './strawberry';
import { PotSketches } from './pots';
import { CherrySketches } from './cherry';
import { FaceSketches } from './faces';
import { Playground } from './playground';
import { RoseSketches } from './rose';
import { SunflowerSketches } from './sunflower';
import { TomatoSketches } from './tomato';
import { TulipSketches } from './tulip';
import { WatermelonSketches } from './watermelon';

/**
 * Sổ phác thảo: chỉ chạy với `npm run dev` (http://localhost:5173/sketch.html), không vào bản build.
 * Chọn trang bằng `?s=<tên>`; chụp WebKit: `npm run sketch:shot -- <tên> [ảnh.png] [rộng]`.
 * Thêm trang mới: viết component trong thư mục này rồi thêm một dòng vào SHEETS (chọn `group`; cần nhóm mới thì thêm vào GROUPS).
 */
/** Nhóm ở mục lục, theo thứ tự hiện */
const GROUPS = {
  tools: 'Công cụ xem thử',
  faces: 'Mặt chibi',
  species: 'Loài khoá (đã vào app, giữ bản phác thảo)',
  pots: 'Chậu',
  styles: 'Dáng mở khoá (đã chốt / lưu trữ bản cũ)',
} as const;

const SHEETS: Record<string, { group: keyof typeof GROUPS; title: string; render: (q: URLSearchParams) => ReactNode }> = {
  playground: { group: 'tools', title: 'Phòng thử: chọn cây / dáng / giai đoạn / chậu / mặt / mắt / miệng / nét mặt', render: () => <Playground /> },
  styles: { group: 'tools', title: 'Mọi loài + dáng mở khoá (?p=rose,hydrangea để lọc; Tulip có id hydrangea)', render: (q) => <StylesGrid only={q.get('p')?.split(',')} /> },
  faces: { group: 'faces', title: 'Mặt chibi: kiểu đang dùng + kiểu mắt / miệng mới × 5 nét mặt (10/2026)', render: () => <FaceSketches /> },
  tomato: { group: 'species', title: 'Cà chua: loài mới theo ảnh mẫu (10/2026)', render: () => <TomatoSketches /> },
  blueberry: { group: 'species', title: 'Việt quất: loài mới theo ảnh mẫu (10/2026)', render: () => <BlueberrySketches /> },
  daisy: { group: 'species', title: 'Cúc hoạ mi: loài mới theo ảnh mẫu (10/2026)', render: () => <DaisySketches /> },
  strawberry: { group: 'species', title: 'Dâu tây: loài mới theo ảnh mẫu (10/2026)', render: () => <StrawberrySketches /> },
  pots: { group: 'pots', title: 'Giỏ đan cho Dâu tây: 3 bản (10/2026)', render: () => <PotSketches /> },
  rose: { group: 'styles', title: 'Hoa hồng: các bản phác thảo dáng 2 / 3 (10/2026)', render: () => <RoseSketches /> },
  sunflower: { group: 'styles', title: 'Hướng dương: dáng 2 kiểu game thủ thành (10/2026)', render: () => <SunflowerSketches /> },
  cherry: { group: 'styles', title: 'Cherry: dáng 2 thay Rủ (10/2026)', render: () => <CherrySketches /> },
  tulip: { group: 'styles', title: 'Tulip: lưu trữ dáng Bó hoa cũ (10/2026)', render: () => <TulipSketches /> },
  watermelon: { group: 'styles', title: 'Dưa hấu: dáng 3 kiểu máy bắn đá (10/2026, chưa dùng)', render: () => <WatermelonSketches /> },
};

function Index() {
  return (
    <div style={{ font: '16px sans-serif' }}>
      {(Object.keys(GROUPS) as (keyof typeof GROUPS)[]).map((g) => (
        <section key={g} style={{ marginBottom: 14 }}>
          <h2 style={{ font: '700 18px sans-serif', margin: '0 0 4px' }}>{GROUPS[g]}</h2>
          <ul style={{ margin: 0 }}>
            {Object.entries(SHEETS).filter(([, s]) => s.group === g).map(([id, s]) => (
              <li key={id}><a href={`?s=${id}`}>{id}</a> · {s.title}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const q = new URLSearchParams(location.search);
const sheet = SHEETS[q.get('s') ?? ''];
createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <div style={{ padding: 10, background: '#D4ECFF', width: 'max-content', minWidth: '100%', boxSizing: 'border-box' }}>
      {sheet ? (
        <>
          {/* nút quay về mục lục; sketch:shot ẩn nó khi chụp */}
          <nav data-sketch-nav style={{ font: '15px sans-serif', marginBottom: 8, display: 'flex', gap: 12, alignItems: 'baseline' }}>
            <a href="?" style={{ fontWeight: 700 }}>← Mục lục</a>
            <span>{sheet.title}</span>
          </nav>
          {sheet.render(q)}
        </>
      ) : <Index />}
    </div>
  </I18nProvider>,
);
