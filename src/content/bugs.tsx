import { useId, type FC, type ReactNode } from 'react';
import { INK } from './Face';
import type { FaceAnchor } from './types';
import type { Localized } from '../i18n/lang';
import { legacyBugFor, type BugTier } from '../domain/bugOdds';

/**
 * Côn trùng chibi ghé cây vào ngày làm đủ mọi thói quen (xem `perfectHabitDays`).
 * Mỗi con vẽ quanh gốc (0, 0), rộng khoảng 26 đơn vị của khung cây 200×240; cánh vỗ bằng `<animateTransform>` của SVG,
 * tắt khi `animate = false` (giảm chuyển động).
 */
export type BugRarity = BugTier;
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

/** Sâu xanh: treo tơ đung đưa, đầu to mang mặt, thân ba khúc cong */
const Caterpillar: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    {animate && <animateTransform attributeName="transform" type="rotate" values="-7 0 -26;7 0 -26;-7 0 -26" dur="3.2s" repeatCount="indefinite" />}
    <path d="M0 -26 V-8" stroke="#FFFDFB" strokeWidth={0.9} opacity={0.9} />
    <path d="M0 -26 V-8" stroke={INK} strokeWidth={0.4} opacity={0.5} />
    {[[3.6, 13.5, 3], [4.4, 9, 3.4], [2.6, 4, 3.8]].map(([x, y, r]) => (
      <g key={y}>
        <circle cx={x} cy={y} r={r} fill="#9ED977" {...LINE} />
        <circle cx={x - r + 0.6} cy={y + 0.6} r={0.7} fill={INK} />
      </g>
    ))}
    <path d="M-1.6 -8.6 Q-3 -11 -2.4 -12.4 M1.6 -8.6 Q3 -11 2.4 -12.4" fill="none" {...LINE} strokeWidth={0.9} />
    <circle cx={-2.4} cy={-12.6} r={0.9} fill="#FF9FB2" />
    <circle cx={2.4} cy={-12.6} r={0.9} fill="#FF9FB2" />
    <circle cx={0} cy={-3.8} r={5.2} fill="#B9E99A" {...LINE} />
    <Face y={-3.8} gap={2.1} />
  </g>
);

/** Kiến: cầm chiếc lá làm dù, lơ lửng đung đưa */
const Ant: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    {animate && <animateTransform attributeName="transform" type="rotate" values="-6 0 -12;6 0 -12;-6 0 -12" dur="2.8s" repeatCount="indefinite" />}
    <path d="M-11 -9 Q-10 -19 0 -19 Q10 -19 11 -9 Q8 -11 5.5 -9 Q3 -11 0 -9 Q-3 -11 -5.5 -9 Q-8 -11 -11 -9 Z" fill="#8FD07A" {...LINE} />
    <path d="M0 -18.4 V-9.4 M0 -15 L-4 -12.6 M0 -15 L4 -12.6" fill="none" stroke="#5FA84E" strokeWidth={0.8} strokeLinecap="round" />
    <path d="M0 -9 V-2.6" {...LINE} strokeWidth={1} />
    <path d="M-1.6 5 L-3 1.5 L-0.8 -3 M1.6 5 L3 1.5 L0.8 -3" fill="none" {...LINE} strokeWidth={0.9} />
    <path d="M-2.2 6.5 L-5.5 8.5 M2.2 6.5 L5.5 8.5 M-2.4 9.5 L-5 12.5 M2.4 9.5 L5 12.5" fill="none" {...LINE} strokeWidth={0.9} />
    <ellipse cx={0} cy={11} rx={3.8} ry={3.3} fill="#C9775B" {...LINE} />
    <circle cx={0} cy={6.3} r={2.3} fill="#C9775B" {...LINE} />
    <circle cx={0} cy={1} r={4.4} fill="#D98B6A" {...LINE} />
    <Face y={1} gap={1.8} />
  </g>
);

/** Bọ cánh cam: vỏ xanh ánh kim có vệt bóng, cánh mỏng vỗ phía sau */
const Beetle: FC<{ animate: boolean }> = ({ animate }) => {
  const g = `beetle-${useId().replace(/[^\w-]/g, '')}`;
  return (
    <g>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7BE0C3" />
          <stop offset="0.5" stopColor="#3FB59B" />
          <stop offset="1" stopColor="#4C7FD9" />
        </linearGradient>
      </defs>
      <Flap animate={animate} dur="0.35s">
        <ellipse cx={-8.5} cy={0} rx={5.8} ry={3} transform="rotate(-30 -8.5 0)" {...WING} />
        <ellipse cx={8.5} cy={0} rx={5.8} ry={3} transform="rotate(30 8.5 0)" {...WING} />
      </Flap>
      <Antennae y={-9.2} spread={2.6} tip="#7BE0C3" />
      <ellipse cx={0} cy={3.5} rx={7.4} ry={8} fill={`url(#${g})`} {...LINE} />
      <path d="M0 -2.8 V11.3" {...LINE} strokeWidth={0.9} />
      <path d="M-4.6 0.5 Q-5.2 4 -3.6 7.5" fill="none" stroke="#E6FFF7" strokeWidth={1.3} strokeLinecap="round" opacity={0.85} />
      <circle cx={4} cy={1.4} r={0.9} fill="#E6FFF7" opacity={0.85} />
      <circle cx={0} cy={-5.4} r={4.4} fill="#2F7F6E" {...LINE} />
      <Face y={-5.6} gap={1.8} light />
    </g>
  );
};

