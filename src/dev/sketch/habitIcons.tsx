import type { FC, ReactNode } from 'react';
import { HABIT_COLORS, HABIT_ICONS } from '../../content/habits';
import { Row } from './kit';

/*
 * Phác thảo bộ icon thói quen kiểu kawaii (10/2026), thay 24 emoji trong HABIT_ICONS.
 * Khung 32×32 như components/icons.tsx: viền cocoa, màu pastel, hầu hết có mặt cười nhỏ + má hồng
 * (đồ ngủ thì mắt nhắm). Đưa vào app: giữ emoji làm giá trị lưu (Habit.icon) để không phải đổi dữ liệu / sao lưu,
 * chỉ vẽ SVG theo emoji; emoji lạ thì hiện chữ như cũ.
 * CHƯA DÙNG (chủ repo lưu để dùng sau). Icon yếu nhất: Biết ơn (hai tay chắp, hơi giống cái chuông).
 */

const INK = '#5B4636';
const S = { stroke: INK, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** mặt kawaii: hai mắt chấm, miệng cười, má hồng; `sleep` = mắt nhắm cong */
function F({ x, y, s = 1, sleep = false }: { x: number; y: number; s?: number; sleep?: boolean }) {
  return (
    <g>
      <ellipse cx={x - 4.4 * s} cy={y + 1.7 * s} rx={1.5 * s} ry={0.9 * s} fill="#FF9FB2" />
      <ellipse cx={x + 4.4 * s} cy={y + 1.7 * s} rx={1.5 * s} ry={0.9 * s} fill="#FF9FB2" />
      {sleep ? (
        <path d={`M${x - 3.6 * s} ${y} q${1 * s} ${1 * s} ${2 * s} 0 M${x + 1.6 * s} ${y} q${1 * s} ${1 * s} ${2 * s} 0`} fill="none" stroke={INK} strokeWidth={1.1 * s} strokeLinecap="round" />
      ) : (
        <>
          <ellipse cx={x - 2.6 * s} cy={y} rx={1.05 * s} ry={1.25 * s} fill={INK} />
          <ellipse cx={x + 2.6 * s} cy={y} rx={1.05 * s} ry={1.25 * s} fill={INK} />
          <circle cx={x - 2.3 * s} cy={y - 0.45 * s} r={0.38 * s} fill="#fff" />
          <circle cx={x + 2.9 * s} cy={y - 0.45 * s} r={0.38 * s} fill="#fff" />
        </>
      )}
      <path d={`M${x - 1.2 * s} ${y + 1.5 * s} q${1.2 * s} ${1.2 * s} ${2.4 * s} 0`} fill="none" stroke={INK} strokeWidth={1.1 * s} strokeLinecap="round" />
    </g>
  );
}
const Shine = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <ellipse cx={x} cy={y} rx={1.4} ry={2.4} fill="#fff" opacity={0.7} transform={`rotate(${r} ${x} ${y})`} />
);
const Sparkle = ({ x, y, s = 1, c = '#FFE08A' }: { x: number; y: number; s?: number; c?: string }) => (
  <path d={`M${x} ${y - 3 * s} Q${x + 0.6 * s} ${y - 0.6 * s} ${x + 3 * s} ${y} Q${x + 0.6 * s} ${y + 0.6 * s} ${x} ${y + 3 * s} Q${x - 0.6 * s} ${y + 0.6 * s} ${x - 3 * s} ${y} Q${x - 0.6 * s} ${y - 0.6 * s} ${x} ${y - 3 * s} Z`} fill={c} stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />
);
const Zz = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} h3 l-3 3 h3 M${x + 4} ${y - 5} h2.2 l-2.2 2.2 h2.2`} fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
);

const Water = () => (
  <g>
    <path d="M16 3.5 C16 3.5 6.5 14.5 6.5 20 a9.5 9.5 0 0 0 19 0 C25.5 14.5 16 3.5 16 3.5 Z" fill="#A9D6FF" {...S} />
    <Shine x={11.5} y={16} r={25} />
    <F x={16} y={20.5} />
  </g>
);
const Lotus = () => (
  <g>
    <ellipse cx={16} cy={26.5} rx={12} ry={3} fill="#9FE0C8" {...S} />
    <path d="M15 25.5 C8 25.5 3.5 20 3.5 14 C9.5 14 14 18 15 25.5 Z" fill="#FFB3C1" {...S} />
    <path d="M17 25.5 C24 25.5 28.5 20 28.5 14 C22.5 14 18 18 17 25.5 Z" fill="#FFB3C1" {...S} />
    <path d="M16 5 C22 10 22 20 16 25.5 C10 20 10 10 16 5 Z" fill="#FFC9D6" {...S} />
    <F x={16} y={16.5} s={0.75} />
  </g>
);
const Sneaker = () => (
  <g>
    <path d="M2 12 h4 M1.5 16 h3.5 M2.5 20 h2" stroke="#A9D6FF" strokeWidth={1.8} strokeLinecap="round" />
    <path d="M7 22 V13.5 Q7 10 10 10 H14 Q15.5 14 19.5 14.5 L25 16 Q29.5 17.2 29.5 22 Z" fill="#FFB3C1" {...S} />
    <rect x={6} y={22} width={24.5} height={4.5} rx={2.2} fill="#fff" {...S} />
    <path d="M14.5 13.5 l2 -2.5 M17.5 14.5 l2 -2.5" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
    <F x={21.5} y={18.6} s={0.7} />
  </g>
);
const Foot = ({ x, y, r, face }: { x: number; y: number; r: number; face?: boolean }) => (
  <g transform={`rotate(${r} ${x} ${y})`}>
    <ellipse cx={x} cy={y} rx={4.6} ry={6.6} fill="#FFE3D0" {...S} />
    {[-3.4, -1.1, 1.3, 3.4].map((dx, i) => <circle key={dx} cx={x + dx} cy={y - 8.6 + Math.abs(dx) * 0.35 - (i === 1 ? 0.6 : 0)} r={i === 0 ? 1.4 : 1.15} fill="#FFE3D0" stroke={INK} strokeWidth={1.2} />)}
    {face && <F x={x} y={y + 0.5} s={0.55} />}
  </g>
);
const Footprints = () => (
  <g>
    <Foot x={10} y={21} r={-12} face />
    <Foot x={22} y={13} r={12} face />
  </g>
);
const Books = () => (
  <g>
    <g transform="rotate(-5 16 11)">
      <rect x={7} y={7.5} width={19} height={5.5} rx={1.6} fill="#FFB3C1" {...S} />
      <path d="M23 9.5 h2" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
    </g>
    <rect x={5.5} y={13} width={20} height={5.5} rx={1.6} fill="#FFE08A" {...S} />
    <path d="M22.5 15.7 h2" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
    <rect x={4} y={18.5} width={24} height={9} rx={2} fill="#A9D6FF" {...S} />
    <path d="M24.5 21 v4.5" stroke="#fff" strokeWidth={1.4} strokeLinecap="round" />
    <F x={14} y={22.4} s={0.75} />
  </g>
);
const Pencil = () => (
  <g transform="rotate(40 16 16)">
    <rect x={11.5} y={5.5} width={9} height={16.5} fill="#FFE08A" {...S} />
    <path d="M11.5 22 L16 29.5 L20.5 22 Z" fill="#F2D3A0" {...S} />
    <path d="M14.6 27 L16 29.5 L17.4 27 Z" fill={INK} />
    <rect x={11.5} y={1.8} width={9} height={4.6} rx={1.6} fill="#FFB3C1" {...S} />
    <F x={16} y={13} s={0.65} />
  </g>
);
const Apple = () => (
  <g>
    <path d="M16 9 Q16 6 18.5 3.5" fill="none" {...S} />
    <path d="M17.5 7 Q22 2.5 26 5.5 Q22 9.5 17.5 7 Z" fill="#9FE0C8" {...S} />
    <path d="M16 9.5 C10 5.5 3.8 9.5 4.8 17.5 C5.8 25 11 29 16 27.3 C21 29 26.2 25 27.2 17.5 C28.2 9.5 22 5.5 16 9.5 Z" fill="#FF8A8A" {...S} />
    <Shine x={9.5} y={14} r={20} />
    <F x={16} y={18.5} />
  </g>
);
const Salad = () => (
  <g>
    <circle cx={10} cy={14.5} r={4.2} fill="#B5D99C" {...S} />
    <circle cx={22} cy={14.5} r={4.2} fill="#B5D99C" {...S} />
    <circle cx={16} cy={11} r={5} fill="#9FE0C8" {...S} />
    <circle cx={20} cy={12.2} r={2.3} fill="#FF8A8A" stroke={INK} strokeWidth={1.3} />
    <path d="M3.5 16.5 H28.5 Q27.5 27.5 16 27.5 Q4.5 27.5 3.5 16.5 Z" fill="#A9D6FF" {...S} />
    <F x={16} y={21} s={0.85} />
  </g>
);
const Milk = () => (
  <g>
    <path d="M8.5 5 H23.5 L21.3 27 Q21.2 28.5 19.7 28.5 H12.3 Q10.8 28.5 10.7 27 Z" fill="#E6F4FF" {...S} />
    <path d="M9.6 12 Q12.5 10.6 16 12 Q19.5 13.4 22.4 12 L21.2 26.8 Q21.1 27.8 20 27.8 H12 Q10.9 27.8 10.8 26.8 Z" fill="#FFFDF8" />
    <path d="M8.5 5 H23.5 L21.3 27 Q21.2 28.5 19.7 28.5 H12.3 Q10.8 28.5 10.7 27 Z" fill="none" {...S} />
    <path d="M9.6 12 Q12.5 10.6 16 12 Q19.5 13.4 22.4 12" fill="none" stroke="#C9E3F5" strokeWidth={1.4} />
    <F x={16} y={19} s={0.85} />
  </g>
);
const Coffee = () => (
  <g>
    <path d="M10.5 9.5 q-2 -2 0 -4.2 M15.5 9.5 q-2 -2 0 -4.2" fill="none" stroke="#C9A88B" strokeWidth={1.6} strokeLinecap="round" />
    <path d="M22.5 14.5 q5.5 0 5.5 3.8 q0 3.8 -5.5 3.8" fill="none" {...S} />
    <ellipse cx={14.5} cy={27.5} rx={12} ry={2.4} fill="#FFFDF8" {...S} />
    <path d="M5.5 12 H23.5 V20 Q23.5 26.5 17 26.5 H12 Q5.5 26.5 5.5 20 Z" fill="#C9A88B" {...S} />
    <path d="M6.5 12.8 H22.5" stroke="#8B5E3C" strokeWidth={2} strokeLinecap="round" />
    <F x={14.5} y={18.8} s={0.85} />
  </g>
);
const Bed = () => (
  <g>
    <path d="M4 28 v-2 M28 28 v-2" {...S} />
    <rect x={3} y={9} width={5} height={17} rx={2} fill="#C9A88B" {...S} />
    <rect x={3} y={19} width={26} height={7} rx={2.2} fill="#A9D6FF" {...S} />
    <rect x={7.5} y={12} width={11} height={7.5} rx={3.6} fill="#fff" {...S} />
    <path d="M16 15 H27 Q29 15 29 17 V21 H16 Z" fill="#FFB3C1" {...S} />
    <F x={13} y={15.2} s={0.55} sleep />
    <Zz x={21} y={7} />
  </g>
);
const Moon = () => (
  <g>
    <path d="M19 4 A12 12 0 1 0 28 21.5 A9.5 9.5 0 0 1 19 4 Z" fill="#FFE08A" {...S} />
    <F x={12.5} y={19} s={0.8} sleep />
    <Zz x={22} y={10} />
    <Sparkle x={26} y={4} s={0.7} />
  </g>
);
const Broom = () => (
  <g>
    <path d="M25.5 2.5 L16 17" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
    <path d="M25.5 2.5 L16 17" stroke="#C9A88B" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M13 14.5 L20 18.5 L15.5 29 Q9 29.5 4.5 25 Z" fill="#FFE08A" {...S} />
    <path d="M12.6 15.6 L19.4 19.5" stroke="#F5C04A" strokeWidth={2.4} />
    <path d="M13 14.5 L20 18.5" fill="none" {...S} />
    <F x={12.6} y={22.6} s={0.6} />
    <Sparkle x={26} y={24} s={0.75} c="#fff" />
  </g>
);
const Toothbrush = () => (
  <g>
    <circle cx={25} cy={6} r={2.3} fill="#E6F9FF" stroke={INK} strokeWidth={1.1} />
    <circle cx={20.5} cy={4.5} r={1.5} fill="#E6F9FF" stroke={INK} strokeWidth={1.1} />
    <circle cx={28} cy={10} r={1.3} fill="#E6F9FF" stroke={INK} strokeWidth={1.1} />
    <rect x={3} y={17} width={25} height={6.5} rx={3.2} fill="#A9D6FF" {...S} />
    <rect x={19.5} y={11} width={8} height={6} rx={1.5} fill="#fff" {...S} />
    <path d="M21.5 11.5 v5 M23.5 11.5 v5 M25.5 11.5 v5" stroke="#C9E3F5" strokeWidth={1.2} />
    <F x={11} y={19.6} s={0.6} />
  </g>
);
const Pill = () => (
  <g transform="rotate(-35 16 16)">
    <path d="M16 10.5 H10.5 a5.5 5.5 0 0 0 0 11 H16 Z" fill="#FFB3C1" />
    <path d="M16 10.5 H21.5 a5.5 5.5 0 0 1 0 11 H16 Z" fill="#fff" />
    <rect x={5} y={10.5} width={22} height={11} rx={5.5} fill="none" {...S} />
    <path d="M16 10.5 v11" stroke={INK} strokeWidth={1.4} />
    <F x={16} y={15.6} s={0.75} />
  </g>
);
const Coin = () => (
  <g>
    <circle cx={16} cy={17} r={11.5} fill="#FFE08A" {...S} />
    <circle cx={16} cy={17} r={8.5} fill="none" stroke="#F5C04A" strokeWidth={1.6} />
    <Shine x={9.5} y={11.5} r={40} />
    <F x={16} y={17} />
    <Sparkle x={27} y={5} s={0.8} />
  </g>
);
const Palette = () => (
  <g>
    <path d="M16 4 C8 4 3 10 3 16.5 C3 23.5 9 28.5 15 28.5 C18.5 28.5 18.5 25.5 17.3 23.5 C16 21 18 19 21.5 20 C25.5 21 29 19 29 14.5 C29 8 23 4 16 4 Z" fill="#FFF1C1" {...S} />
    <circle cx={10} cy={11.5} r={2.3} fill="#FFB3C1" stroke={INK} strokeWidth={1.2} />
    <circle cx={16.5} cy={8.5} r={2.3} fill="#A9D6FF" stroke={INK} strokeWidth={1.2} />
    <circle cx={23} cy={10.5} r={2.3} fill="#9FE0C8" stroke={INK} strokeWidth={1.2} />
    <circle cx={25} cy={16} r={2} fill="#C9B8FF" stroke={INK} strokeWidth={1.2} />
    <F x={10.5} y={20} s={0.65} />
  </g>
);
const Note = () => (
  <g>
    <path d="M13.5 8.5 L27 4.5 V9 L13.5 13 Z" fill={INK} stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
    <path d="M13.5 23 V8.5 M27 20 V4.5" {...S} />
    <ellipse cx={9.5} cy={23.5} rx={5} ry={4} fill="#C9B8FF" {...S} transform="rotate(-15 9.5 23.5)" />
    <ellipse cx={23} cy={20.5} rx={5} ry={4} fill="#FFB3C1" {...S} transform="rotate(-15 23 20.5)" />
    <F x={9.3} y={23.2} s={0.55} />
    <F x={22.8} y={20.2} s={0.55} />
  </g>
);
const Sprout = () => (
  <g>
    <path d="M16 19 V13" {...S} />
    <path d="M16 15 C10 15 5.5 11.5 5.5 6 C11 6 16 9.5 16 15 Z" fill="#B5D99C" {...S} />
    <path d="M16 13 C16 8 20 3.5 26.5 3.5 C26.5 9 22.5 13 16 13 Z" fill="#9FE0C8" {...S} />
    <path d="M7 18 H25 L22.5 29 H9.5 Z" fill="#F2A88A" {...S} />
    <rect x={6} y={16.5} width={20} height={3.5} rx={1.5} fill="#E38E6E" {...S} />
    <F x={16} y={23.6} s={0.75} />
  </g>
);
const Pray = () => (
  <g>
    <path d="M16 6.5 C12.5 7 9 12 7.6 17.5 L6 23.5 Q5.4 26 8 26 H16 Z" fill="#FFE3D0" {...S} />
    <path d="M16 6.5 C19.5 7 23 12 24.4 17.5 L26 23.5 Q26.6 26 24 26 H16 Z" fill="#FFE3D0" {...S} />
    <path d="M9.6 17 q1.6 -2.4 3.4 -0.6 M22.4 17 q-1.6 -2.4 -3.4 -0.6" fill="none" stroke={INK} strokeWidth={1.2} strokeLinecap="round" />
    <rect x={5} y={25.5} width={22} height={4} rx={2} fill="#C9B8FF" {...S} />
    <F x={16} y={20.4} s={0.62} />
    <path d="M5.5 9 q-2 -1.7 0 -3.2 q1.1 -0.6 2 0.3 q0.9 -0.9 2 -0.3 q2 1.5 0 3.2 l-2 1.7 Z" fill="#FF8FAB" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
    <Sparkle x={26.5} y={7} s={0.85} />
  </g>
);
const NoPhone = () => (
  <g>
    <rect x={8} y={3.5} width={14.5} height={25} rx={3.2} fill="#C9B8FF" {...S} />
    <rect x={10.2} y={7} width={10.1} height={15.5} rx={1.6} fill="#FFFDF8" stroke={INK} strokeWidth={1.3} />
    <F x={15.25} y={14} s={0.6} sleep />
    <circle cx={15.25} cy={25.3} r={1.1} fill={INK} />
    <circle cx={24.5} cy={23.5} r={5.2} fill="#FF8A8A" {...S} />
    <path d="M21 27 L28 20" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
  </g>
);
const Lotion = () => (
  <g>
    <path d="M20 5 H25.5" {...S} />
    <rect x={12} y={3.5} width={8} height={4} rx={1.2} fill="#fff" {...S} />
    <rect x={13.5} y={7.5} width={5} height={4.5} fill="#fff" {...S} />
    <rect x={8.5} y={12} width={15} height={16.5} rx={4.5} fill="#9FE0C8" {...S} />
    <Shine x={11.5} y={16.5} />
    <F x={16} y={20.5} s={0.85} />
  </g>
);
const Sun = () => (
  <g>
    {Array.from({ length: 8 }, (_, i) => i * 45).map((a) => (
      <ellipse key={a} cx={16} cy={4.3} rx={2} ry={2.8} fill="#FFC85A" stroke={INK} strokeWidth={1.2} transform={`rotate(${a} 16 16)`} />
    ))}
    <circle cx={16} cy={16} r={8.6} fill="#FFE08A" {...S} />
    <F x={16} y={16} s={0.85} />
  </g>
);
const Heart = () => (
  <g>
    <path d="M16 27.5 C6 20.5 3 15.5 3 10.8 C3 6.8 6 4 9.6 4 C12.6 4 14.6 6 16 8.2 C17.4 6 19.4 4 22.4 4 C26 4 29 6.8 29 10.8 C29 15.5 26 20.5 16 27.5 Z" fill="#FF8FAB" {...S} />
    <Shine x={8.5} y={9.5} r={-30} />
    <F x={16} y={14.5} />
  </g>
);

/** emoji (giá trị đang lưu) → icon vẽ mới + tên gợi ý */
export const KAWAII_HABIT_ICONS: Record<string, { name: string; Art: FC }> = {
  '💧': { name: 'Uống nước', Art: Water },
  '🧘': { name: 'Thiền / yoga', Art: Lotus },
  '🏃': { name: 'Chạy bộ', Art: Sneaker },
  '🚶': { name: 'Đi bộ', Art: Footprints },
  '📚': { name: 'Đọc sách', Art: Books },
  '✍️': { name: 'Viết', Art: Pencil },
  '🍎': { name: 'Trái cây', Art: Apple },
  '🥗': { name: 'Ăn rau', Art: Salad },
  '🥛': { name: 'Uống sữa', Art: Milk },
  '☕': { name: 'Cà phê', Art: Coffee },
  '🛏️': { name: 'Đi ngủ sớm', Art: Bed },
  '😴': { name: 'Ngủ đủ', Art: Moon },
  '🧹': { name: 'Dọn dẹp', Art: Broom },
  '🪥': { name: 'Đánh răng', Art: Toothbrush },
  '💊': { name: 'Uống thuốc', Art: Pill },
  '💰': { name: 'Tiết kiệm', Art: Coin },
  '🎨': { name: 'Vẽ', Art: Palette },
  '🎵': { name: 'Âm nhạc', Art: Note },
  '🌿': { name: 'Chăm cây', Art: Sprout },
  '🙏': { name: 'Biết ơn', Art: Pray },
  '📵': { name: 'Bỏ điện thoại', Art: NoPhone },
  '🧴': { name: 'Dưỡng da', Art: Lotion },
  '🌞': { name: 'Dậy sớm', Art: Sun },
  '❤️': { name: 'Yêu thương', Art: Heart },
};

function Icon({ emoji, size }: { emoji: string; size: number }) {
  const { Art } = KAWAII_HABIT_ICONS[emoji];
  return <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'block' }}><Art /></svg>;
}

const COLORS = Object.values(HABIT_COLORS);
const chip = (on: boolean, color: string, children: ReactNode) => (
  <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: on ? color : '#fff', border: on ? `2px solid ${INK}` : '2px dashed #9C8574', boxShadow: on ? `0 3px 0 ${INK}` : undefined }}>{children}</span>
);

export function HabitIconSketches() {
  return (
    <div style={{ font: '13px sans-serif', color: INK, width: 960 }}>
      <Row title="24 icon kawaii (cỡ to để soát nét) · emoji cũ bên cạnh">
        {HABIT_ICONS.map((e) => (
          <figure key={e} style={{ margin: 0, width: 112, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
              <Icon emoji={e} size={72} />
              <span style={{ fontSize: 22, opacity: 0.6 }}>{e}</span>
            </div>
            <figcaption style={{ fontWeight: 700 }}>{KAWAII_HABIT_ICONS[e].name}</figcaption>
          </figure>
        ))}
      </Row>
      <Row title="Trong chip Hôm nay (48px, icon 28px): chưa tick | đã tick">
        {HABIT_ICONS.map((e, i) => (
          <div key={e} style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 30, padding: 4 }}>
            {chip(false, '', <Icon emoji={e} size={28} />)}
            {chip(true, COLORS[i % COLORS.length], <Icon emoji={e} size={28} />)}
          </div>
        ))}
      </Row>
      <Row title="Trong ô chọn của form (lưới 8 cột) và cỡ nhỏ ở bảng báo cáo (18px)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 40px)', gap: 6, background: '#fff', padding: 8, borderRadius: 12 }}>
          {HABIT_ICONS.map((e, i) => (
            <span key={e} style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: i === 0 ? '#FFF1C1' : '#fff', border: i === 0 ? `2px solid ${INK}` : '2px solid transparent' }}><Icon emoji={e} size={30} /></span>
          ))}
        </div>
        <div style={{ background: '#fff', padding: 8, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {HABIT_ICONS.slice(0, 8).map((e) => (
            <span key={e} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Icon emoji={e} size={18} />{KAWAII_HABIT_ICONS[e].name}</span>
          ))}
        </div>
      </Row>
    </div>
  );
}
