import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const LEAF = '#7FC27A';
const VEIN = '#5E9E5A';
const STEM = '#5E9E5A';
const PETAL = '#FF9DB5';
const PETAL_DEEP = '#F2789A';
const PETAL_IN = '#FF7FA0';
const GOLD = '#F6C945';
const PEARL = '#FFFDF4';
const SATIN = '#FFB8CB';

/** Cành thanh mảnh hơi uốn, có hai gai nhỏ */
function Stem({ top }: { top: number }) {
  const mid = (SOIL_Y + top) / 2;
  return (
    <g>
      <path d={`M100 ${SOIL_Y} C94 ${mid + 10} 106 ${mid - 10} 100 ${top}`} stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={`M98 ${mid + 14} l-6 -1 l5 5 Z M102 ${mid - 8} l6 -1 l-5 5 Z`} fill={STEM} stroke={INK} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  );
}

/** Lá hồng thon, mũi nhọn, có gân giữa; cuống gắn vào cành ở (100, y) */
function Leaf({ y, side, r = 0 }: { y: number; side: 1 | -1; r?: number }) {
  return (
    <g transform={`translate(100 ${y}) scale(${side} 1) rotate(${r})`}>
      <path d="M0 0 L8 -2" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M6 -2 C14 -12 28 -12 36 -6 C28 2 14 4 6 -2 Z" fill={LEAF} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M8 -3 C18 -6 26 -6 33 -6" stroke={VEIN} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Nơ satin thắt trên cành, hai đuôi buông */
function Bow({ y, s = 1 }: { y: number; s?: number }) {
  return (
    <g data-part="bow" transform={`translate(100 ${y}) scale(${s})`} stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <path d="M-2 2 L-9 16 L-5 14 L-3 18 Z M2 2 L9 16 L5 14 L3 18 Z" fill={SATIN} />
      <path d="M-2 0 C-10 -10 -20 -8 -18 0 C-20 8 -10 10 -2 0 Z" fill={SATIN} />
      <path d="M2 0 C10 -10 20 -8 18 0 C20 8 10 10 2 0 Z" fill={SATIN} />
      <path d="M-14 -2 q4 -3 8 0 M14 -2 q-4 -3 -8 0" fill="none" stroke="#F28AA6" strokeWidth={1.2} strokeLinecap="round" />
      <rect x={-4} y={-4} width={8} height={8} rx={3} fill="#FF9DB5" />
    </g>
  );
}

/** Vương miện vàng nhỏ đính ngọc trai, đội lệch một chút cho điệu */
function Tiara({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g data-part="tiara" transform={`translate(${x} ${y}) rotate(-12) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M-11 0 L-13 -10 L-6 -5 L0 -14 L6 -5 L13 -10 L11 0 Z" fill={GOLD} />
      <path d="M-11 0 L11 0" stroke="#D9A622" strokeWidth={1.4} />
      {([[-13, -10], [0, -14], [13, -10]] as const).map(([px, py]) => <circle key={px} cx={px} cy={py} r={2.2} fill={PEARL} />)}
      <circle cx={0} cy={-4} r={2} fill="#FF7FA0" />
    </g>
  );
}

/** Bông hồng nở nhiều lớp; cánh trước trơn để mang mặt. Tâm (0,0), bán kính ~26 */
const PAL = { petal: PETAL, deep: PETAL_DEEP, inner: PETAL_IN, curl: '#D94C6E', line: '#F28AA6' };
function RoseHead({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {[-160, -120, -60, -20].map((a) => (
        <ellipse key={a} cx={0} cy={-20} rx={12} ry={11} fill={PAL.deep} strokeWidth={1.6} transform={`rotate(${a + 90})`} />
      ))}
      <ellipse cx={0} cy={-6} rx={22} ry={14} fill={PAL.inner} strokeWidth={1.8} />
      <path d="M-8 -8 C-6 -16 8 -16 8 -8 C8 -2 -2 -2 -2 -7 C-2 -10 3 -10 3 -7" fill="none" stroke={PAL.curl} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-26 -4 C-28 16 -14 26 0 26 C14 26 28 16 26 -4 C18 2 8 0 0 4 C-8 0 -18 2 -26 -4 Z" fill={PAL.petal} strokeWidth={2} />
      <path d="M-22 4 C-20 12 -14 18 -8 20 M22 4 C20 12 14 18 8 20" fill="none" stroke={PAL.line} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

function RoseSeed() {
  return <Seed color="#B07A5A" />;
}
function RoseSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function RoseBud() {
  return (
    <g>
      <Stem top={92} />
      <Leaf y={138} side={-1} r={-10} />
      <Leaf y={118} side={1} r={-14} />
      <Bow y={130} s={0.8} />
      <g stroke={INK} strokeLinejoin="round">
        <path d="M100 96 C84 92 82 72 88 62 C92 56 96 52 100 48 C104 52 108 56 112 62 C118 72 116 92 100 96 Z" fill={PETAL} strokeWidth={2} />
        <path d="M100 48 C96 58 98 66 106 70" fill="none" stroke="#F28AA6" strokeWidth={1.6} strokeLinecap="round" />
        <path d="M100 96 L86 88 L92 100 Z M100 96 L114 88 L108 100 Z" fill={LEAF} strokeWidth={1.6} />
      </g>
      <Tiara x={98} y={52} s={0.7} />
    </g>
  );
}
function RoseBloom() {
  return (
    <g>
      <Stem top={100} />
      <Leaf y={146} side={-1} r={-8} />
      <Leaf y={124} side={1} r={-14} />
      <Leaf y={110} side={-1} r={-24} />
      <Bow y={134} />
      <RoseHead x={100} y={76} s={1.2} />
      <Tiara x={94} y={44} s={1.05} />
    </g>
  );
}

// ---- Dáng mở khoá ----

/** Nụ hồng nhỏ khép cánh */
function MiniBud({ x, y, c = PETAL }: { x: number; y: number; c?: string }) {
  return (
    <g stroke={INK} strokeLinejoin="round">
      <path d={`M${x} ${y + 6} C${x - 6} ${y + 4} ${x - 6} ${y - 4} ${x} ${y - 7} C${x + 6} ${y - 4} ${x + 6} ${y + 4} ${x} ${y + 6} Z`} fill={c} strokeWidth={1.4} />
      <path d={`M${x} ${y + 6} l-5 -3 l2 5 Z M${x} ${y + 6} l5 -3 l-2 5 Z`} fill={LEAF} strokeWidth={1.1} />
    </g>
  );
}

// Cành ba bông (id vẫn là 'arch', tên cũ Cổng vòm, để giữ dáng đã mở trong dữ liệu cũ):
// một cành cao chẻ hai nhánh, ba bông hồng nhìn từ trên, bông đỉnh to mang mặt; không phụ kiện

/** Hồng nhìn từ trên: viền vỏ sò, cánh cuộn ở nửa trên, nửa dưới trơn mang mặt (mặt ở (x, y + 7s), cỡ 0.5s) */
function TopRose({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={15 * Math.cos(a)} cy={15 * Math.sin(a)} r={11} fill={PETAL_DEEP} strokeWidth={1.7} />;
      })}
      <circle r={19} fill={PETAL} strokeWidth={1.7} />
      <path d="M-14 -6 C-12 -16 -4 -18 2 -18 C10 -18 14 -12 14 -6" fill="none" stroke="#D94C6E" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M-8 -9 C-7 -15 5 -16 8 -10 C4 -12 -3 -12 -8 -9 Z" fill="#FFC4D3" stroke="#D94C6E" strokeWidth={1.4} />
      <path d="M-2 -12 C-1 -15 4 -15 4 -12" fill="none" stroke="#D94C6E" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}
/** Lá rời gắn vào cành ở (x, y), xoay r độ */
function SprayLeaf({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 0 C6 -10 20 -10 26 -4 C20 4 6 6 0 0 Z" fill={LEAF} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M2 -1 C10 -4 18 -4 23 -4" stroke={VEIN} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </g>
  );
}
function RoseSprayBud() {
  return (
    <g>
      <path d="M100 160 C96 136 104 112 100 92" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M100 132 C90 126 80 122 72 112 M101 116 C110 110 120 108 128 98" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      {([[99, 150, 200], [101, 142, -20], [86, 126, 190], [114, 110, -30]] as const).map(([x, y, r]) => <SprayLeaf key={`${x}-${y}`} x={x} y={y} r={r} />)}
      <g transform="translate(70 110) scale(1.3) translate(-70 -110)"><MiniBud x={70} y={108} /></g>
      <g transform="translate(130 96) scale(1.3) translate(-130 -96)"><MiniBud x={130} y={94} /></g>
      <g stroke={INK} strokeLinejoin="round" transform="translate(100 78) scale(0.72) translate(-100 -78)">
        <path d="M100 96 C84 92 82 72 88 62 C92 56 96 52 100 48 C104 52 108 56 112 62 C118 72 116 92 100 96 Z" fill={PETAL} strokeWidth={2.4} />
        <path d="M100 48 C96 58 98 66 106 70" fill="none" stroke="#F28AA6" strokeWidth={1.8} strokeLinecap="round" />
        <path d="M100 96 L86 88 L92 100 Z M100 96 L114 88 L108 100 Z" fill={LEAF} strokeWidth={1.8} />
      </g>
    </g>
  );
}
function RoseSprayBloom() {
  return (
    <g>
      <path d="M100 160 C96 130 104 100 100 72" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M100 124 C88 116 74 112 64 100 M101 106 C112 100 126 96 136 84" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      {([[99, 148, 200], [101, 138, -20], [82, 116, 190], [118, 98, -30], [99, 90, 210]] as const).map(([x, y, r]) => <SprayLeaf key={`${x}-${y}`} x={x} y={y} r={r} />)}
      <TopRose x={62} y={96} s={0.55} />
      <TopRose x={138} y={80} s={0.58} />
      <TopRose x={100} y={57} s={1.05} />
    </g>
  );
}

// Hồng bắp cải (id vẫn là 'dome', tên cũ Chuông kính, để giữ dáng đã mở trong dữ liệu cũ):
// một bông cầu nhiều lớp cánh tròn trên cành cao, lòng trơn mang mặt; không phụ kiện

/** Bông cầu: hai vòng cánh tròn xếp chồng + lòng trơn bán kính 13 (mặt ở tâm) */
function CabbageHead({ x, y, s }: { x: number; y: number; s: number }) {
  const ring = (n: number, rr: number, r: number, fill: string, off = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + off;
      return <circle key={`${rr}-${i}`} cx={rr * Math.cos(a)} cy={rr * Math.sin(a)} r={r} fill={fill} strokeWidth={1.6} />;
    });
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {ring(11, 20, 9, PETAL_DEEP)}
      {ring(9, 13, 8, PETAL, 0.3)}
      <circle r={13} fill="#FFC4D3" strokeWidth={1.6} />
      <path d="M-9 -6 q4 -5 9 -3 M2 -9 q5 0 7 4" fill="none" stroke="#D94C6E" strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}
function RoseCabbageBud() {
  return (
    <g>
      <path d="M100 160 C96 140 104 124 100 108" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Leaf y={142} side={-1} r={-14} />
      <Leaf y={128} side={1} r={-18} />
      <g transform="translate(100 92)" stroke={INK} strokeLinejoin="round">
        <path d="M0 16 L-14 10 L-8 20 Z M0 16 L14 10 L8 20 Z M0 18 L-4 26 L4 26 Z" fill={LEAF} strokeWidth={1.6} />
        <circle r={19} fill={PETAL_DEEP} strokeWidth={2} />
        <path d="M-17 -2 C-12 -14 12 -14 17 -2 C10 -6 -10 -6 -17 -2 Z" fill={PETAL} strokeWidth={1.6} />
        <path d="M-9 -10 C-5 -18 5 -18 9 -10" fill="none" stroke="#D94C6E" strokeWidth={1.5} strokeLinecap="round" />
      </g>
    </g>
  );
}
function RoseCabbageBloom() {
  return (
    <g>
      <path d="M100 160 C96 140 104 120 100 100" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Leaf y={142} side={1} r={-14} />
      <Leaf y={130} side={-1} r={-14} />
      <CabbageHead x={100} y={84} s={1.5} />
    </g>
  );
}

export const rose: PlantSpecies = {
  id: 'rose',
  name: { vi: 'Hoa hồng', en: 'Rose' },
  defaultPotId: 'rose-porcelain',
  faceStyle: 'lady',
  stages: {
    seed: { svg: RoseSeed },
    sprout: { svg: RoseSprout },
    bud: { svg: RoseBud },
    bloom: { svg: RoseBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 78, scale: 0.5 },
    bloom: { x: 100, y: 94, scale: 0.8 },
  },
  sayings: {
    vi: ['Chào cưng, hôm nay mình cùng toả sáng nha 💖', 'Quý cô hoa hồng đã sẵn sàng, còn bạn thì sao? 🌹'],
    en: ['Hello darling, let\'s shine together today 💖', 'Lady Rose is ready. Are you, my dear? 🌹'],
  },
  praises: {
    vi: ['Tuyệt vời, đúng chuẩn quý cô 💅', 'Thanh lịch và giỏi giang, là bạn đó 🌹'],
    en: ['Marvelous, darling — truly ladylike 💅', 'Elegant and capable — that is you 🌹'],
  },
  taps: {
    vi: ['Ối, nhẹ tay thôi, vương miện lệch bây giờ 👑', 'Gai của mình là để giữ phong thái đó nha 🌹', 'Hôn gió một cái nè 💋'],
    en: ['Oh! Gently, darling, my crown will slip 👑', 'My thorns are simply for poise, dear 🌹', 'Mwah — a blown kiss for you 💋'],
  },
  styles: [
    {
      id: 'arch',
      name: { vi: 'Cành ba bông', en: 'Triple bloom' },
      unlockAt: 10,
      stages: { bud: { svg: RoseSprayBud }, bloom: { svg: RoseSprayBloom } },
      faceAnchor: { bud: { x: 100, y: 78, scale: 0.36 }, bloom: { x: 100, y: 64, scale: 0.52 } },
    },
    {
      id: 'dome',
      name: { vi: 'Hồng bắp cải', en: 'Cabbage rose' },
      unlockAt: 20,
      stages: { bud: { svg: RoseCabbageBud }, bloom: { svg: RoseCabbageBloom } },
      faceAnchor: { bud: { x: 100, y: 99, scale: 0.34 }, bloom: { x: 100, y: 86, scale: 0.42 } },
    },
  ],
};
