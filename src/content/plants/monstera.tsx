import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { SOIL_Y, Seed, Sprout } from './parts';

const STEM = '#6FAE62';
const LEAF = '#4FAE6A';
const LEAF_BACK = '#3F9A5B';
const VEIN = '#2F7A45';

/** Lá monstera hướng lên, tâm ở (0,0), cuống gắn ở (0,20): mỗi bên 2 khe xẻ */
const LEAF_D =
  'M0 20 C10 26 26 22 30 8 L13 4 L31 -4 C31 -12 28 -16 25 -18 L11 -10 L21 -24 C14 -30 6 -31 0 -30 ' +
  'C-6 -31 -14 -30 -21 -24 L-11 -10 L-25 -18 C-28 -16 -31 -12 -31 -4 L-13 4 L-30 8 C-26 22 -10 26 0 20 Z';
/** Hai lỗ cạnh gân giữa (cắt thủng nhờ fillRule evenodd) */
const HOLES_D = 'M6 -7 A2.2 3.5 0 1 1 6 0 A2.2 3.5 0 1 1 6 -7 Z M-6 -7 A2.2 3.5 0 1 1 -6 0 A2.2 3.5 0 1 1 -6 -7 Z';

/** Một lá kèm cuống mọc từ gốc (100, 160). `plain`: không lỗ, không gân (lá mang mặt). */
function Leaf({ x, y, r = 0, s = 1, fill = LEAF, plain }: { x: number; y: number; r?: number; s?: number; fill?: string; plain?: boolean }) {
  const rad = (r * Math.PI) / 180;
  const bx = x - 20 * s * Math.sin(rad);
  const by = y + 20 * s * Math.cos(rad);
  const cx = 100 + (bx - 100) * 0.35;
  const cy = by + (SOIL_Y - by) * 0.6;
  return (
    <g>
      <path d={`M100 ${SOIL_Y} Q${cx} ${cy} ${bx} ${by}`} stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
        <path d={plain ? LEAF_D : LEAF_D + ' ' + HOLES_D} fillRule="evenodd" fill={fill} stroke={INK} strokeWidth={2 / s} strokeLinejoin="round" />
        {!plain && <path d="M0 18 L0 -26" stroke={VEIN} strokeWidth={1.4 / s} strokeLinecap="round" />}
      </g>
    </g>
  );
}

/** Lá non còn cuộn, nhọn như búp */
function RolledLeaf({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <path d={`M100 ${SOIL_Y} Q${100 + (x - 100) * 0.3} ${(SOIL_Y + y) / 2} ${x} ${y + 14}`} stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path
        d="M0 16 C-7 6 -6 -8 0 -18 C6 -8 7 6 0 16 Z"
        transform={`translate(${x} ${y}) rotate(${r})`}
        fill="#8FD08A"
        stroke={INK}
        strokeWidth={1.8}
      />
    </g>
  );
}

function MonsteraSeed() {
  return <Seed color="#8A6A4F" />;
}
function MonsteraSprout() {
  return <Sprout leaf="#8FD08A" stem={STEM} />;
}
function MonsteraBud() {
  return (
    <g>
      <Leaf x={64} y={118} r={-40} s={0.72} fill={LEAF_BACK} />
      <Leaf x={136} y={114} r={40} s={0.72} fill={LEAF_BACK} />
      <RolledLeaf x={124} y={78} r={18} />
      <Leaf x={100} y={94} s={0.72} plain />
    </g>
  );
}
function MonsteraBloom() {
  return (
    <g>
      <Leaf x={44} y={140} r={-80} s={0.7} fill={LEAF_BACK} />
      <Leaf x={156} y={138} r={80} s={0.7} fill={LEAF_BACK} />
      <Leaf x={58} y={100} r={-50} s={0.85} fill={LEAF_BACK} />
      <Leaf x={142} y={96} r={50} s={0.85} fill={LEAF_BACK} />
      <Leaf x={76} y={66} r={-20} s={0.8} />
      <Leaf x={124} y={62} r={20} s={0.8} />
      <Leaf x={100} y={96} s={0.95} plain />
    </g>
  );
}

/** id giữ là 'pothos' (trước đây là Trầu bà) để ngày cũ, sao lưu và cây đặc biệt đã mở khoá vẫn khớp. */
export const monstera: PlantSpecies = {
  id: 'pothos',
  name: 'Monstera',
  defaultPotId: 'mint',
  stages: {
    seed: { svg: MonsteraSeed },
    sprout: { svg: MonsteraSprout },
    bud: { svg: MonsteraBud },
    bloom: { svg: MonsteraBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 90, scale: 0.45 },
    bloom: { x: 100, y: 90, scale: 0.6 },
  },
  sayings: ['Lá xẻ thuỳ của mình vẫy chào bạn nè 🌿', 'Mỗi chiếc lá mới của mình là một bất ngờ đó!'],
  praises: ['Thêm một chiếc lá xẻ mới mọc ra vì bạn đó 🌿'],
  taps: ['Lá mình có lỗ là để đón nắng đó ☀️', 'Mình xoè lá ra ôm bạn nè 💚'],
};
