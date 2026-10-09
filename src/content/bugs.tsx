import { useId, type FC, type ReactNode } from 'react';
import { INK } from './Face';
import type { FaceAnchor } from './types';
import type { Localized } from '../i18n/lang';

/**
 * Côn trùng chibi ghé cây vào ngày làm đủ mọi thói quen (xem `perfectHabitDays`).
 * Mỗi con vẽ quanh gốc (0, 0), rộng khoảng 26 đơn vị của khung cây 200×240; cánh vỗ bằng `<animateTransform>` của SVG,
 * tắt khi `animate = false` (giảm chuyển động).
 */
export type BugRarity = 'common' | 'rare' | 'epic';
/** `weight`: trọng số khi chọn con của ngày (càng nhỏ càng hiếm); `rarity`: nhãn hiện ở thẻ "Côn trùng đã gặp". */
export interface HabitBug { id: string; name: Localized<string>; weight: number; rarity: BugRarity; Art: FC<{ animate: boolean }> }

const LINE = { stroke: INK, strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Cánh vỗ: co giãn theo chiều ngang quanh thân (x = 0). */
function Flap({ animate, dur = '0.45s', children }: { animate: boolean; dur?: string; children: ReactNode }) {
  return (
    <g>
      {children}
      {animate && <animateTransform attributeName="transform" type="scale" values="1 1;0.45 1;1 1" dur={dur} repeatCount="indefinite" />}
    </g>
  );
}

/** Mắt tròn có đốm sáng + má hồng; `light` cho đầu màu tối. */
function Face({ y, gap, light = false }: { y: number; gap: number; light?: boolean }) {
  return (
    <g>
      {[-gap, gap].map((x) => (
        <g key={x}>
          {light && <circle cx={x} cy={y} r={1.6} fill="#FFFDFB" />}
          <circle cx={x} cy={y} r={1.05} fill={INK} />
          <circle cx={x + 0.35} cy={y - 0.4} r={0.35} fill="#FFFDFB" />
        </g>
      ))}
      <ellipse cx={-gap - 1.2} cy={y + 1.9} rx={1.1} ry={0.65} fill="#FF9FB2" />
      <ellipse cx={gap + 1.2} cy={y + 1.9} rx={1.1} ry={0.65} fill="#FF9FB2" />
      <path d={`M${-0.8} ${y + 1.6} q0.8 0.8 1.6 0`} fill="none" {...LINE} strokeWidth={0.8} />
    </g>
  );
}

function Antennae({ y, spread = 3.2, tip = '#FF9FB2' }: { y: number; spread?: number; tip?: string }) {
  return (
    <g>
      <path d={`M-1.2 ${y} Q${-spread} ${y - 3} ${-spread - 0.6} ${y - 4.6} M1.2 ${y} Q${spread} ${y - 3} ${spread + 0.6} ${y - 4.6}`} fill="none" {...LINE} strokeWidth={0.9} />
      <circle cx={-spread - 0.6} cy={y - 4.8} r={1} fill={tip} />
      <circle cx={spread + 0.6} cy={y - 4.8} r={1} fill={tip} />
    </g>
  );
}

const WING = { fill: '#EAF6FF', fillOpacity: 0.85, stroke: INK, strokeWidth: 0.9 } as const;

/** Bọ rùa: thân tròn đỏ chấm đen, đầu ca cao mắt trắng, cánh mỏng vỗ phía sau */
const Ladybug: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <Flap animate={animate}>
      <ellipse cx={-8} cy={-1} rx={5.5} ry={3.2} transform="rotate(-25 -8 -1)" {...WING} />
      <ellipse cx={8} cy={-1} rx={5.5} ry={3.2} transform="rotate(25 8 -1)" {...WING} />
    </Flap>
    <Antennae y={-8.6} spread={2.6} tip={INK} />
    <circle cx={0} cy={2.5} r={8} fill="#FF6B6B" {...LINE} />
    <path d="M0 -1.6 V10.3" {...LINE} strokeWidth={1} />
    {[[-4, 3], [4, 3], [-3, 7.2], [3, 7.2]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.5} fill={INK} />)}
    <circle cx={0} cy={-5} r={4.6} fill="#5B4636" {...LINE} />
    <Face y={-5.3} gap={1.9} light />
  </g>
);

