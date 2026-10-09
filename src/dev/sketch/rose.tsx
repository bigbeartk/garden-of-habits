import type { ReactNode } from 'react';
import { INK } from '../../content/Face';
import { Cell, Row, type Look } from './kit';

/*
 * Phác thảo dáng mở khoá của Hoa hồng (10/2026), giữ lại để tái dùng.
 * Đã chọn: Z (vòng 3) → dáng 2 `arch` "Cành ba bông"; hồng bắp cải (vòng 2, bản đứng riêng) → dáng 3 `dome`.
 * Bản chính thức nằm ở src/content/plants/rose.tsx; ở đây là bản nháp, sửa thoải mái.
 */

const LEAF = '#7FC27A', VEIN = '#5E9E5A', STEM = '#5E9E5A', DARK = '#4F9A55';
const PETAL = '#FF9DB5', PETAL_DEEP = '#F2789A', PETAL_IN = '#FF7FA0', GOLD = '#F6C945', PEARL = '#FFFDF4', SATIN = '#FFB8CB';
type Pal = { out: string; mid: string; core: string; line: string };
const PINK: Pal = { out: '#F2789A', mid: '#FF9DB5', core: '#FFC4D3', line: '#D94C6E' };
const CREAM: Pal = { out: '#F6D9A8', mid: '#FCE9C8', core: '#FFF6E6', line: '#D9A86A' };
const CORAL: Pal = { out: '#FF8A7A', mid: '#FFAE9E', core: '#FFD3C7', line: '#E0604F' };

// ---- Chi tiết dùng chung ----

