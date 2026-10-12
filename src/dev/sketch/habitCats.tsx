import type { FC, ReactNode } from 'react';
import { HABIT_COLORS, HABIT_ICONS } from '../../content/habits';
import { Row } from './kit';

/*
 * Phác thảo bộ icon thói quen "mèo mướp" (10/2026), theo ảnh mẫu chủ repo gửi: mèo xám sọc nằm ngửa khoe bụng,
 * viền tím than, bụng + bàn chân trắng, bóng tím nhạt, má đỏ, mắt nhắm cười, ria, lấp lánh vàng, tim đỏ.
 * Bản 2: nhiều dáng (nằm ngửa như ảnh, ổ bánh mì, chạy, vươn vai, ngồi trong cốc/bát/chậu) + chi tiết hài.
 * Khung 48×48, vẽ ra cỡ ~34px. Đưa vào app: giữ emoji làm giá trị lưu, chỉ đổi hình hiển thị (như habitIcons.tsx).
 */

const INK = '#33264A', FUR = '#8A8799', FUR_LIGHT = '#A9A6B8', STRIPE = '#5B566E', SHADE = '#C9BEE6', WHITE = '#FFFFFF';
const BLUSH = '#EF5A6F', HEART = '#E8506A', GOLD = '#F5C842', PINK = '#F49AB0', SKY = '#9FD3F7', MINT = '#A6E3C8', LEAF = '#B5D99C';
const S = { stroke: INK, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
type Eyes = 'happy' | 'sleep' | 'open' | 'wide';
type Mouth = 'w' | 'tongue' | 'open' | 'yawn' | 'oh';

/** đầu mèo, tâm (x, y); rộng 26 × cao 21 khi s = 1, tai cao tới y − 17 */
function Head({ x, y, s = 1, eyes = 'happy', mouth = 'w', tilt = 0 }: { x: number; y: number; s?: number; eyes?: Eyes; mouth?: Mouth; tilt?: number }) {
  const big = eyes === 'wide';
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${s})`}>
      <path d="M-12.5 -3 L-11 -16 Q-10.2 -18 -8.4 -16.4 L-2.5 -9.5 Z" fill={FUR} {...S} />
      <path d="M12.5 -3 L11 -16 Q10.2 -18 8.4 -16.4 L2.5 -9.5 Z" fill={FUR} {...S} />
      <path d="M-10.6 -6 L-9.8 -13 L-5.6 -9 Z M10.6 -6 L9.8 -13 L5.6 -9 Z" fill={SHADE} />
      <ellipse cx={0} cy={0} rx={13} ry={10.5} fill={FUR} {...S} />
      <path d="M-2.6 -10 v3.4 M0 -10.5 v4.4 M2.6 -10 v3.4 M-12.6 -1.5 h3 M12.6 -1.5 h-3" stroke={STRIPE} strokeWidth={1.6} strokeLinecap="round" />
      <ellipse cx={0} cy={4.6} rx={7.6} ry={5} fill={WHITE} />
      <ellipse cx={-8.4} cy={3.4} rx={2.6} ry={1.6} fill={BLUSH} />
      <ellipse cx={8.4} cy={3.4} rx={2.6} ry={1.6} fill={BLUSH} />
      {eyes === 'open' || big ? (
        <>
          <ellipse cx={-5} cy={-0.6} rx={big ? 2.2 : 1.5} ry={big ? 2.6 : 1.8} fill={INK} />
          <ellipse cx={5} cy={-0.6} rx={big ? 2.2 : 1.5} ry={big ? 2.6 : 1.8} fill={INK} />
          <circle cx={-4.3} cy={-1.5} r={big ? 0.9 : 0.55} fill={WHITE} /><circle cx={5.7} cy={-1.5} r={big ? 0.9 : 0.55} fill={WHITE} />
        </>
      ) : eyes === 'happy' ? (
        <path d="M-7.2 0.4 q2.2 -2.6 4.4 0 M2.8 0.4 q2.2 -2.6 4.4 0" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      ) : (
        <path d="M-7.2 -0.6 q2.2 2.4 4.4 0 M2.8 -0.6 q2.2 2.4 4.4 0" fill="none" stroke={INK} strokeWidth={1.5} strokeLinecap="round" />
      )}
      <path d="M-0.9 2.4 h1.8 l-0.9 1 Z" fill={BLUSH} stroke={INK} strokeWidth={0.8} strokeLinejoin="round" />
      {(mouth === 'w' || mouth === 'tongue') && (
        <>
          {mouth === 'tongue' && <path d="M0.2 4.6 q0 3.2 1.7 3.2 q1.7 0 1.7 -3.2 Z" fill={PINK} stroke={INK} strokeWidth={0.9} strokeLinejoin="round" />}
          <path d="M-1.8 4 q0.9 1.1 1.8 0 q0.9 1.1 1.8 0" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
        </>
      )}
      {mouth === 'oh' && <ellipse cx={0} cy={5.4} rx={1.3} ry={1.5} fill="#7A3B4A" stroke={INK} strokeWidth={0.9} />}
      {mouth === 'open' && <path d="M-2.6 4.2 Q0 9.5 2.6 4.2 Z" fill="#7A3B4A" stroke={INK} strokeWidth={1} strokeLinejoin="round" />}
      {mouth === 'yawn' && (
        <>
          <ellipse cx={0} cy={6} rx={3.4} ry={4} fill="#7A3B4A" stroke={INK} strokeWidth={1.1} />
          <ellipse cx={0} cy={8} rx={2} ry={1.4} fill={PINK} />
        </>
      )}
      <path d="M-13 3 h-3.4 M-12.6 5.6 l-3.2 1.2 M13 3 h3.4 M12.6 5.6 l3.2 1.2" stroke={INK} strokeWidth={1} strokeLinecap="round" />
    </g>
  );
}
/** ngực + bụng trắng dưới đầu ở (x, y) (mèo ngồi nhìn thẳng) */
function Torso({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 12} rx={10.5} ry={8} fill={FUR} {...S} />
      <path d={`M${x - 10} ${y + 14} h3 M${x + 10} ${y + 14} h-3`} stroke={STRIPE} strokeWidth={1.6} strokeLinecap="round" />
      <ellipse cx={x} cy={y + 13.5} rx={5.4} ry={5.4} fill={WHITE} />
    </g>
  );
}
const Paw = ({ x, y, r = 0 }: { x: number; y: number; r?: number }) => (
  <g transform={`rotate(${r} ${x} ${y})`}>
    <ellipse cx={x} cy={y} rx={3.4} ry={2.8} fill={WHITE} {...S} strokeWidth={1.5} />
    <path d={`M${x - 1} ${y - 2.4} v1.4 M${x + 1} ${y - 2.4} v1.4`} stroke={INK} strokeWidth={0.9} strokeLinecap="round" />
  </g>
);
/** chân / tay lông xám từ (x1, y1) tới bàn chân ở (x2, y2) */
const Arm = ({ x1, y1, x2, y2, bend = 0 }: { x1: number; y1: number; x2: number; y2: number; bend?: number }) => {
  const d = `M${x1} ${y1} Q${(x1 + x2) / 2 + bend} ${(y1 + y2) / 2} ${x2} ${y2}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={7.4} strokeLinecap="round" />
      <path d={d} fill="none" stroke={FUR} strokeWidth={4.2} strokeLinecap="round" />
      <Paw x={x2} y={y2} />
    </g>
  );
};
/** đuôi có sọc */
const Tail = ({ d }: { d: string }) => (
  <g fill="none" strokeLinecap="round">
    <path d={d} stroke={INK} strokeWidth={6} />
    <path d={d} stroke={FUR} strokeWidth={3.2} />
    <path d={d} stroke={STRIPE} strokeWidth={3.2} strokeDasharray="1.6 4.4" strokeLinecap="butt" />
  </g>
);
type Limb = [number, number, number, number, number?];
const limbs = (ls: Limb[]) => ls.map(([x1, y1, x2, y2, b], i) => <Arm key={i} x1={x1} y1={y1} x2={x2} y2={y2} bend={b ?? 0} />);