/** Dế mèn: xanh lá, râu dài cong, đùi sau gập to hai bên, cánh nhỏ vỗ */
const Cricket: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <Flap animate={animate} dur="0.3s">
      <ellipse cx={-5} cy={-1} rx={4.4} ry={2.2} transform="rotate(-30 -5 -1)" {...WING} />
      <ellipse cx={5} cy={-1} rx={4.4} ry={2.2} transform="rotate(30 5 -1)" {...WING} />
    </Flap>
    <path d="M-1.5 -9.4 Q-6 -16 -12 -14 M1.5 -9.4 Q6 -16 12 -14" fill="none" {...LINE} strokeWidth={0.9} />
    <path d="M-3 5 L-8.6 -0.5 L-9.2 11.5 M3 5 L8.6 -0.5 L9.2 11.5" fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M-3 5 L-8.6 -0.5 L-9.2 11.5 M3 5 L8.6 -0.5 L9.2 11.5" fill="none" stroke="#7CC35E" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx={0} cy={5} rx={4.2} ry={6.4} fill="#8BCF6B" {...LINE} />
    <path d="M-2 2 H2 M-2.4 5 H2.4 M-2 8 H2" stroke="#6DB453" strokeWidth={0.8} strokeLinecap="round" />
    <circle cx={0} cy={-4.6} r={4.8} fill="#B7E59B" {...LINE} />
    <Face y={-4.8} gap={2} />
  </g>
);

/** Bướm trăng (rất hiếm): cánh xanh ngọc nhạt to, đốm mắt vàng, hai đuôi dài, thân trắng bông, râu lông vũ */
const LunaMoth: FC<{ animate: boolean }> = ({ animate }) => (
  <g>
    <Flap animate={animate} dur="0.9s">
      <path d="M-2 4 Q-7 6 -8 12 Q-8.6 17 -6.5 20 Q-8.5 13 -4 9 Z M2 4 Q7 6 8 12 Q8.6 17 6.5 20 Q8.5 13 4 9 Z" fill="#BFF0DE" {...LINE} strokeWidth={1} />
      <ellipse cx={-8.4} cy={-3} rx={8} ry={6.4} transform="rotate(-18 -8.4 -3)" fill="#CFF5E7" {...LINE} />
      <ellipse cx={8.4} cy={-3} rx={8} ry={6.4} transform="rotate(18 8.4 -3)" fill="#CFF5E7" {...LINE} />
      <ellipse cx={-6} cy={4.6} rx={5} ry={4} fill="#BFF0DE" {...LINE} />
      <ellipse cx={6} cy={4.6} rx={5} ry={4} fill="#BFF0DE" {...LINE} />
      {[-9, 9].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-3.4} r={2.1} fill="#FFE58A" stroke="#C99A4A" strokeWidth={0.8} />
          <circle cx={x} cy={-3.4} r={0.8} fill="#C99A4A" />
        </g>
      ))}
      <path d="M-15.5 -6 Q-12 -10 -6 -8.5 M15.5 -6 Q12 -10 6 -8.5" fill="none" stroke="#E3D9FF" strokeWidth={1.2} strokeLinecap="round" />
    </Flap>
    <ellipse cx={0} cy={3} rx={2.6} ry={6.4} fill="#FFFDFB" {...LINE} />
    <path d="M-1 -8.6 Q-4 -13 -6.2 -12 M1 -8.6 Q4 -13 6.2 -12" fill="none" stroke="#E8C98A" strokeWidth={1.6} strokeLinecap="round" />
    <circle cx={0} cy={-5} r={4.4} fill="#FFFDFB" {...LINE} />
    <Face y={-5.2} gap={1.8} />
  </g>
);

