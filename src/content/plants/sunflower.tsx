import type { ReactNode } from 'react';
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

/** Một bông hướng dương: n cánh xoè quanh nhị tròn (dùng cho các dáng mở khoá). */
function Flower({ x, y, r, n, pw, ph, petal, core, rot = 0 }: { x: number; y: number; r: number; n: number; pw: number; ph: number; petal: string; core: string; rot?: number }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      {Array.from({ length: n }, (_, i) => (i * 360) / n).map((a) => (
        <ellipse key={a} cx={x} cy={y - r - ph * 0.5} rx={pw} ry={ph} fill={petal} stroke={INK} strokeWidth={1.5} transform={`rotate(${a} ${x} ${y})`} />
      ))}
      <circle cx={x} cy={y} r={r} fill={core} stroke={INK} strokeWidth={2} />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.18} fill="#fff" opacity={0.35} />
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

// Dáng Mini: bụi thấp phân nhánh, 5 bông nhỏ cam đỏ xoè quạt, bông giữa to nhất mang mặt
const MINI_PETAL = '#FF9A5C';
const MINI_CORE = '#8A5A3C';
const MINI_HEADS = [
  { x: 52, y: 112, r: 8 },
  { x: 72, y: 90, r: 9 },
  { x: 128, y: 90, r: 9 },
  { x: 148, y: 112, r: 8 },
];
const MINI_CENTER = { x: 100, y: 78, r: 13 };

function MiniBush({ children }: { children: ReactNode }) {
  return (
    <g>
      {[...MINI_HEADS, MINI_CENTER].map((h) => (
        <path key={`${h.x}-${h.y}`} d={`M100 160 Q${(100 + h.x) / 2} ${(160 + h.y) / 2 + 12} ${h.x} ${h.y}`} stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
      <BigLeaf x={98} y={152} r={180} s={0.9} />
      <BigLeaf x={102} y={150} r={-8} s={0.9} />
      <BigLeaf x={86} y={132} r={200} s={0.65} />
      <BigLeaf x={114} y={130} r={-25} s={0.65} />
      {children}
    </g>
  );
}
function SunflowerMiniBud() {
  return (
    <MiniBush>
      {MINI_HEADS.map((h) => (
        <g key={`${h.x}-${h.y}`}>
          <Flower x={h.x} y={h.y} r={6} n={6} pw={2.5} ph={4} petal={MINI_PETAL} core="#B7E3A1" />
        </g>
      ))}
      <Flower x={MINI_CENTER.x} y={MINI_CENTER.y} r={13} n={8} pw={3.5} ph={5} petal={MINI_PETAL} core="#B7E3A1" />
    </MiniBush>
  );
}
function SunflowerMiniBloom() {
  return (
    <MiniBush>
      {MINI_HEADS.map((h) => (
        <Flower key={`${h.x}-${h.y}`} x={h.x} y={h.y} r={h.r} n={10} pw={4.5} ph={8} petal={MINI_PETAL} core={MINI_CORE} />
      ))}
      <Flower x={MINI_CENTER.x} y={MINI_CENTER.y} r={MINI_CENTER.r} n={12} pw={6} ph={11} petal={MINI_PETAL} core={MINI_CORE} />
    </MiniBush>
  );
}

// Dáng Khổng lồ: thân rất cao cong như dấu hỏi, bông to cúi chào bên phải
function GiantStem() {
  return (
    <g>
      <path d="M92 160 C86 112 66 52 94 26 C116 6 148 18 146 56" stroke={STEM} strokeWidth={9} fill="none" strokeLinecap="round" />
      <BigLeaf x={90} y={140} r={195} s={1.15} />
      <BigLeaf x={86} y={116} r={-20} s={1.05} />
      <BigLeaf x={77} y={82} r={210} s={0.8} />
    </g>
  );
}
function SunflowerGiantBud() {
  return (
    <g>
      <GiantStem />
      <g transform="rotate(160 146 74)">
        {[-50, -25, 0, 25, 50].map((a) => (
          <path key={a} d="M146 50 q7 10 0 16 q-7 -6 0 -16 z" fill="#FFD86B" stroke={INK} strokeWidth={1.5} transform={`rotate(${a} 146 74)`} />
        ))}
      </g>
      <circle cx={146} cy={74} r={20} fill="#B7E3A1" stroke={INK} strokeWidth={2} />
    </g>
  );
}
function SunflowerGiantBloom() {
  return (
    <g>
      <GiantStem />
      <Flower x={146} y={94} r={24} n={16} pw={7} ph={14} petal="#FFD86B" core="#B5835A" rot={25} />
    </g>
  );
}

export const sunflower: PlantSpecies = {
  id: 'sunflower',
  name: 'Hướng dương',
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
  sayings: ['Hôm nay mình hướng về phía bạn nè! 🌻', 'Nắng lên rồi, mình cùng tỏa sáng nha ☀️'],
  praises: ['Bạn sáng chói như mặt trời luôn 🌻'],
  taps: ['Bạn là mặt trời của mình đó ☀️', 'Mình quay theo bạn nè 🌻'],
  styles: [
    {
      id: 'mini',
      name: 'Mini',
      unlockAt: 10,
      stages: { bud: { svg: SunflowerMiniBud }, bloom: { svg: SunflowerMiniBloom } },
      faceAnchor: { bud: { x: 100, y: 79, scale: 0.38 }, bloom: { x: 100, y: 79, scale: 0.45 } },
    },
    {
      id: 'giant',
      name: 'Khổng lồ',
      unlockAt: 20,
      stages: { bud: { svg: SunflowerGiantBud }, bloom: { svg: SunflowerGiantBloom } },
      faceAnchor: { bud: { x: 146, y: 76, scale: 0.55 }, bloom: { x: 146, y: 95, scale: 0.8 } },
    },
  ],
};