/** mèo nằm ngửa khoe bụng như ảnh mẫu: đầu trái, thân ngang, chân giơ lên, đuôi cong phải */
function OnBack({ front, back = [[34, 31, 36, 21, -2], [40, 32, 44, 23, 2]], eyes = 'happy', mouth = 'w', dy = 0, children, over }: { front: Limb[]; back?: Limb[]; eyes?: Eyes; mouth?: Mouth; dy?: number; children?: ReactNode; over?: ReactNode }) {
  return (
    <g transform={`translate(0 ${dy})`}>
      <Tail d="M42 39 Q47.5 42.5 43 44.6 Q36 46.4 29 45" />
      <path d="M14 36 C14 28.5 22 26.5 31 27.5 C40 28.5 45.5 31 45.5 36 C45.5 41 38 43.5 30 43.5 C21 43.5 14 42 14 36 Z" fill={FUR} {...S} />
      <path d="M17.5 33 C20 29.2 27 28.8 33 29.8 C39 30.8 42.5 32.6 42 35.2 C36 37 25 37 17.5 33 Z" fill={WHITE} />
      <path d="M21 35.4 C27 37.4 35 37.6 41.5 36" fill="none" stroke={SHADE} strokeWidth={2} strokeLinecap="round" />
      <path d="M23 41.5 l0.8 -3 M28 42.6 l0.4 -3.2 M33 42.4 l0 -3.2 M38 41.2 l-0.6 -3" stroke={STRIPE} strokeWidth={1.8} strokeLinecap="round" />
      {limbs(back)}
      {children}
      {limbs(front)}
      <Head x={11.5} y={35} s={0.86} tilt={-14} eyes={eyes} mouth={mouth} />
      {over}
    </g>
  );
}
/** mèo "ổ bánh mì": thân tròn dẹt, chân giấu dưới bụng, đầu ở (x, y) */
function Loaf({ x, y, eyes = 'happy', mouth = 'w', tail = true, tilt = 0 }: { x: number; y: number; eyes?: Eyes; mouth?: Mouth; tail?: boolean; tilt?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 9} rx={14} ry={8.5} fill={FUR} {...S} />
      <path d={`M${x - 13} ${y + 7} h3 M${x - 13.4} ${y + 10.5} h3 M${x + 13} ${y + 7} h-3 M${x + 13.4} ${y + 10.5} h-3`} stroke={STRIPE} strokeWidth={1.6} strokeLinecap="round" />
      {tail && <Tail d={`M${x + 12} ${y + 12} Q${x + 15} ${y + 18.5} ${x + 3} ${y + 17}`} />}
      <ellipse cx={x - 5} cy={y + 16.4} rx={3} ry={1.9} fill={WHITE} {...S} strokeWidth={1.4} />
      <ellipse cx={x + 2.4} cy={y + 16.6} rx={3} ry={1.9} fill={WHITE} {...S} strokeWidth={1.4} />
      <Head x={x} y={y} eyes={eyes} mouth={mouth} tilt={tilt} />
    </g>
  );
}
const Sparkle = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={`M${x} ${y - 3 * s} Q${x + 0.5 * s} ${y - 0.5 * s} ${x + 3 * s} ${y} Q${x + 0.5 * s} ${y + 0.5 * s} ${x} ${y + 3 * s} Q${x - 0.5 * s} ${y + 0.5 * s} ${x - 3 * s} ${y} Q${x - 0.5 * s} ${y - 0.5 * s} ${x} ${y - 3 * s} Z`} fill={GOLD} />
);
const Dots = ({ x, y }: { x: number; y: number }) => (
  <g fill={GOLD}><circle cx={x} cy={y} r={0.9} /><circle cx={x + 2.2} cy={y - 1.4} r={0.7} /><circle cx={x + 1} cy={y + 2} r={0.6} /></g>
);
const HeartShape = ({ x, y, s = 1, fill = HEART }: { x: number; y: number; s?: number; fill?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 5 C-5 1.5 -6 -1 -6 -2.8 C-6 -4.8 -4.4 -6 -2.8 -6 C-1.6 -6 -0.6 -5.2 0 -4.2 C0.6 -5.2 1.6 -6 2.8 -6 C4.4 -6 6 -4.8 6 -2.8 C6 -1 5 1.5 0 5 Z" fill={fill} />
);
const Zz = ({ x, y }: { x: number; y: number }) => (
  <path d={`M${x} ${y} h3.4 l-3.4 3.4 h3.4 M${x + 5} ${y - 6} h2.6 l-2.6 2.6 h2.6`} fill="none" stroke={INK} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
);
const Sweat = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -3.6 C0 -3.6 -2.4 -0.6 -2.4 1 a2.4 2.4 0 0 0 4.8 0 C2.4 -0.6 0 -3.6 0 -3.6 Z" fill={SKY} stroke={INK} strokeWidth={1} />
);
const Note = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M1.6 2 V-6 L5 -7" fill="none" stroke={INK} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /><ellipse cx={0} cy={2.4} rx={2} ry={1.5} fill={INK} /></g>
);
const PawPrint = ({ x, y, r = 0, s = 1 }: { x: number; y: number; r?: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} fill={PINK} stroke={INK} strokeWidth={1.2}>
    <ellipse cx={0} cy={1.5} rx={3} ry={2.5} />
    <circle cx={-3} cy={-2.3} r={1.2} /><circle cx={-1} cy={-3.8} r={1.2} /><circle cx={1.4} cy={-3.8} r={1.2} /><circle cx={3.3} cy={-2.2} r={1.2} />
  </g>
);