function Leaf({ y, side, r = 0 }: { y: number; side: 1 | -1; r?: number }) {
  return (
    <g transform={`translate(100 ${y}) scale(${side} 1) rotate(${r})`}>
      <path d="M0 0 L8 -2" stroke={STEM} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M6 -2 C14 -12 28 -12 36 -6 C28 2 14 4 6 -2 Z" fill={LEAF} stroke={INK} strokeWidth={1.8} strokeLinejoin="round" />
      <path d="M8 -3 C18 -6 26 -6 33 -6" stroke={VEIN} strokeWidth={1.2} fill="none" strokeLinecap="round" />
    </g>
  );
}
/** lá rời gắn ở (x, y), xoay r độ */
function FreeLeaf({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 0 C6 -10 20 -10 26 -4 C20 4 6 6 0 0 Z" fill={LEAF} stroke={INK} strokeWidth={1.6} strokeLinejoin="round" />
      <path d="M2 -1 C10 -4 18 -4 23 -4" stroke={VEIN} strokeWidth={1.1} fill="none" strokeLinecap="round" />
    </g>
  );
}
function Bow({ y, s = 1, tails = 1 }: { y: number; s?: number; tails?: number }) {
  return (
    <g transform={`translate(100 ${y}) scale(${s})`} stroke={INK} strokeWidth={1.6} strokeLinejoin="round">
      <path d={`M-2 2 L-9 ${16 * tails} L-5 ${14 * tails} L-3 ${18 * tails} Z M2 2 L9 ${16 * tails} L5 ${14 * tails} L3 ${18 * tails} Z`} fill={SATIN} />
      <path d="M-2 0 C-10 -10 -20 -8 -18 0 C-20 8 -10 10 -2 0 Z" fill={SATIN} />
      <path d="M2 0 C10 -10 20 -8 18 0 C20 8 10 10 2 0 Z" fill={SATIN} />
      <rect x={-4} y={-4} width={8} height={8} rx={3} fill="#FF9DB5" />
    </g>
  );
}
function Tiara({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-12) scale(${s})`} stroke={INK} strokeWidth={1.4} strokeLinejoin="round">
      <path d="M-11 0 L-13 -10 L-6 -5 L0 -14 L6 -5 L13 -10 L11 0 Z" fill={GOLD} />
      {([[-13, -10], [0, -14], [13, -10]] as const).map(([px, py]) => <circle key={px} cx={px} cy={py} r={2.2} fill={PEARL} />)}
      <circle cx={0} cy={-4} r={2} fill="#FF7FA0" />
    </g>
  );
}
function MiniBud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g stroke={INK} strokeLinejoin="round" transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 6 C-6 4 -6 -4 0 -7 C6 -4 6 4 0 6 Z" fill={PETAL} strokeWidth={1.4} />
      <path d="M0 6 l-5 -3 l2 5 Z M0 6 l5 -3 l-2 5 Z" fill={LEAF} strokeWidth={1.1} />
    </g>
  );
}
/** nụ to khép cánh (như dạng bud của Gốc), mặt ở (x, y) cỡ 0.5·s */
function BigBud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g stroke={INK} strokeLinejoin="round" transform={`translate(${x} ${y}) scale(${s}) translate(-100 -78)`}>
      <path d="M100 96 C84 92 82 72 88 62 C92 56 96 52 100 48 C104 52 108 56 112 62 C118 72 116 92 100 96 Z" fill={PETAL} strokeWidth={2.4} />
      <path d="M100 48 C96 58 98 66 106 70" fill="none" stroke="#F28AA6" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M100 96 L86 88 L92 100 Z M100 96 L114 88 L108 100 Z" fill={LEAF} strokeWidth={1.8} />
    </g>
  );
}

// ---- Các kiểu bông ----

/** bông hồng của dáng Gốc (cánh trước trơn mang mặt), mặt ở (x, y + 15s) cỡ 0.67s */
function RoseHead({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {[-160, -120, -60, -20].map((a) => <ellipse key={a} cx={0} cy={-20} rx={12} ry={11} fill={PETAL_DEEP} strokeWidth={1.6} transform={`rotate(${a + 90})`} />)}
      <ellipse cx={0} cy={-6} rx={22} ry={14} fill={PETAL_IN} strokeWidth={1.8} />
      <path d="M-8 -8 C-6 -16 8 -16 8 -8 C8 -2 -2 -2 -2 -7 C-2 -10 3 -10 3 -7" fill="none" stroke="#D94C6E" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M-26 -4 C-28 16 -14 26 0 26 C14 26 28 16 26 -4 C18 2 8 0 0 4 C-8 0 -18 2 -26 -4 Z" fill={PETAL} strokeWidth={2} />
    </g>
  );
}
/** hồng bắp cải: hai vòng cánh tròn + lòng trơn r 13 mang mặt (mặt ở tâm, cỡ 0.28s) */
function Pompom({ x, y, s, p = PINK }: { x: number; y: number; s: number; p?: Pal }) {
  const ring = (n: number, rr: number, r: number, fill: string, off = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + off;
      return <circle key={`${rr}-${i}`} cx={rr * Math.cos(a)} cy={rr * Math.sin(a)} r={r} fill={fill} strokeWidth={1.6} />;
    });
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {ring(11, 20, 9, p.out)}
      {ring(9, 13, 8, p.mid, 0.3)}
      <circle r={13} fill={p.core} strokeWidth={1.6} />
      <path d="M-9 -6 q4 -5 9 -3 M2 -9 q5 0 7 4" fill="none" stroke={p.line} strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}
/** hồng trà nhìn nghiêng: chén cao, mũi cánh nhọn cong ra (bị chê giống sừng / mũ cao bồi) */
function TeaRose({ x, y, s, p = CORAL }: { x: number; y: number; s: number; p?: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      <path d="M-24 -6 C-34 -10 -36 -20 -30 -26 C-24 -16 -16 -14 -10 -14 Z" fill={p.out} strokeWidth={1.6} />
      <path d="M24 -6 C34 -10 36 -20 30 -26 C24 -16 16 -14 10 -14 Z" fill={p.out} strokeWidth={1.6} />
      <path d="M-12 -14 C-14 -28 -4 -34 0 -36 C4 -34 14 -28 12 -14 Z" fill={p.mid} strokeWidth={1.6} />
      <path d="M-4 -22 C-4 -30 6 -30 5 -23 C4 -18 -1 -19 0 -23" fill="none" stroke={p.line} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-20 -14 C-28 -2 -20 20 0 22 C20 20 28 -2 20 -14 C14 -8 6 -10 0 -6 C-6 -10 -14 -8 -20 -14 Z" fill={p.core} strokeWidth={1.8} />
    </g>
  );
}
/** hồng dại 5 cánh tim, nhuỵ vàng (bông nhỏ) */
function WildRose({ x, y, s, p = PINK }: { x: number; y: number; s: number; p?: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {[0, 72, 144, 216, 288].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0 -2 C-12 -10 -12 -24 -4 -24 C-1 -24 0 -21 0 -20 C0 -21 1 -24 4 -24 C12 -24 12 -10 0 -2 Z" fill={p.mid} strokeWidth={1.6} />
      ))}
      <circle r={6} fill={GOLD} strokeWidth={1.4} />
    </g>
  );
}
/** hồng ruy băng: dải satin cuộn xoắn ốc nhìn từ trên (bông nhỏ) */
const SPIRAL = 'M' + Array.from({ length: 61 }, (_, i) => {
  const t = (i / 60) * Math.PI * 5;
  const r = 2 + (t / (Math.PI * 5)) * 20;
  return `${(r * Math.cos(t)).toFixed(1)} ${(r * Math.sin(t)).toFixed(1)}`;
}).join(' L');
function RibbonRose({ x, y, s, p = PINK }: { x: number; y: number; s: number; p?: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={23} fill={p.mid} stroke={INK} strokeWidth={1.8} />
      <path d={SPIRAL} fill="none" stroke={p.out} strokeWidth={3.2} strokeLinecap="round" />
      <path d={SPIRAL} fill="none" stroke={INK} strokeWidth={0.9} strokeLinecap="round" transform="rotate(8)" />
    </g>
  );
}
/** hồng nhìn từ trên: viền vỏ sò, xoắn nửa trên, nửa dưới trơn mang mặt (mặt ở (x, y + 7s), cỡ 0.5s) */
function TopRose({ x, y, s, p = PINK }: { x: number; y: number; s: number; p?: Pal }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeLinejoin="round">
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={15 * Math.cos(a)} cy={15 * Math.sin(a)} r={11} fill={p.out} strokeWidth={1.7} />;
      })}
      <circle r={19} fill={p.mid} strokeWidth={1.7} />
      <path d="M-14 -6 C-12 -16 -4 -18 2 -18 C10 -18 14 -12 14 -6" fill="none" stroke={p.line} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M-8 -9 C-7 -15 5 -16 8 -10 C4 -12 -3 -12 -8 -9 Z" fill={p.core} stroke={p.line} strokeWidth={1.4} />
      <path d="M-2 -12 C-1 -15 4 -15 4 -12" fill="none" stroke={p.line} strokeWidth={1.3} strokeLinecap="round" />
    </g>
  );
}
type Head = (q: { x: number; y: number; s: number }) => ReactNode;

// ---- Khung tim ----

const HEART = 'M100 128 C78 112 50 92 50 66 C50 46 66 34 80 34 C90 34 97 40 100 50 C103 40 110 34 120 34 C134 34 150 46 150 66 C150 92 122 112 100 128 Z';
const LEFT: [number, number][] = [[86, 117], [72, 105], [60, 91], [52, 76], [51, 59], [58, 45], [70, 36], [84, 35], [95, 42]];
const HEART_PTS: [number, number][] = [...LEFT, ...LEFT.map(([x, y]): [number, number] => [200 - x, y])];
const scaleAt = (s: number) => `translate(100 128) scale(${s}) translate(-100 -128)`;
function Trunk({ top = 124 }: { top?: number }) {
  return (
    <g>
      <path d={`M100 160 C96 150 104 138 100 ${top}`} stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Leaf y={152} side={-1} r={-8} />
      <Leaf y={144} side={1} r={-14} />
    </g>
  );
}
function Wreath({ s, children }: { s: number; children: ReactNode }) {
  return (
    <g transform={scaleAt(s)}>
      <path d={HEART} fill="#FFE6EE" stroke={INK} strokeWidth={15} strokeLinejoin="round" />
      <path d={HEART} fill="#FFE6EE" stroke={LEAF} strokeWidth={11} strokeLinejoin="round" />
      {children}
    </g>
  );
}
function Topiary({ s, children }: { s: number; children: ReactNode }) {
  return (
    <g transform={scaleAt(s)}>
      <path d={HEART} fill={LEAF} stroke={INK} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M62 64 C62 52 70 44 80 44 M126 44 C134 46 140 54 140 62" fill="none" stroke="#A8DBA0" strokeWidth={4} strokeLinecap="round" />
      {[[64, 86], [80, 104], [120, 104], [136, 86], [88, 52], [112, 52], [72, 70], [128, 70]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x - 5} ${y} q5 -6 10 0`} fill="none" stroke={DARK} strokeWidth={1.6} strokeLinecap="round" />
      ))}
      {children}
    </g>
  );
}
function Wire({ s, children }: { s: number; children: ReactNode }) {
  return (
    <g transform={scaleAt(s)}>
      <path d={HEART} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={HEART} fill="none" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" />
      <path d="M56 92 C64 84 54 76 60 68 C66 58 56 50 64 42 M144 92 C136 84 146 76 140 68 C134 58 144 50 136 42" fill="none" stroke={STEM} strokeWidth={2.2} strokeLinecap="round" />
      {children}
    </g>
  );
}
const TOPIARY_PTS: [number, number][] = [[66, 58], [134, 58], [62, 88], [138, 88], [84, 112], [116, 112], [82, 44], [118, 44]];

