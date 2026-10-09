import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const STEM = '#6FAE62';
const LEAF = '#7FBF6A';
const LEAF_FOLD = '#5E9E52';
const RED = '#F0525A';
const RED_DEEP = '#D63B47';
const RED_LIGHT = '#FF8A8E';

/** Thân mập thẳng từ gốc lên tới đáy bông */
function Stalk({ top }: { top: number }) {
  return <path d={`M100 ${SOIL_Y} C98 ${(SOIL_Y + top) / 2 + 10} 102 ${(SOIL_Y + top) / 2 - 10} 100 ${top}`} stroke={STEM} strokeWidth={7} fill="none" strokeLinecap="round" />;
}

/** Lá tulip to bản mọc từ gốc, xoè ra rồi vểnh mũi; nửa trong tô đậm như lá gập. `side` -1 trái, 1 phải */
function BroadLeaf({ side, tipX, tipY }: { side: 1 | -1; tipX: number; tipY: number }) {
  const dx = tipX - 100;
  const base = SOIL_Y - 2;
  const outer = `M${100 + side * 2} ${base} C${100 + dx * 0.9} ${base - 4} ${tipX + side * 6} ${tipY + 34} ${tipX} ${tipY}`;
  const inner = `C${tipX - side * 4} ${tipY + 26} ${100 + dx * 0.25} ${base - 30} ${100 + side * 2} ${base}`;
  const mid = `M${100 + side * 2} ${base} C${100 + dx * 0.55} ${base - 12} ${tipX + side * 2} ${tipY + 30} ${tipX} ${tipY}`;
  return (
    <g strokeLinejoin="round">
      <path d={`${outer} ${inner} Z`} fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d={`${mid} ${inner} Z`} fill={LEAF_FOLD} stroke="none" />
      <path d={`${outer} ${inner} Z`} fill="none" stroke={INK} strokeWidth={2} />
    </g>
  );
}

/** Bông tulip mũm mĩm hình chén; tâm (0,0) giữa cánh trước, đáy chén ở y = 30 */
const RED_PALETTE = { main: RED, deep: RED_DEEP, light: RED_LIGHT };
function Cup({ p = RED_PALETTE }: { p?: typeof RED_PALETTE }) {
  return (
    <g strokeLinejoin="round" stroke={INK}>
      {/* cánh sau: chỉ lộ mũi nhọn giữa hai cánh bên */}
      <path d="M-15 -14 C-15 -30 -7 -39 0 -39 C7 -39 15 -30 15 -14 Z" fill={p.deep} strokeWidth={2} />
      {/* hai cánh bên ôm lấy cánh trước */}
      <path d="M-4 30 C-26 30 -39 14 -38 -6 C-37 -20 -34 -31 -28 -32 C-21 -33 -13 -20 -10 -4 Z" fill={p.deep} strokeWidth={2} />
      <path d="M4 30 C26 30 39 14 38 -6 C37 -20 34 -31 28 -32 C21 -33 13 -20 10 -4 Z" fill={p.deep} strokeWidth={2} />
      {/* cánh trước mang mặt */}
      <path d="M-28 -8 C-30 14 -18 31 0 31 C18 31 30 14 28 -8 C26 -20 12 -30 0 -32 C-12 -30 -26 -20 -28 -8 Z" fill={p.main} strokeWidth={2.2} />
      {/* gân cánh nhạt + ánh sáng */}
      <g fill="none" stroke={p.light} strokeLinecap="round">
        <path d="M-20 -6 C-22 6 -18 16 -12 22" strokeWidth={2.4} opacity={0.8} />
        <path d="M-12 -24 C-8 -27 -4 -29 0 -29" strokeWidth={2} opacity={0.8} />
        <path d="M-30 -18 C-32 -6 -31 6 -27 14" strokeWidth={2} opacity={0.6} />
        <path d="M30 -18 C32 -6 31 6 27 14" strokeWidth={2} opacity={0.4} />
      </g>
      <ellipse cx={-15} cy={-12} rx={3} ry={6} fill="#fff" stroke="none" opacity={0.55} transform="rotate(25 -15 -12)" />
    </g>
  );
}