// ---- 24 icon ----

/** Uống nước: nằm ngửa, hai tay đỡ giọt nước to, lè lưỡi */
const Water = () => (
  <OnBack front={[[18, 31, 15, 19, -2], [23, 29, 26, 19, 2]]} mouth="tongue">
    <path d="M21 0.5 C21 0.5 13.5 9 13.5 13.6 a7.5 7.5 0 0 0 15 0 C28.5 9 21 0.5 21 0.5 Z" fill={SKY} {...S} />
    <ellipse cx={17.5} cy={12} rx={1.1} ry={2} fill={WHITE} transform="rotate(25 17.5 12)" />
    <circle cx={32} cy={8} r={1.2} fill={SKY} /><circle cx={9} cy={8} r={0.9} fill={SKY} />
  </OnBack>
);
/** Thiền: ổ bánh mì bay lơ lửng trên đệm */
const Yoga = () => (
  <g>
    <circle cx={24} cy={22} r={19} fill={SHADE} opacity={0.3} />
    <ellipse cx={24} cy={44.5} rx={12} ry={3} fill={SHADE} {...S} />
    <path d="M15 41 q2 -1.2 4 0 M29 41 q2 -1.2 4 0" fill="none" stroke={SHADE} strokeWidth={1.6} strokeLinecap="round" />
    <Loaf x={24} y={18} eyes="sleep" />
    <Sparkle x={6} y={10} /><Sparkle x={42} y={12} s={0.8} /><Dots x={39} y={3} />
  </g>
);
/** Chạy bộ: nhìn ngang, chân chạy tít, toát mồ hôi, lè lưỡi */
const Run = () => (
  <g>
    <path d="M1 22 h5 M0.5 27 h4 M2 32 h3" stroke={SKY} strokeWidth={2} strokeLinecap="round" />
    <Tail d="M12 28 Q6 22 4 13" />
    {limbs([[17, 36, 9, 42, -2], [29, 36, 36, 44, 1]])}
    <ellipse cx={22} cy={31} rx={13} ry={7.4} fill={FUR} {...S} transform="rotate(-6 22 31)" />
    <path d="M14 25.5 v3 M19 24.5 v3.4 M24 24.2 v3.4" stroke={STRIPE} strokeWidth={1.8} strokeLinecap="round" />
    {limbs([[14, 36, 5, 37, 2], [31, 34, 42, 38, -2]])}
    <Head x={34} y={21} tilt={8} eyes="wide" mouth="tongue" />
    <Sweat x={45} y={10} /><Sweat x={22} y={9} s={0.8} />
  </g>
);
/** Đi bộ: dạo bước, đuôi dựng cong, huýt sáo */
const Walk = () => (
  <g>
    <PawPrint x={4} y={44} r={80} s={0.6} /><PawPrint x={4} y={36} r={80} s={0.55} />
    <Tail d="M12 29 Q8 20 9 12 Q10 6 15 8" />
    {limbs([[17, 36, 16, 44], [28, 36, 30, 44]])}
    <ellipse cx={22} cy={32} rx={12} ry={7} fill={FUR} {...S} />
    <path d="M15 26.5 v3 M20 25.5 v3.4 M25 25.5 v3.4" stroke={STRIPE} strokeWidth={1.8} strokeLinecap="round" />
    {limbs([[14, 36, 12, 44], [30, 35, 34, 43]])}
    <Head x={33} y={22} tilt={6} eyes="happy" mouth="oh" />
    <Note x={43} y={40} s={0.75} />
  </g>
);
/** Đọc sách: ngủ gục trên sách, bong bóng mũi */
const Books = () => (
  <g>
    <ellipse cx={33} cy={31} rx={12} ry={6.5} fill={FUR} {...S} />
    <path d="M28 25 v3 M33 24.6 v3.4 M38 25 v3" stroke={STRIPE} strokeWidth={1.8} strokeLinecap="round" />
    <Tail d="M44 32 Q48 24 44 18" />
    <path d="M4 36 Q14 32.5 24 36 Q34 32.5 44 36 V46 Q34 42.5 24 46 Q14 42.5 4 46 Z" fill={WHITE} {...S} />
    <path d="M24 36 V46 M8 38.5 q5 -1.6 9 0 M31 38.5 q5 -1.6 9 0 M8 41.5 q5 -1.6 9 0 M31 41.5 q5 -1.6 9 0" fill="none" stroke={SHADE} strokeWidth={1.3} strokeLinecap="round" />
    <Paw x={9} y={36.5} r={-10} /><Paw x={38} y={36} r={10} />
    <Head x={21} y={28} tilt={10} eyes="sleep" mouth="oh" />
    <circle cx={26.5} cy={34} r={2.6} fill="#DDF2FF" stroke={INK} strokeWidth={0.9} />
    <Zz x={33} y={13} />
  </g>
);
/** Viết: ôm bút chì khổng lồ, lè lưỡi tập trung */
const Pencil = () => (
  <g>
    <Torso x={17} y={27} />
    <g transform="translate(-3 4) rotate(32 37 24)">
      <rect x={33.5} y={6} width={7} height={22} fill="#FFD45C" {...S} />
      <path d="M33.5 28 L37 34.5 L40.5 28 Z" fill="#F2D3A0" {...S} />
      <path d="M36 32.3 L37 34.5 L38 32.3 Z" fill={INK} />
      <rect x={33.5} y={2} width={7} height={4.5} rx={1.5} fill={PINK} {...S} />
    </g>
    <path d="M34 44 q2 -3 4 0 t4 0 t4 0" fill="none" stroke={SHADE} strokeWidth={1.6} strokeLinecap="round" />
    {limbs([[22, 36, 31, 30, -2], [14, 37, 27, 24, -6]])}
    <Head x={17} y={27} eyes="open" mouth="tongue" />
    <Sweat x={5} y={14} s={0.8} />
  </g>
);
/** Trái cây: nằm ngửa, táo trên bụng đã bị cắn một miếng */
const Apple = () => (
  <OnBack front={[[18, 31, 22, 24, -2]]} back={[[34, 31, 37, 19, -2], [40, 32, 45, 22, 2]]} mouth="tongue">
    <path d="M29 15.5 Q29 12.5 31 10.5" fill="none" {...S} />
    <path d="M30.5 13 Q34 9.5 37 12 Q33.5 15 30.5 13 Z" fill={MINT} {...S} />
    <path d="M29 16.5 C25 13.5 20.5 16.5 21.3 22 C22 27 25.5 30 29 28.8 C32.5 30 36 27 36.7 22 C37.5 16.5 33 13.5 29 16.5 Z" fill={HEART} {...S} />
    <circle cx={37} cy={21} r={2.4} fill={WHITE} /><circle cx={36.4} cy={23.6} r={1.6} fill={WHITE} />
    <ellipse cx={24.5} cy={19.5} rx={1} ry={1.8} fill={WHITE} opacity={0.8} transform="rotate(20 24.5 19.5)" />
  </OnBack>
);
/** Ăn rau: ngồi trong bát salad, đội lá rau */
const Salad = () => (
  <g>
    <Head x={24} y={24} eyes="happy" mouth="tongue" />
    <path d="M27 8 C29 2 37 1 40 5 C36 9 31 10 27 8 Z" fill={LEAF} {...S} />
    <circle cx={10} cy={32} r={4.4} fill={LEAF} {...S} /><circle cx={38} cy={32} r={4.4} fill={LEAF} {...S} />
    <circle cx={14.5} cy={31.5} r={2.4} fill={HEART} stroke={INK} strokeWidth={1.2} /><circle cx={34} cy={30.8} r={2.6} fill="#FFD45C" stroke={INK} strokeWidth={1.2} />
    <path d="M4 33.5 H44 Q43 46.5 24 46.5 Q5 46.5 4 33.5 Z" fill={SKY} {...S} />
    <Paw x={16} y={33.5} /><Paw x={31} y={33.5} />
  </g>
);
/** Uống sữa: ngâm mình trong cốc sữa, ống hút cắm bên cạnh */
const Milk = () => (
  <g>
    <path d="M10 13 H38 L35.5 44 Q35.3 46 33.3 46 H14.7 Q12.7 46 12.5 44 Z" fill="#E6F4FF" />
    <Head x={24} y={25} eyes="happy" mouth="w" />
    <path d="M11 30 Q15 27.5 19 30 Q24 32.5 29 30 Q33 27.5 37 30 L35.4 43.8 Q35.2 45.6 33.4 45.6 H14.6 Q12.8 45.6 12.6 43.8 Z" fill={WHITE} />
    <path d="M11 30 Q15 27.5 19 30 Q24 32.5 29 30 Q33 27.5 37 30" fill="none" stroke="#C9E3F5" strokeWidth={1.4} />
    <path d="M10 13 L12.5 44 Q12.7 46 14.7 46 H33.3 Q35.3 46 35.5 44 L38 13" fill="none" {...S} />
    <Paw x={13} y={30} /><Paw x={35} y={30} />
    <path d="M41 6 L36 16" stroke={PINK} strokeWidth={2.4} strokeLinecap="round" />
  </g>
);
/** Cà phê: nằm gọn trong cốc, đuôi thò ra ngoài */
const Coffee = () => (
  <g>
    <path d="M14 13 q-2 -2 0 -4 q2 -2 0 -4 M34 13 q-2 -2 0 -4 q2 -2 0 -4" fill="none" stroke={FUR_LIGHT} strokeWidth={1.6} strokeLinecap="round" />
    <path d="M37 32 q7 0 7 4.6 q0 4.6 -7 4.6" fill="none" {...S} />
    <Head x={22} y={25} eyes="sleep" mouth="w" />
    <path d="M7 29 H37 V38 Q37 46 29 46 H15 Q7 46 7 38 Z" fill="#C9A88B" {...S} />
    <path d="M8 30.2 H36" stroke="#8B5E3C" strokeWidth={2} strokeLinecap="round" />
    <HeartShape x={22} y={38.5} s={0.7} fill={WHITE} />
    <Paw x={14} y={29.5} /><Paw x={30} y={29.5} />
    <Tail d="M34 30 Q40 30 40 22" />
  </g>
);
/** Đi ngủ sớm: nằm ngửa ngáy trên gối, một chân thò khỏi chăn */
const Bed = () => (
  <g>
    <rect x={2} y={38} width={44} height={6} rx={2.5} fill={SKY} {...S} />
    <path d="M4 46 v-2 M44 46 v-2" {...S} />
    <rect x={1.5} y={28} width={16} height={10} rx={5} fill={WHITE} {...S} />
    <OnBack front={[]} back={[[40, 32, 43, 20, 3]]} eyes="sleep" mouth="oh" dy={-3}
      over={<path d="M17 30 C24 25 36 25 46 30 L46 39 L17 39 Z" fill={PINK} {...S} />} />
    <path d="M22 33 q3 -2 6 0 t6 0 t6 0" fill="none" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" />
    <Zz x={24} y={14} />
  </g>
);
/** Ngủ đủ: ổ bánh mì đeo bịt mắt, trăng khuyết */
const Sleep = () => (
  <g>
    <path d="M38 2 A9 9 0 1 0 47 14 A7 7 0 0 1 38 2 Z" fill={GOLD} {...S} />
    <Loaf x={22} y={24} eyes="sleep" mouth="w" />
    <path d="M9.5 21 Q22 18.5 34.5 21 L34 26.5 Q22 24.5 10 26.5 Z" fill={SHADE} {...S} strokeWidth={1.4} />
    <path d="M14 23.4 q2.4 1.6 4.8 0 M25.2 23.4 q2.4 1.6 4.8 0" fill="none" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
    <Zz x={4} y={10} />
  </g>
);
/** Dọn dẹp: cưỡi chổi bay vèo */
const Broom = () => (
  <g>
    <path d="M30 8 h7 M32 13 h10 M36 4 h6" stroke={SKY} strokeWidth={1.8} strokeLinecap="round" />
    <Tail d="M14 30 Q6 26 3 30" />
    <path d="M5 42 L46 31" stroke={INK} strokeWidth={4.4} strokeLinecap="round" />
    <path d="M5 42 L46 31" stroke="#C9A88B" strokeWidth={2.2} strokeLinecap="round" />
    <path d="M10 38 L2 34 L0.5 46 L9 44 Z" fill={GOLD} {...S} />
    <Loaf x={25} y={18} eyes="wide" mouth="open" tail={false} />
    <Paw x={33} y={33.5} /><Sparkle x={44} y={22} s={0.8} /><Dots x={4} y={12} />
  </g>
);
/** Đánh răng: râu bọt, bong bóng bay */
const Toothbrush = () => (
  <g>
    <Torso x={20} y={25} />
    <Head x={20} y={25} eyes="happy" mouth="w" />
    <g fill="#E6F9FF" stroke={INK} strokeWidth={1}>
      <circle cx={14} cy={33} r={3} /><circle cx={19} cy={35} r={3.2} /><circle cx={25} cy={34.6} r={3} /><circle cx={28.5} cy={31.5} r={2.2} />
      <circle cx={38} cy={8} r={2.6} /><circle cx={43} cy={13} r={1.7} /><circle cx={33} cy={4} r={1.5} />
    </g>
    <rect x={26} y={27} width={18} height={4.6} rx={2.3} fill={SKY} {...S} transform="rotate(-25 35 29)" />
    <rect x={25.5} y={23.5} width={5} height={4.2} rx={1.2} fill={WHITE} {...S} transform="rotate(-25 28 25.6)" />
    <Arm x1={25} y1={36} x2={38} y2={27} bend={4} />
  </g>
);
/** Uống thuốc: viên thuốc to quá, mắt tròn xoe, toát mồ hôi */
const Pill = () => (
  <g>
    <Torso x={20} y={28} />
    <Head x={20} y={28} eyes="wide" mouth="open" />
    <g transform="rotate(-25 34 14)">
      <path d="M34 8.5 H29.5 a5.5 5.5 0 0 0 0 11 H34 Z" fill={PINK} />
      <path d="M34 8.5 H38.5 a5.5 5.5 0 0 1 0 11 H34 Z" fill={WHITE} />
      <rect x={24} y={8.5} width={20} height={11} rx={5.5} fill="none" {...S} />
      <path d="M34 8.5 v11" stroke={INK} strokeWidth={1.4} />
    </g>
    <Arm x1={26} y1={37} x2={37} y2={21} bend={6} />
    <Sweat x={6} y={12} /><Sweat x={9} y={6} s={0.6} />
  </g>
);
/** Tiết kiệm: nằm ngửa trên đống xu, ôm một đồng */
const Coin = () => (
  <g>
    <g fill={GOLD} stroke={INK} strokeWidth={1.4}>
      {[[8, 45], [16, 46], [24, 46.5], [32, 46], [40, 45.5], [12, 42.5], [36, 43], [44, 42]].map(([x, y]) => <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={4.6} ry={2} />)}
    </g>
    <OnBack front={[[19, 31, 21, 23, -3]]} mouth="tongue" dy={-3}>
      <circle cx={26} cy={18} r={6.6} fill={GOLD} {...S} />
      <circle cx={26} cy={18} r={4.4} fill="none" stroke="#E0A72E" strokeWidth={1.3} />
    </OnBack>
    <Sparkle x={40} y={8} /><Sparkle x={8} y={8} s={0.7} /><Dots x={44} y={16} />
  </g>
);
/** Vẽ: lấy đuôi làm cọ, vẽ cầu vồng; mặt dính sơn */
const Palette = () => (
  <g>
    <path d="M26 20 A14 14 0 0 1 46 12" fill="none" stroke={HEART} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M28 22.5 A12 12 0 0 1 45.5 16" fill="none" stroke={GOLD} strokeWidth={2.4} strokeLinecap="round" />
    <path d="M30 25 A10 10 0 0 1 45 20" fill="none" stroke={SKY} strokeWidth={2.4} strokeLinecap="round" />
    <Tail d="M26 42 Q40 44 42 32 Q43 26 40 22" />
    <circle cx={40} cy={22} r={2.4} fill={PINK} stroke={INK} strokeWidth={1.2} />
    <Torso x={17} y={27} />
    <Head x={17} y={27} eyes="open" mouth="w" tilt={8} />
    <circle cx={10} cy={22} r={1.6} fill={SKY} stroke={INK} strokeWidth={0.8} /><circle cx={22} cy={17} r={1.3} fill={GOLD} stroke={INK} strokeWidth={0.8} />
    <path d="M3 44 q3 -3 6 -0.6 q3 2.6 6 0" fill={PINK} stroke={INK} strokeWidth={1} />
  </g>
);
/** Âm nhạc: ngửa cổ hát hết mình với micro */
const Music = () => (
  <g>
    <Torso x={20} y={28} />
    <Head x={20} y={28} eyes="sleep" mouth="yawn" tilt={-12} />
    <rect x={30} y={30} width={3.4} height={13} rx={1.6} fill={INK} transform="rotate(25 31.7 36.5)" />
    <circle cx={30} cy={29} r={3.8} fill={SHADE} {...S} />
    <Arm x1={25} y1={37} x2={32.5} y2={36.5} bend={2} />
    <Note x={38} y={12} /><Note x={44} y={22} s={0.8} /><Note x={34} y={4} s={0.7} />
  </g>
);
/** Chăm cây: mèo trồng trong chậu, mầm mọc trên đầu */
const Plant = () => (
  <g>
    <path d="M24 12 V4" {...S} />
    <path d="M24 7 C19 7 15.5 4 15.5 -0.5 C20 -0.5 24 2.5 24 7 Z" fill={LEAF} {...S} />
    <path d="M24 9 C24 4.5 27.5 0.5 33 0.5 C33 5 29.5 9 24 9 Z" fill={MINT} {...S} />
    <Head x={24} y={25} eyes="happy" mouth="tongue" />
    <path d="M10 33 H38 L35 46.5 H13 Z" fill="#F2A88A" {...S} />
    <rect x={8} y={30} width={32} height={5} rx={2} fill="#E38E6E" {...S} />
    <Paw x={15} y={30.5} /><Paw x={33} y={30.5} />
    <Sparkle x={41} y={10} s={0.8} />
  </g>
);
/** Biết ơn: chắp tay, vầng hào quang */
const Pray = () => (
  <g>
    <ellipse cx={24} cy={4.6} rx={9} ry={2.6} fill="none" stroke={INK} strokeWidth={4} />
    <ellipse cx={24} cy={4.6} rx={9} ry={2.6} fill="none" stroke={GOLD} strokeWidth={2} />
    <Torso x={24} y={24} />
    <Head x={24} y={24} eyes="sleep" />
    <ellipse cx={21.6} cy={39.5} rx={2.8} ry={4.4} fill={WHITE} {...S} strokeWidth={1.5} transform="rotate(-16 21.6 39.5)" />
    <ellipse cx={26.4} cy={39.5} rx={2.8} ry={4.4} fill={WHITE} {...S} strokeWidth={1.5} transform="rotate(16 26.4 39.5)" />
    <Sparkle x={6} y={12} /><Sparkle x={42} y={14} s={0.8} /><HeartShape x={41} y={34} s={0.6} /><Dots x={5} y={30} />
  </g>
);
/** Bỏ điện thoại: ngồi đè lên điện thoại, mặt tỉnh bơ */
const NoPhone = () => (
  <g>
    <rect x={5} y={38} width={38} height={8} rx={2.6} fill={SHADE} {...S} />
    <rect x={8} y={40} width={30} height={4} rx={1} fill="#FFFDF8" />
    <Loaf x={24} y={20} eyes="happy" mouth="w" tilt={-6} />
    <circle cx={42} cy={37} r={3.8} fill={HEART} {...S} strokeWidth={1.4} />
    <path d="M42 35 v2.2 M42 39 v0.1" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" />
  </g>
);
/** Dưỡng da: khăn quấn đầu, dưa leo đắp mắt */
const Lotion = () => (
  <g>
    <Torso x={18} y={28} />
    <Head x={18} y={28} eyes="sleep" mouth="w" />
    <path d="M5.5 24 Q4 9 18 9.5 Q32 9 30.5 24 Q18 20 5.5 24 Z" fill={PINK} {...S} />
    <path d="M9 20 Q18 16.5 27 20" fill="none" stroke={WHITE} strokeWidth={1.4} strokeLinecap="round" />
    <ellipse cx={18} cy={8} rx={4.4} ry={3.4} fill={PINK} {...S} />
    {[13, 23].map((x) => <g key={x}><circle cx={x} cy={27.6} r={3.2} fill={LEAF} stroke={INK} strokeWidth={1.1} /><circle cx={x} cy={27.6} r={1.8} fill="#E4F5C8" /></g>)}
    <rect x={35} y={24} width={4} height={4} fill={WHITE} {...S} strokeWidth={1.4} />
    <rect x={32} y={28} width={10} height={16} rx={3.4} fill={MINT} {...S} />
    <HeartShape x={37} y={36} s={0.45} fill={WHITE} />
    <Sparkle x={43} y={16} s={0.8} /><Dots x={2} y={36} />
  </g>
);
/** Dậy sớm: vươn vai chổng mông, ngáp to */
const Sun = () => (
  <g>
    {Array.from({ length: 8 }, (_, i) => i * 45).map((a) => (
      <ellipse key={a} cx={11} cy={1.6} rx={1.5} ry={2.3} fill={GOLD} stroke={INK} strokeWidth={1} transform={`rotate(${a} 11 10)`} />
    ))}
    <circle cx={11} cy={10} r={5.6} fill="#FFE08A" {...S} />
    <Tail d="M40 24 Q46 14 42 5" />
    {limbs([[35, 30, 35, 44], [39, 28, 41, 43]])}
    <ellipse cx={30} cy={30} rx={12} ry={7} fill={FUR} {...S} transform="rotate(-24 30 30)" />
    <path d="M28 22.5 l1 3 M33 20.5 l1 3 M37.4 19.4 l0.8 3" stroke={STRIPE} strokeWidth={1.8} strokeLinecap="round" />
    {limbs([[22, 37, 6, 44, 2], [24, 38, 10, 45.5, 2]])}
    <Head x={17} y={34} tilt={-10} s={0.92} eyes="sleep" mouth="yawn" />
  </g>
);
/** Yêu thương: đúng dáng ảnh mẫu, nằm ngửa giơ tay thành hình tim */
const Love = () => (
  <OnBack front={[[16, 31, 20.8, 13.5, -8], [27, 29, 23.4, 13.5, 6]]} back={[[37, 31, 39, 21, -2], [42, 33, 46, 24, 2]]} eyes="sleep"
    over={<><HeartShape x={22} y={6} s={0.95} /><Sparkle x={33} y={5} s={0.8} /><Sparkle x={8} y={20} s={0.9} /><Dots x={30} y={14} /><Dots x={4} y={12} /></>} />
);

