import { INK } from '../Face';
import type { PlantSpecies } from '../types';
import { LeafyStem, Seed, Sprout } from './parts';

const LEAF = '#9AD98F';
const STEM = '#7BBF6A';

function SunflowerSeed() {
  return <Seed color="#7A6655" stripe="#F3EDE4" />;
}
function SunflowerSprout() {
  return <Sprout leaf={LEAF} stem={STEM} />;
}
function SunflowerBud() {
  return (
    <g>
      <LeafyStem top={92} leaf={LEAF} stem={STEM} />
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} d="M100 60 q6 8 0 12 q-6 -4 0 -12 z" fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 84)`} />
      ))}
      <circle cx={100} cy={84} r={20} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function SunflowerBloom() {
  return (
    <g>
      <LeafyStem top={100} leaf={LEAF} stem={STEM} />
      {Array.from({ length: 12 }, (_, i) => i * 30).map((a) => (
        <ellipse key={a} cx={100} cy={46} rx={9} ry={17} fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 100 78)`} />
      ))}
      <circle cx={100} cy={78} r={24} fill="#B5835A" stroke={INK} strokeWidth={2} />
    </g>
  );
}

/** Lá to bản ở gốc, nghiêng theo góc r (độ) */
function BigLeaf({ x, y, r, s = 1 }: { x: number; y: number; r: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 Q14 -16 34 -10 Q22 8 0 0 Z" fill={LEAF} stroke={INK} strokeWidth={2} />
      <path d="M3 -1 Q16 -6 28 -9" stroke={STEM} strokeWidth={1.5} fill="none" strokeLinecap="round" />
    </g>
  );
}

// Dáng Mặt trời nhỏ, dáng 3 (20 ngày; id vẫn là 'mini', tên cũ Mini, để giữ dáng đã mở trong dữ liệu cũ):
// thân ngắn mập, hai lá to xoè sát đất, đầu to tròn hai vòng cánh (cam sau, vàng trước), lòng vàng nghệ trơn mang mặt
const SUN_PETAL = '#FFD93B';
const SUN_PETAL_BACK = '#F5A623';
const SUN_DISC = '#F0B04A';
const SUN_DISC_RIM = '#D98B2B';
const SUN_LEAF = '#8FD07F';
const SUN_STEM = '#6CB85A';