// ---- Vòng 1: khung tim, có vương miện + nơ ----

const R1: [string, Look, Look][] = [
  ['A · Vòng hoa tim',
    { face: { x: 100, y: 96, scale: 0.34 }, art: () => <g><Trunk /><Wreath s={0.86}>{HEART_PTS.filter((_, i) => i % 2 === 0).map(([x, y]) => <MiniBud key={`${x}-${y}`} x={x} y={y} />)}<BigBud x={100} y={90} s={0.8} /><Tiara x={99} y={68} s={0.55} /></Wreath><Bow y={134} s={0.75} /></g> },
    { face: { x: 100, y: 98, scale: 0.56 }, art: () => <g><Trunk /><Wreath s={1}>{HEART_PTS.map(([x, y], i) => <RoseHead key={`${x}-${y}`} x={x} y={y} s={i % 3 === 1 ? 0.24 : 0.28} />)}<RoseHead x={100} y={86} s={0.84} /><Tiara x={96} y={62} s={0.75} /></Wreath><Bow y={134} s={0.75} /></g> }],
  ['B · Bụi tỉa hình tim',
    { face: { x: 100, y: 91, scale: 0.34 }, art: () => <g><Trunk /><Topiary s={0.86}>{[[66, 62], [134, 62], [70, 92], [130, 92], [100, 116]].map(([x, y]) => <MiniBud key={`${x}-${y}`} x={x} y={y} />)}<BigBud x={100} y={84} s={0.8} /><Tiara x={99} y={62} s={0.55} /></Topiary><Bow y={134} s={0.75} /></g> },
    { face: { x: 100, y: 96, scale: 0.56 }, art: () => <g><Trunk /><Topiary s={1}>{TOPIARY_PTS.map(([x, y], i) => <RoseHead key={`${x}-${y}`} x={x} y={y} s={i < 4 ? 0.34 : 0.26} />)}<RoseHead x={100} y={84} s={0.84} /><Tiara x={96} y={60} s={0.75} /></Topiary><Bow y={134} s={0.75} /></g> }],
  ['C · Khung dây vàng',
    { face: { x: 100, y: 89, scale: 0.38 }, art: () => <g><Trunk top={126} /><Wire s={0.86}>{[[52, 66], [148, 66], [74, 108], [126, 108], [80, 36], [120, 36]].map(([x, y]) => <MiniBud key={`${x}-${y}`} x={x} y={y} />)}<BigBud x={100} y={82} s={0.9} /><Tiara x={99} y={57} s={0.6} /></Wire><Bow y={128} s={0.8} tails={1.6} /></g> },
    { face: { x: 100, y: 93, scale: 0.58 }, art: () => <g><Trunk top={126} /><Wire s={1}>{[[52, 64], [148, 64], [72, 106], [128, 106], [76, 36], [124, 36]].map(([x, y]) => <RoseHead key={`${x}-${y}`} x={x} y={y} s={0.38} />)}<RoseHead x={100} y={80} s={0.88} /><Tiara x={96} y={54} s={0.78} /></Wire><Bow y={128} s={0.85} tails={1.6} /></g> }],
];