/** emoji (giá trị đang lưu) → icon mèo + tên gợi ý */
export const CAT_HABIT_ICONS: Record<string, { name: string; Art: FC }> = {
  '💧': { name: 'Uống nước', Art: Water },
  '🧘': { name: 'Thiền / yoga', Art: Yoga },
  '🏃': { name: 'Chạy bộ', Art: Run },
  '🚶': { name: 'Đi bộ', Art: Walk },
  '📚': { name: 'Đọc sách', Art: Books },
  '✍️': { name: 'Viết', Art: Pencil },
  '🍎': { name: 'Trái cây', Art: Apple },
  '🥗': { name: 'Ăn rau', Art: Salad },
  '🥛': { name: 'Uống sữa', Art: Milk },
  '☕': { name: 'Cà phê', Art: Coffee },
  '🛏️': { name: 'Đi ngủ sớm', Art: Bed },
  '😴': { name: 'Ngủ đủ', Art: Sleep },
  '🧹': { name: 'Dọn dẹp', Art: Broom },
  '🪥': { name: 'Đánh răng', Art: Toothbrush },
  '💊': { name: 'Uống thuốc', Art: Pill },
  '💰': { name: 'Tiết kiệm', Art: Coin },
  '🎨': { name: 'Vẽ', Art: Palette },
  '🎵': { name: 'Âm nhạc', Art: Music },
  '🌿': { name: 'Chăm cây', Art: Plant },
  '🙏': { name: 'Biết ơn', Art: Pray },
  '📵': { name: 'Bỏ điện thoại', Art: NoPhone },
  '🧴': { name: 'Dưỡng da', Art: Lotion },
  '🌞': { name: 'Dậy sớm', Art: Sun },
  '❤️': { name: 'Yêu thương', Art: Love },
};