/** Bướm: cánh hồng + tím lấm tấm, thân nhỏ, đầu vàng bơ */
const Butterfly: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <Flap animate={animate} dur="0.6s">
      <ellipse cx={-7.5} cy={-3.5} rx={6.6} ry={5.6} transform="rotate(-20 -7.5 -3.5)" fill="#FFB3C7" {...LINE} />
      <ellipse cx={7.5} cy={-3.5} rx={6.6} ry={5.6} transform="rotate(20 7.5 -3.5)" fill="#FFB3C7" {...LINE} />
      <ellipse cx={-5.6} cy={5.2} rx={4.6} ry={4} fill="#D9CCFF" {...LINE} />
      <ellipse cx={5.6} cy={5.2} rx={4.6} ry={4} fill="#D9CCFF" {...LINE} />
      {[[-8.5, -4.5], [8.5, -4.5], [-5.8, 5.6], [5.8, 5.6]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.3} fill="#FFFDFB" />)}
    </Flap>
    <ellipse cx={0} cy={2.5} rx={2} ry={6.5} fill="#A07A5E" {...LINE} />
    <Antennae y={-8.4} spread={2.8} />
    <circle cx={0} cy={-5.6} r={4} fill="#FFE58A" {...LINE} />
    <Face y={-5.8} gap={1.6} />
  </g>
);

/** Ong: thân tròn vàng sọc ca cao ở nửa dưới, mặt ở nửa trên, cánh trắng vỗ nhanh */
const Bee: FC<{ animate: boolean }> = ({ animate }) => {
  const clip = `bee-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <g>
      <Flap animate={animate} dur="0.25s">
        <ellipse cx={-5.5} cy={-8.5} rx={4} ry={5.4} transform="rotate(-30 -5.5 -8.5)" {...WING} />
        <ellipse cx={5.5} cy={-8.5} rx={4} ry={5.4} transform="rotate(30 5.5 -8.5)" {...WING} />
      </Flap>
      <path d="M0 10.8 L-1.2 8.6 H1.2 Z" fill={INK} />
      <defs><clipPath id={clip}><circle cx={0} cy={1} r={8.2} /></clipPath></defs>
      <circle cx={0} cy={1} r={8.2} fill="#FFD95A" />
      <g clipPath={`url(#${clip})`}>
        <rect x={-9} y={3.6} width={18} height={2.2} fill={INK} />
        <rect x={-9} y={7.4} width={18} height={2.2} fill={INK} />
      </g>
      <circle cx={0} cy={1} r={8.2} fill="none" {...LINE} />
      <Antennae y={-6.6} spread={2.6} tip={INK} />
      <Face y={-1.6} gap={2.6} />
    </g>
  );
};

/** Đom đóm: đầu đào tròn, đuôi vàng phát sáng nhấp nháy */
const Firefly: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <circle cx={0} cy={8} r={7} fill="#FFF3A0" opacity={0.55}>
      {animate && <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.8s" repeatCount="indefinite" />}
    </circle>
    <Flap animate={animate} dur="0.4s">
      <ellipse cx={-5.5} cy={-0.5} rx={4.6} ry={2.8} transform="rotate(-35 -5.5 -0.5)" {...WING} />
      <ellipse cx={5.5} cy={-0.5} rx={4.6} ry={2.8} transform="rotate(35 5.5 -0.5)" {...WING} />
    </Flap>
    <ellipse cx={0} cy={3} rx={3.6} ry={4.4} fill="#A07A5E" {...LINE} />
    <circle cx={0} cy={7.6} r={3.3} fill="#FFE14D" {...LINE} />
    <Antennae y={-8.4} spread={2.4} tip="#FFE14D" />
    <circle cx={0} cy={-4.4} r={4.8} fill="#FFD3B5" {...LINE} />
    <Face y={-4.6} gap={2} />
  </g>
);