// ---- Vòng 2: kiểu bông mới (bông đứng riêng | ghép vào tim bụi tỉa) ----

function solo(Main: Head, s: number, face: Look['face']): Look {
  return { face, art: () => <g><path d="M100 160 C96 140 104 120 100 100" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" /><Leaf y={130} side={-1} r={-14} /><Main x={100} y={84} s={s} /></g> };
}
function inHeart(Main: Head, Small: Head, mainS: number, smallS: number, face: Look['face']): Look {
  return { face, art: () => <g><Trunk /><Topiary s={1}>{TOPIARY_PTS.map(([x, y], i) => <Small key={`${x}-${y}`} x={x} y={y} s={i < 4 ? smallS : smallS * 0.8} />)}<Main x={100} y={84} s={mainS} /><Tiara x={96} y={58} s={0.75} /></Topiary><Bow y={134} s={0.75} /></g> };
}
const R2: [string, Look, Look][] = [
  ['1 · Hồng bắp cải ✔ (dáng 3)', solo((q) => <Pompom {...q} />, 1.5, { x: 100, y: 86, scale: 0.42 }), inHeart((q) => <Pompom {...q} />, (q) => <Pompom {...q} />, 1.15, 0.36, { x: 100, y: 86, scale: 0.32 })],
  ['2 · Hồng trà san hô', solo((q) => <TeaRose {...q} />, 1.4, { x: 100, y: 90, scale: 0.55 }), inHeart((q) => <TeaRose {...q} />, (q) => <TeaRose {...q} />, 1.05, 0.36, { x: 100, y: 88, scale: 0.42 })],
  ['3 · Bắp cải kem + hồng dại', solo((q) => <Pompom {...q} p={CREAM} />, 1.5, { x: 100, y: 86, scale: 0.42 }), inHeart((q) => <Pompom {...q} p={CREAM} />, (q) => <WildRose {...q} />, 1.15, 0.42, { x: 100, y: 86, scale: 0.32 })],
  ['4 · Hồng trà + hồng ruy băng', solo((q) => <TeaRose {...q} p={PINK} />, 1.4, { x: 100, y: 90, scale: 0.55 }), inHeart((q) => <TeaRose {...q} p={PINK} />, (q) => <RibbonRose {...q} />, 1.05, 0.4, { x: 100, y: 88, scale: 0.42 })],
];

// ---- Vòng 3: không phụ kiện, bông TopRose ----

const MOUND = 'M30 160 C24 140 34 118 52 112 C56 92 76 82 92 88 C102 74 124 76 134 90 C152 86 172 104 166 124 C178 134 176 152 170 160 Z';
const R3: [string, Look][] = [
  ['X · Bụi tỉa hình tim', { face: { x: 100, y: 89, scale: 0.47 }, art: () => <g><Trunk /><Topiary s={1}>{TOPIARY_PTS.map(([x, y], i) => <TopRose key={`${x}-${y}`} x={x} y={y} s={i < 4 ? 0.42 : 0.34} />)}<TopRose x={100} y={82} s={0.95} /></Topiary></g> }],
  ['Y · Bụi thấp xoè rộng (che vành chậu)', { face: { x: 100, y: 105, scale: 0.47 }, art: () => (
    <g>
      <path d={MOUND} fill={LEAF} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M48 128 q5 -6 10 0 M150 132 q5 -6 10 0 M70 146 q5 -6 10 0 M124 148 q5 -6 10 0 M118 100 q5 -6 10 0" fill="none" stroke={DARK} strokeWidth={1.6} strokeLinecap="round" />
      {[[50, 124, 0.46], [152, 126, 0.48], [74, 98, 0.4], [132, 96, 0.42], [64, 146, 0.38], [140, 148, 0.38], [104, 146, 0.34]].map(([x, y, sc]) => <TopRose key={`${x}-${y}`} x={x} y={y} s={sc} />)}
      <TopRose x={100} y={98} s={0.95} />
    </g>
  ) }],
];
const Z_BUD: Look = { face: { x: 100, y: 78, scale: 0.36 }, art: () => (
  <g>
    <path d="M100 160 C96 136 104 112 100 92" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d="M100 132 C90 126 80 122 72 112 M101 116 C110 110 120 108 128 98" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
    {([[99, 150, 200], [101, 142, -20], [86, 126, 190], [114, 110, -30]] as const).map(([x, y, r]) => <FreeLeaf key={`${x}-${y}`} x={x} y={y} r={r} />)}
    <MiniBud x={70} y={108} s={1.3} />
    <MiniBud x={130} y={94} s={1.3} />
    <BigBud x={100} y={78} s={0.72} />
  </g>
) };
const Z_BLOOM: Look = { face: { x: 100, y: 64, scale: 0.52 }, art: () => (
  <g>
    <path d="M100 160 C96 130 104 100 100 72" stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round" />
    <path d="M100 124 C88 116 74 112 64 100 M101 106 C112 100 126 96 136 84" stroke={STEM} strokeWidth={4} fill="none" strokeLinecap="round" />
    {([[99, 148, 200], [101, 138, -20], [82, 116, 190], [118, 98, -30], [99, 90, 210]] as const).map(([x, y, r]) => <FreeLeaf key={`${x}-${y}`} x={x} y={y} r={r} />)}
    <TopRose x={62} y={96} s={0.55} />
    <TopRose x={138} y={80} s={0.58} />
    <TopRose x={100} y={57} s={1.05} />
  </g>
) };

const POT = 'rose-porcelain';
export function RoseSketches() {
  return (
    <div>
      <Row title="Vòng 1 · khung tim, có vương miện + nơ (ra chồi | ra hoa)">
        {R1.flatMap(([name, bud, bloom]) => [
          <Cell key={`${name}-bud`} label={name} look={bud} potId={POT} faceStyle="lady" />,
          <Cell key={`${name}-bloom`} label="" look={bloom} potId={POT} faceStyle="lady" />,
        ])}
      </Row>
      <Row title="Vòng 2 · kiểu bông mới (đứng riêng | ghép vào tim)">
        {R2.flatMap(([name, alone, heart]) => [
          <Cell key={`${name}-solo`} label={name} look={alone} potId={POT} faceStyle="lady" />,
          <Cell key={`${name}-heart`} label="" look={heart} potId={POT} faceStyle="lady" />,
        ])}
      </Row>
      <Row title="Vòng 3 · không phụ kiện">
        {R3.map(([name, look]) => <Cell key={name} label={name} look={look} potId={POT} faceStyle="lady" />)}
        <Cell label="Z · Một cành ba bông ✔ (dáng 2) · ra chồi" look={Z_BUD} potId={POT} faceStyle="lady" />
        <Cell label="Z · ra hoa" look={Z_BLOOM} potId={POT} faceStyle="lady" />
      </Row>
    </div>
  );
}