function Icon({ emoji, size }: { emoji: string; size: number }) {
  const { Art } = CAT_HABIT_ICONS[emoji];
  return <svg viewBox="0 0 48 48" width={size} height={size} style={{ display: 'block', overflow: 'visible' }}><Art /></svg>;
}

const COLORS = Object.values(HABIT_COLORS);
const chip = (on: boolean, color: string, children: ReactNode) => (
  <span style={{ width: 48, height: 48, borderRadius: '50%', display: 'grid', placeItems: 'center', background: on ? color : '#fff', border: on ? '2px solid #5B4636' : '2px dashed #9C8574', boxShadow: on ? '0 3px 0 #5B4636' : undefined }}>{children}</span>
);

export function HabitCatSketches({ only }: { only?: string[] }) {
  if (only) return <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 1000 }}>{only.map((e) => <div key={e} style={{ background: '#fff', borderRadius: 12 }}><Icon emoji={e} size={240} /></div>)}</div>;
  return (
    <div style={{ font: '13px sans-serif', color: '#5B4636', width: 960 }}>
      <Row title="24 icon mèo mướp (cỡ to để soát nét) · emoji cũ bên cạnh">
        {HABIT_ICONS.map((e) => (
          <figure key={e} style={{ margin: 0, width: 112, background: '#fff', borderRadius: 12, padding: 6, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
              <Icon emoji={e} size={76} />
              <span style={{ fontSize: 20, opacity: 0.6 }}>{e}</span>
            </div>
            <figcaption style={{ fontWeight: 700 }}>{CAT_HABIT_ICONS[e].name}</figcaption>
          </figure>
        ))}
      </Row>
      <Row title="Trong chip Hôm nay (48px, icon 34px): chưa tick | đã tick">
        {HABIT_ICONS.map((e, i) => (
          <div key={e} style={{ display: 'flex', gap: 4, background: '#fff', borderRadius: 30, padding: 4 }}>
            {chip(false, '', <Icon emoji={e} size={34} />)}
            {chip(true, COLORS[i % COLORS.length], <Icon emoji={e} size={34} />)}
          </div>
        ))}
      </Row>
      <Row title="Ô chọn của form (lưới 8 cột) và cỡ nhỏ ở bảng báo cáo (20px)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 40px)', gap: 6, background: '#fff', padding: 8, borderRadius: 12 }}>
          {HABIT_ICONS.map((e, i) => (
            <span key={e} style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: i === 0 ? '#FFF1C1' : '#fff', border: i === 0 ? '2px solid #5B4636' : '2px solid transparent' }}><Icon emoji={e} size={34} /></span>
          ))}
        </div>
        <div style={{ background: '#fff', padding: 8, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {HABIT_ICONS.slice(0, 8).map((e) => (
            <span key={e} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}><Icon emoji={e} size={20} />{CAT_HABIT_ICONS[e].name}</span>
          ))}
        </div>
      </Row>
    </div>
  );
}