/** Chuồn chuồn: đầu mint mắt to, thân dài xanh ngọc chĩa xuống chéo, bốn cánh mảnh */
const Dragonfly: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <Flap animate={animate} dur="0.3s">
      <ellipse cx={-6.8} cy={-1.6} rx={7} ry={2.3} transform="rotate(-12 -6.8 -1.6)" {...WING} />
      <ellipse cx={6.8} cy={-1.6} rx={7} ry={2.3} transform="rotate(12 6.8 -1.6)" {...WING} />
      <ellipse cx={-6} cy={2.4} rx={6} ry={2} transform="rotate(14 -6 2.4)" {...WING} />
      <ellipse cx={6} cy={2.4} rx={6} ry={2} transform="rotate(-14 6 2.4)" {...WING} />
    </Flap>
    <path d="M0 0 C 0.8 5 1.6 9 3 13" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
    <path d="M0 0 C 0.8 5 1.6 9 3 13" fill="none" stroke="#5CC8C0" strokeWidth={1.8} strokeLinecap="round" />
    <circle cx={0} cy={-5} r={4.8} fill="#9FE3D0" {...LINE} />
    <Face y={-5.2} gap={2.1} />
  </g>
);

export const BUGS: HabitBug[] = [
  { id: 'ladybug', name: { vi: 'Bọ rùa', en: 'Ladybug' }, weight: 5, rarity: 'common', Art: Ladybug },
  { id: 'butterfly', name: { vi: 'Bướm', en: 'Butterfly' }, weight: 4, rarity: 'common', Art: Butterfly },
  { id: 'bee', name: { vi: 'Ong', en: 'Bee' }, weight: 4, rarity: 'common', Art: Bee },
  { id: 'firefly', name: { vi: 'Đom đóm', en: 'Firefly' }, weight: 2, rarity: 'rare', Art: Firefly },
  { id: 'dragonfly', name: { vi: 'Chuồn chuồn', en: 'Dragonfly' }, weight: 1, rarity: 'epic', Art: Dragonfly },
];

/** Băm khoá ngày ra số trong [0, 1): FNV-1a rồi trộn bit (murmur3 fmix32) để các ngày liền nhau rải đều. */
function hashUnit(key: string): number {
  let h = 0x811c9dc5;
  for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 2 ** 32;
}

/** Côn trùng của một ngày: chọn theo trọng số, cố định theo khoá ngày (không cần lưu DB, máy nào cũng như nhau). */
export function bugFor(date: string): HabitBug {
  let r = hashUnit(date) * BUGS.reduce((n, b) => n + b.weight, 0);
  for (const b of BUGS) {
    r -= b.weight;
    if (r < 0) return b;
  }
  return BUGS[BUGS.length - 1];
}

/** Số ngày gặp từng loài trong các ngày đã làm đủ thói quen. */
export function countBugs(days: Iterable<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of days) {
    const id = bugFor(d).id;
    out.set(id, (out.get(id) ?? 0) + 1);
  }
  return out;
}

export const getBug = (id: string | null | undefined): HabitBug | null => BUGS.find((b) => b.id === id) ?? null;

/** Côn trùng vẽ to hơn khung gốc chừng này lần để nhìn rõ trên cây. */
export const BUG_SCALE = 1.4;

/** Chỗ côn trùng lượn: phía trên bên phải mặt cây, luôn nằm trong khung 200×240. */
export function bugSpot(a: FaceAnchor): { x: number; y: number } {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { x: clamp(a.x + 22 * a.scale + 18, 22, 178), y: clamp(a.y - 20 * a.scale - 12, 22, 218) };
}
