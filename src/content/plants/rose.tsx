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
function RoseHead({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {[-160, -120, -60, -20].map((a) => (
        <ellipse key={a} cx={0} cy={-20} rx={12} ry={11} fill={PETAL_DEEP} strokeWidth={1.6} transform={`rotate(${a + 90})`} />
      ))}
      <ellipse cx={0} cy={-6} rx={22} ry={14} fill={PETAL_IN} strokeWidth={1.8} />
      <path d="M-8 -8 C-6 -16 8 -16 8 -8 C8 -2 -2 -2 -2 -7 C-2 -10 3 -10 3 -7" fill="none" stroke="#D94C6E" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-26 -4 C-28 16 -14 26 0 26 C14 26 28 16 26 -4 C18 2 8 0 0 4 C-8 0 -18 2 -26 -4 Z" fill={PETAL} strokeWidth={2} />
      <path d="M-22 4 C-20 12 -14 18 -8 20 M22 4 C20 12 14 18 8 20" fill="none" stroke="#F28AA6" strokeWidth={1.4} strokeLinecap="round" />
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

export const rose: PlantSpecies = {
  id: 'rose',
  name: 'Hoa hồng',
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
  sayings: ['Chào cưng, hôm nay mình cùng toả sáng nha 💖', 'Quý cô hoa hồng đã sẵn sàng, còn bạn thì sao? 🌹'],
  praises: ['Tuyệt vời, đúng chuẩn quý cô 💅', 'Thanh lịch và giỏi giang, là bạn đó 🌹'],
  taps: ['Ối, nhẹ tay thôi, vương miện lệch bây giờ 👑', 'Gai của mình là để giữ phong thái đó nha 🌹', 'Hôn gió một cái nè 💋'],
};