export const BUGS: HabitBug[] = [
  { id: 'ladybug', name: { vi: 'Bọ rùa', en: 'Ladybug' }, weight: 5, rarity: 'common', Art: Ladybug },
  { id: 'butterfly', name: { vi: 'Bướm', en: 'Butterfly' }, weight: 4, rarity: 'common', Art: Butterfly },
  { id: 'bee', name: { vi: 'Ong', en: 'Bee' }, weight: 4, rarity: 'common', Art: Bee },
  { id: 'caterpillar', name: { vi: 'Sâu xanh', en: 'Caterpillar' }, weight: 4, rarity: 'common', Art: Caterpillar },
  { id: 'ant', name: { vi: 'Kiến', en: 'Ant' }, weight: 4, rarity: 'common', Art: Ant },
  { id: 'firefly', name: { vi: 'Đom đóm', en: 'Firefly' }, weight: 2, rarity: 'rare', Art: Firefly },
  { id: 'beetle', name: { vi: 'Bọ cánh cam', en: 'Jewel beetle' }, weight: 2, rarity: 'rare', Art: Beetle },
  { id: 'cricket', name: { vi: 'Dế mèn', en: 'Cricket' }, weight: 2, rarity: 'rare', Art: Cricket },
  { id: 'dragonfly', name: { vi: 'Chuồn chuồn', en: 'Dragonfly' }, weight: 1, rarity: 'epic', Art: Dragonfly },
  { id: 'luna-moth', name: { vi: 'Bướm trăng', en: 'Luna moth' }, weight: 1, rarity: 'epic', Art: LunaMoth },
];

/**
 * Cách cũ: con của ngày bốc sẵn theo khoá ngày (trọng số `weight`). Giờ con của ngày được bốc thật và lưu ở
 * `DayRecord.bugId` (tỉ lệ tăng theo chuỗi, `domain/bugOdds.ts`); hàm này chỉ còn cho ngày cũ chưa có `bugId`.
 */
export function bugFor(date: string): HabitBug {
  return getBug(legacyBugFor(date, BUGS))!;
}

/** Số lần gặp từng loài, từ danh sách id con của các ngày. */
export function countBugs(ids: Iterable<string>): Map<string, number> {
  const out = new Map<string, number>();
  for (const id of ids) out.set(id, (out.get(id) ?? 0) + 1);
  return out;
}

/** Khung báo ở Hôm nay khi côn trùng vừa ghé: loài chưa gặp bao giờ → 'new'; con hiếm / rất hiếm → 'rare' / 'epic'; con thường → không báo. */
export type BugVisitKind = 'new' | 'rare' | 'epic';
export function bugVisitKind(bug: HabitBug, metBefore: boolean): BugVisitKind | null {
  if (!metBefore) return 'new';
  return bug.rarity === 'common' ? null : bug.rarity;
}

/**
 * Hào quang theo độ hiếm, vẽ sau côn trùng: hiếm = quầng tím nhạt thở nhẹ; rất hiếm = quầng vàng + 4 sao lấp lánh.
 * Toạ độ cùng hệ với côn trùng (gốc 0, 0).
 */
export function BugAura({ rarity, animate }: { rarity: BugRarity; animate: boolean }) {
  const id = `bug-aura-${useId().replace(/[^\w-]/g, '')}`;
  if (rarity === 'common') return null;
  const color = rarity === 'epic' ? '#FFE27A' : '#C4ADFF';
  return (
    <g data-testid="bug-aura" data-rarity={rarity}>
      <defs>
        <radialGradient id={id}>
          <stop offset="0" stopColor={color} stopOpacity={0.9} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={rarity === 'epic' ? 19 : 16} fill={`url(#${id})`}>
        {animate && <animate attributeName="opacity" values="0.55;1;0.55" dur="2.2s" repeatCount="indefinite" />}
      </circle>
      {rarity === 'epic' && (
        <g data-testid="bug-sparkles">
          {[[-15, -11, 0], [15, -13, 0.5], [17, 10, 1], [-14, 12, 1.5]].map(([x, y, delay]) => (
            <path
              key={`${x}${y}`}
              d={star(x, y, 3)}
              fill="#FFD84A" stroke="#C99A1E" strokeWidth={0.5} strokeLinejoin="round"
            >
              {animate && <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${delay}s`} repeatCount="indefinite" />}
            </path>
          ))}
        </g>
      )}
    </g>
  );
}

/** Sao 4 cánh tâm (x, y), bán kính r. */
export function star(x: number, y: number, r: number): string {
  const k = r * 0.3;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
}

export const getBug = (id: string | null | undefined): HabitBug | null => BUGS.find((b) => b.id === id) ?? null;

/** Côn trùng vẽ to hơn khung gốc chừng này lần để nhìn rõ trên cây. */
export const BUG_SCALE = 1.4;

/** Chỗ côn trùng lượn: phía trên bên phải mặt cây, luôn nằm trong khung 200×240. */
export function bugSpot(a: FaceAnchor): { x: number; y: number } {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  return { x: clamp(a.x + 22 * a.scale + 18, 22, 178), y: clamp(a.y - 20 * a.scale - 12, 22, 218) };
}
