import type { ReactNode } from 'react';
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
const PINK_PALETTE = { petal: PETAL, deep: PETAL_DEEP, inner: PETAL_IN, curl: '#D94C6E', line: '#F28AA6' };
function RoseHead({ x, y, s = 1, p = PINK_PALETTE }: { x: number; y: number; s?: number; p?: typeof PINK_PALETTE }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {[-160, -120, -60, -20].map((a) => (
        <ellipse key={a} cx={0} cy={-20} rx={12} ry={11} fill={p.deep} strokeWidth={1.6} transform={`rotate(${a + 90})`} />
      ))}
      <ellipse cx={0} cy={-6} rx={22} ry={14} fill={p.inner} strokeWidth={1.8} />
      <path d="M-8 -8 C-6 -16 8 -16 8 -8 C8 -2 -2 -2 -2 -7 C-2 -10 3 -10 3 -7" fill="none" stroke={p.curl} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-26 -4 C-28 16 -14 26 0 26 C14 26 28 16 26 -4 C18 2 8 0 0 4 C-8 0 -18 2 -26 -4 Z" fill={p.petal} strokeWidth={2} />
      <path d="M-22 4 C-20 12 -14 18 -8 20 M22 4 C20 12 14 18 8 20" fill="none" stroke={p.line} strokeWidth={1.4} strokeLinecap="round" />
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

// Cổng vòm: vòm dây leo phủ hồng nhỏ, bông giữa đỉnh vòm mang mặt + vương miện
const ARCH = 'M44 160 L44 100 C44 52 72 34 100 34 C128 34 156 52 156 100 L156 160';
/** điểm dọc vòm (t 0..1 từ chân trái qua đỉnh tới chân phải) */
const archPt = (t: number): [number, number] => {
  const a = Math.PI * (1 - t);
  return [100 + 56 * Math.cos(a), 100 - 64 * Math.sin(a) * (t > 0.08 && t < 0.92 ? 1 : 0.7)];
};
function Arch({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d={ARCH} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={ARCH} fill="none" stroke="#C99A6B" strokeWidth={4.5} strokeLinecap="round" />
      <path d="M44 120 C52 112 40 104 46 96 C54 86 44 76 52 66 C60 56 66 50 76 44 M156 120 C148 112 160 104 154 96 C146 86 156 76 148 66 C140 56 134 50 124 44" fill="none" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      {[0.05, 0.16, 0.27, 0.38, 0.62, 0.73, 0.84, 0.95].map((t, i) => {
        const [x, y] = archPt(t);
        const side = i % 2 ? 1 : -1;
        return (
          <path key={t} d={`M${x} ${y} q${side * 6} -9 ${side * 14} -6 q${-side * 5} 8 ${-side * 14} 6 Z`} fill={LEAF} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        );
      })}
      {children}
    </g>
  );
}
function RoseArchBud() {
  return (
    <Arch>
      {[0.15, 0.3, 0.42, 0.58, 0.7, 0.85].map((t) => {
        const [x, y] = archPt(t);
        return <MiniBud key={t} x={x} y={y} />;
      })}
      <MiniBud x={100} y={36} c={PETAL_DEEP} />
      <Tiara x={98} y={26} s={0.55} />
    </Arch>
  );
}
function RoseArchBloom() {
  return (
    <Arch>
      {[0.1, 0.22, 0.34, 0.66, 0.78, 0.9].map((t) => {
        const [x, y] = archPt(t);
        return <RoseHead key={t} x={x} y={y} s={0.36} />;
      })}
      <RoseHead x={100} y={38} s={0.62} />
      <Tiara x={96} y={18} s={0.7} />
    </Arch>
  );
}

// Chuông kính: một bông hồng xanh đêm lơ lửng trong chuông kính lấp lánh
const NIGHT = { petal: '#7FA6E8', deep: '#4E6FC4', inner: '#5F86D6', curl: '#2F4B99', line: '#A9C4F2' };
const DOME = 'M60 160 L60 86 C60 44 80 28 100 28 C120 28 140 44 140 86 L140 160';
function Dome({ children }: { children: ReactNode }) {
  return (
    <g>
      <path d={DOME + ' Z'} fill="#E3F4FF" opacity={0.45} />
      {children}
      <path d={DOME} fill="none" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M68 140 L68 88 C68 62 76 46 88 38" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.85} />
      <ellipse cx={100} cy={160} rx={42} ry={4} fill="#C7E6F7" stroke={INK} strokeWidth={2} />
      <circle cx={100} cy={22} r={6} fill="#E3F4FF" stroke={INK} strokeWidth={2} />
      {[[124, 58], [80, 118], [128, 124]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - 5} L${x + 1.5} ${y - 1.5} L${x + 5} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 5} L${x - 1.5} ${y + 1.5} L${x - 5} ${y} L${x - 1.5} ${y - 1.5} Z`} fill="#FFF3B0" stroke={INK} strokeWidth={0.8} />
      ))}
    </g>
  );
}
function RoseDomeBud() {
  return (
    <Dome>
      <path d="M100 158 C96 136 104 118 100 98" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Leaf y={132} side={-1} r={-20} />
      <g transform="translate(100 90) scale(2.2) translate(-100 -90)"><MiniBud x={100} y={90} c={NIGHT.petal} /></g>
    </Dome>
  );
}
function RoseDomeBloom() {
  return (
    <Dome>
      <path d="M100 158 C94 138 106 118 100 100" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Leaf y={136} side={-1} r={-20} />
      <Leaf y={120} side={1} r={-20} />
      <RoseHead x={100} y={78} s={1} p={NIGHT} />
      {[[86, 126], [114, 140]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y} q4 -6 8 0 q-4 5 -8 0 Z`} fill={NIGHT.petal} stroke={INK} strokeWidth={1} />
      ))}
    </Dome>
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
  styles: [
    {
      id: 'arch',
      name: 'Cổng vòm',
      unlockAt: 10,
      stages: { bud: { svg: RoseArchBud }, bloom: { svg: RoseArchBloom } },
      faceAnchor: { bud: { x: 100, y: 37, scale: 0.22 }, bloom: { x: 100, y: 49, scale: 0.42 } },
    },
    {
      id: 'dome',
      name: 'Chuông kính',
      unlockAt: 20,
      stages: { bud: { svg: RoseDomeBud }, bloom: { svg: RoseDomeBloom } },
      faceAnchor: { bud: { x: 100, y: 92, scale: 0.4 }, bloom: { x: 100, y: 93, scale: 0.66 } },
    },
  ],
};