/** lá to bản sát đất, gốc ở (100, 158), xoè sang `side` */
function GroundLeaf({ side, r, s = 1 }: { side: 1 | -1; r: number; s?: number }) {
  return (
    <g transform={`translate(100 158) scale(${side * s} ${s}) rotate(${r})`}>
      <path d="M0 0 C10 -18 38 -22 54 -8 C40 4 16 8 0 0 Z" fill={SUN_LEAF} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d="M4 -2 C18 -8 34 -10 48 -8" stroke="#5FA64F" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  );
}
function ShortStem({ top, w }: { top: number; w: number }) {
  const mid = (158 + top) / 2;
  return <path d={`M100 158 C94 ${mid + 8} 106 ${mid - 8} 100 ${top}`} stroke={SUN_STEM} strokeWidth={w} fill="none" strokeLinecap="round" />;
}
function SunflowerMiniBud() {
  const [x, y, r] = [100, 92, 20];
  return (
    <g>
      <GroundLeaf side={-1} r={-6} s={0.85} />
      <GroundLeaf side={1} r={-6} s={0.85} />
      <ShortStem top={100} w={7} />
      {Array.from({ length: 10 }, (_, i) => i * 36).map((a) => (
        <ellipse key={a} cx={x} cy={y - r - 3} rx={5} ry={7} fill={SUN_PETAL} stroke={INK} strokeWidth={1.4} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      {[-40, 0, 40].map((a) => (
        <path key={a} d={`M${x} ${y + r - 4} q-6 8 0 14 q6 -6 0 -14 Z`} fill={SUN_LEAF} stroke={INK} strokeWidth={1.3} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill="#A9DD8E" stroke={INK} strokeWidth={2.2} />
    </g>
  );
}
function SunflowerMiniBloom() {
  const [x, y, r, n] = [100, 80, 28, 14];
  const ring = (off: number, fill: string, len: number) =>
    Array.from({ length: n }, (_, i) => (i * 360) / n + off).map((a) => (
      <ellipse key={`${fill}-${a}`} cx={x} cy={y - r - len * 0.55} rx={len * 0.55} ry={len} fill={fill} stroke={INK} strokeWidth={1.6} transform={`rotate(${a} ${x} ${y})`} />
    ));
  return (
    <g>
      <GroundLeaf side={-1} r={-8} />
      <GroundLeaf side={1} r={-8} />
      <ShortStem top={96} w={8} />
      {ring(180 / n, SUN_PETAL_BACK, r * 0.5)}
      {ring(0, SUN_PETAL, r * 0.42)}
      <circle cx={x} cy={y} r={r + 1.5} fill={SUN_DISC_RIM} stroke={INK} strokeWidth={2.2} />
      <circle cx={x} cy={y + 1} r={r - 2} fill={SUN_DISC} />
      <ellipse cx={x - r * 0.4} cy={y - r * 0.45} rx={r * 0.22} ry={r * 0.14} fill="#fff" opacity={0.45} />
    </g>
  );
}

// Dáng Khổng lồ, dáng 2 (10 ngày): thân cao vồng nhẹ (không cuộn tròn), bông to gật đầu bên phải, ba lá to so le
function GiantStem() {
  return (
    <g>
      <path d="M96 160 C88 112 90 58 116 42 C132 34 142 42 142 54" stroke={STEM} strokeWidth={8} fill="none" strokeLinecap="round" />
      <BigLeaf x={93} y={138} r={195} s={1.1} />
      <BigLeaf x={91} y={112} r={-25} s={1} />
      <BigLeaf x={93} y={82} r={205} s={0.8} />
    </g>
  );
}
function SunflowerGiantBud() {
  const [x, y, r] = [142, 70, 18];
  return (
    <g>
      <GiantStem />
      <g transform={`rotate(160 ${x} ${y})`}>
        {[-50, -25, 0, 25, 50].map((a) => (
          <path key={a} d={`M${x} ${y - r - 4} q${r * 0.35} ${r * 0.5} 0 ${r * 0.8} q${-r * 0.35} ${-r * 0.3} 0 ${-r * 0.8} z`} fill="#FFD86B" stroke={INK} strokeWidth={1.4} transform={`rotate(${a} ${x} ${y})`} />
        ))}
        <circle cx={x} cy={y} r={r} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
      </g>
    </g>
  );
}
function SunflowerGiantBloom() {
  const [x, y, r] = [142, 82, 25];
  return (
    <g>
      <GiantStem />
      <g transform={`rotate(20 ${x} ${y})`}>
        {Array.from({ length: 16 }, (_, i) => i * 22.5).map((a) => (
          <ellipse key={a} cx={x} cy={y - r * 1.55} rx={r * 0.32} ry={r * 0.62} fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} ${x} ${y})`} />
        ))}
        <circle cx={x} cy={y} r={r} fill="#B5835A" stroke={INK} strokeWidth={2} />
        <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.18} fill="#fff" opacity={0.35} />
      </g>
    </g>
  );
}

export const sunflower: PlantSpecies = {
  id: 'sunflower',
  name: { vi: 'Hướng dương', en: 'Sunflower' },
  defaultPotId: 'terracotta',
  stages: {
    seed: { svg: SunflowerSeed },
    sprout: { svg: SunflowerSprout },
    bud: { svg: SunflowerBud },
    bloom: { svg: SunflowerBloom },
  },
  faceAnchor: {
    seed: { x: 100, y: 149, scale: 0.55 },
    sprout: { x: 100, y: 122, scale: 0.6 },
    bud: { x: 100, y: 86, scale: 0.55 },
    bloom: { x: 100, y: 80, scale: 0.8 },
  },
  sayings: {
    vi: ['Hôm nay mình hướng về phía bạn nè! 🌻', 'Nắng lên rồi, mình cùng tỏa sáng nha ☀️'],
    en: ['Today I\'m turning my face toward you! 🌻', 'The sun\'s up — let\'s shine together ☀️'],
  },
  praises: {
    vi: ['Bạn sáng chói như mặt trời luôn 🌻'],
    en: ['You\'re as bright as the sun! 🌻'],
  },
  taps: {
    vi: ['Bạn là mặt trời của mình đó ☀️', 'Mình quay theo bạn nè 🌻'],
    en: ['You\'re my sunshine ☀️', 'Look, I\'m turning to follow you 🌻'],
  },
  styles: [
    {
      id: 'giant',
      name: { vi: 'Khổng lồ', en: 'Giant' },
      unlockAt: 10,
      stages: { bud: { svg: SunflowerGiantBud }, bloom: { svg: SunflowerGiantBloom } },
      faceAnchor: { bud: { x: 142, y: 70, scale: 0.55 }, bloom: { x: 142, y: 82, scale: 0.85 } },
    },
    {
      id: 'mini',
      name: { vi: 'Mặt trời nhỏ', en: 'Little Sun' },
      unlockAt: 20,
      stages: { bud: { svg: SunflowerMiniBud }, bloom: { svg: SunflowerMiniBloom } },
      faceAnchor: { bud: { x: 100, y: 94, scale: 0.67 }, bloom: { x: 100, y: 82, scale: 0.93 } },
    },
  ],
};
