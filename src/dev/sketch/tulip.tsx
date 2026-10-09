import { INK } from '../../content/Face';
import { SOIL_Y } from '../../content/plants/parts';
import { Cell, Row, type Look } from './kit';

/*
 * Lưu trữ dáng Tulip đã thay (10/2026): dáng 3 `bouquet` "Bó hoa" (ba tulip hồng/vàng/đỏ buộc nơ xanh).
 * Thay bằng tulip vàng cùng dáng Gốc; dáng 2 `parrot` (Vẹt) thành tulip hồng. Bản chính ở src/content/plants/tulip.tsx.
 */

const STEM = '#6FAE62', LEAF = '#7FBF6A', LEAF_FOLD = '#5E9E52';
type Pal = { main: string; deep: string; light: string };
const RED: Pal = { main: '#F0525A', deep: '#D63B47', light: '#FF8A8E' };
const PINK: Pal = { main: '#FF9DB5', deep: '#F2789A', light: '#FFC4D3' };
const YELLOW: Pal = { main: '#FFD45C', deep: '#F5B83D', light: '#FFF0A8' };

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
function Cup({ p }: { p: Pal }) {
  return (
    <g strokeLinejoin="round" stroke={INK}>
      <path d="M-15 -14 C-15 -30 -7 -39 0 -39 C7 -39 15 -30 15 -14 Z" fill={p.deep} strokeWidth={2} />
      <path d="M-4 30 C-26 30 -39 14 -38 -6 C-37 -20 -34 -31 -28 -32 C-21 -33 -13 -20 -10 -4 Z" fill={p.deep} strokeWidth={2} />
      <path d="M4 30 C26 30 39 14 38 -6 C37 -20 34 -31 28 -32 C21 -33 13 -20 10 -4 Z" fill={p.deep} strokeWidth={2} />
      <path d="M-28 -8 C-30 14 -18 31 0 31 C18 31 30 14 28 -8 C26 -20 12 -30 0 -32 C-12 -30 -26 -20 -28 -8 Z" fill={p.main} strokeWidth={2.2} />
      <g fill="none" stroke={p.light} strokeLinecap="round">
        <path d="M-20 -6 C-22 6 -18 16 -12 22" strokeWidth={2.4} opacity={0.8} />
        <path d="M-12 -24 C-8 -27 -4 -29 0 -29" strokeWidth={2} opacity={0.8} />
      </g>
      <ellipse cx={-15} cy={-12} rx={3} ry={6} fill="#fff" stroke="none" opacity={0.55} transform="rotate(25 -15 -12)" />
    </g>
  );
}
function ClosedBud({ p }: { p: Pal }) {
  return (
    <g strokeLinejoin="round" stroke={INK}>
      <path d="M0 22 C-16 22 -20 6 -18 -6 C-16 -22 -7 -31 0 -31 C7 -31 16 -22 18 -6 C20 6 16 22 0 22 Z" fill={p.main} strokeWidth={2} />
      <path d="M-18 -6 C-10 -2 -3 -14 -2 -30 C-9 -28 -16 -18 -18 -6 Z" fill={p.deep} strokeWidth={1.6} />
      <path d="M0 22 C-12 22 -16 14 -17 6 C-10 12 -4 14 0 14 C4 14 10 12 17 6 C16 14 12 22 0 22 Z" fill="#9FCF7E" strokeWidth={1.6} />
    </g>
  );
}

// Bó hoa: ba bông tulip cao thấp (hồng, vàng, đỏ) buộc nơ xanh
const BOUQUET = [
  { x: 72, y: 82, s: 0.62, r: -18, p: PINK },
  { x: 128, y: 82, s: 0.62, r: 18, p: YELLOW },
  { x: 100, y: 62, s: 0.8, r: 0, p: RED },
];
function BouquetBow() {
  return (
    <g stroke={INK} strokeWidth={1.6} strokeLinejoin="round" transform="translate(100 134)">
      <path d="M-3 2 L-10 18 L-5 15 L-3 20 Z M3 2 L10 18 L5 15 L3 20 Z" fill="#9AD1F5" />
      <path d="M-3 0 C-12 -11 -23 -9 -21 0 C-23 9 -12 11 -3 0 Z" fill="#9AD1F5" />
      <path d="M3 0 C12 -11 23 -9 21 0 C23 9 12 11 3 0 Z" fill="#9AD1F5" />
      <rect x={-5} y={-5} width={10} height={10} rx={3.5} fill="#6FB8E8" />
    </g>
  );
}
function BouquetStems() {
  return (
    <g stroke={STEM} strokeWidth={5} fill="none" strokeLinecap="round">
      {BOUQUET.map((f) => <path key={f.x} d={`M100 158 Q${(100 + f.x) / 2} 120 ${f.x} ${f.y + 22 * f.s}`} />)}
    </g>
  );
}
const BOUQUET_BUD: Look = {
  face: { x: 100, y: 59, scale: 0.42 },
  art: () => (
    <g>
      <BroadLeaf side={-1} tipX={60} tipY={116} />
      <BroadLeaf side={1} tipX={140} tipY={116} />
      <BouquetStems />
      {BOUQUET.map((f) => <g key={f.x} transform={`translate(${f.x} ${f.y}) rotate(${f.r}) scale(${f.s * 0.9})`}><ClosedBud p={f.p} /></g>)}
      <BouquetBow />
    </g>
  ),
};
const BOUQUET_BLOOM: Look = {
  face: { x: 100, y: 73, scale: 0.75 },
  art: () => (
    <g>
      <BroadLeaf side={-1} tipX={52} tipY={112} />
      <BroadLeaf side={1} tipX={148} tipY={112} />
      <BouquetStems />
      {BOUQUET.map((f) => <g key={f.x} transform={`translate(${f.x} ${f.y}) rotate(${f.r}) scale(${f.s})`}><Cup p={f.p} /></g>)}
      <BouquetBow />
    </g>
  ),
};

export function TulipSketches() {
  return (
    <Row title="Tulip · lưu trữ: dáng 3 Bó hoa cũ (ra chồi | ra hoa)">
      <Cell label="Bó hoa (đã thay bằng tulip vàng)" look={BOUQUET_BUD} potId="blue-ceramic" />
      <Cell label="" look={BOUQUET_BLOOM} potId="blue-ceramic" />
    </Row>
  );
}