/** Nụ tulip còn khép: búp trứng thuôn nhọn, gốc ửng xanh */
function ClosedBud({ p = RED_PALETTE }: { p?: typeof RED_PALETTE }) {
  return (
    <g strokeLinejoin="round" stroke={INK}>
      <path d="M0 22 C-16 22 -20 6 -18 -6 C-16 -22 -7 -31 0 -31 C7 -31 16 -22 18 -6 C20 6 16 22 0 22 Z" fill={p.main} strokeWidth={2} />
      <path d="M-18 -6 C-10 -2 -3 -14 -2 -30 C-9 -28 -16 -18 -18 -6 Z" fill={p.deep} strokeWidth={1.6} />
      <path d="M0 22 C-12 22 -16 14 -17 6 C-10 12 -4 14 0 14 C4 14 10 12 17 6 C16 14 12 22 0 22 Z" fill="#9FCF7E" strokeWidth={1.6} />
      <ellipse cx={8} cy={-8} rx={2.4} ry={5} fill="#fff" stroke="none" opacity={0.5} transform="rotate(-20 8 -8)" />
    </g>
  );
}

function TulipSeed() {
  return <Seed color="#A07A5C" />;
}
function TulipSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function TulipBud({ p = RED_PALETTE }: { p?: typeof RED_PALETTE }) {
  return (
    <g>
      <Stalk top={100} />
      <BroadLeaf side={-1} tipX={60} tipY={104} />
      <BroadLeaf side={1} tipX={142} tipY={110} />
      <g transform="translate(100 82)">
        <ClosedBud p={p} />
      </g>
    </g>
  );
}
function TulipBloom({ p = RED_PALETTE }: { p?: typeof RED_PALETTE }) {
  return (
    <g>
      <Stalk top={104} />
      <BroadLeaf side={-1} tipX={48} tipY={100} />
      <BroadLeaf side={1} tipX={154} tipY={108} />
      <g transform="translate(100 76) scale(1.15)">
        <Cup p={p} />
      </g>
    </g>
  );
}

// ---- Dáng mở khoá: cùng dáng Gốc, chỉ khác màu (theo ý chủ repo; ngoại lệ của quy tắc "khác dáng") ----
// id giữ 'parrot' / 'bouquet' (tên cũ Vẹt / Bó hoa) để dáng đã mở trong dữ liệu cũ vẫn khớp; bản Bó hoa lưu ở src/dev/sketch/tulip.tsx
const PINK_T = { main: '#FF9DB5', deep: '#F2789A', light: '#FFC4D3' };
const YELLOW_T = { main: '#FFD45C', deep: '#F5B83D', light: '#FFF0A8' };
const TulipPinkBud = () => <TulipBud p={PINK_T} />;
const TulipPinkBloom = () => <TulipBloom p={PINK_T} />;
const TulipYellowBud = () => <TulipBud p={YELLOW_T} />;
const TulipYellowBloom = () => <TulipBloom p={YELLOW_T} />;

/** id giữ là 'hydrangea' (trước đây là Cẩm tú cầu) để ngày cũ, sao lưu và cây đặc biệt đã mở khoá vẫn khớp. */
export const tulip: PlantSpecies = {
  id: 'hydrangea',
  name: { vi: 'Tulip', en: 'Tulip' },
  defaultPotId: 'blue-ceramic',
  stages: {
    seed: { svg: TulipSeed },
    sprout: { svg: TulipSprout },
    bud: { svg: TulipBud },
    bloom: { svg: TulipBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 78, scale: 0.6 },
    bloom: { x: 100, y: 90, scale: 1 },
  },
  sayings: {
    vi: ['Bông tulip đỏ xinh xắn chào bạn nè 🌷', 'Hôm nay mình nở thật tươi để cổ vũ bạn đó!'],
    en: ['A pretty red tulip says hello 🌷', 'Today I\'m blooming bright to cheer you on!'],
  },
  praises: {
    vi: ['Thêm một cánh tulip hé nở vì bạn đó 🌷'],
    en: ['Another tulip petal opened up for you 🌷'],
  },
  taps: {
    vi: ['Hihi, nhột cánh hoa mình quá 🌷', 'Bông tulip này tặng bạn nè 💐'],
    en: ['Hehe, that tickles my petals 🌷', 'This tulip is for you 💐'],
  },
  styles: [
    {
      id: 'parrot',
      name: { vi: 'Hồng', en: 'Pink' },
      unlockAt: 10,
      stages: { bud: { svg: TulipPinkBud }, bloom: { svg: TulipPinkBloom } },
      faceAnchor: { bud: { x: 100, y: 78, scale: 0.6 }, bloom: { x: 100, y: 90, scale: 1 } },
    },
    {
      id: 'bouquet',
      name: { vi: 'Vàng', en: 'Yellow' },
      unlockAt: 20,
      stages: { bud: { svg: TulipYellowBud }, bloom: { svg: TulipYellowBloom } },
      faceAnchor: { bud: { x: 100, y: 78, scale: 0.6 }, bloom: { x: 100, y: 90, scale: 1 } },
    },
  ],
};
