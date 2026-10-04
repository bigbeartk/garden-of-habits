import type { ReactNode } from 'react';

/**
 * Bộ icon SVG tự vẽ, phong cách sticker chibi (viền cocoa, màu pastel, nét bo tròn).
 * Dùng thay emoji để icon giống hệt nhau trên iPhone, Android và Windows.
 * Mọi icon dùng khung 32×32; `data-icon` để test nhận diện.
 */
const INK = '#5B4636';
const STROKE = { stroke: INK, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Svg({ name, size = 28, children }: { name: string; size?: number; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      data-icon={name}
      className="icon"
    >
      {children}
    </svg>
  );
}

/** Má hồng nhỏ cho icon có mặt */
function Blush({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <>
      <ellipse cx={x1} cy={y} rx={1.6} ry={1} fill="#FF9FB2" />
      <ellipse cx={x2} cy={y} rx={1.6} ry={1} fill="#FF9FB2" />
    </>
  );
}

/** Dấu cộng: thêm việc vào một buổi */
export function PlusIcon({ size }: { size?: number }) {
  return (
    <Svg name="plus" size={size}>
      <path d="M16 9 V23 M9 16 H23" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

/** Khu vườn: cây tròn + bông hoa trên mô cỏ */
export function GardenIcon({ size }: { size?: number }) {
  return (
    <Svg name="garden" size={size}>
      <path d="M3 26 Q16 19 29 26 L29 28 L3 28 Z" fill="#9ED89A" {...STROKE} />
      <path d="M11 23 V14" {...STROKE} />
      <circle cx={11} cy={10} r={6} fill="#7CC985" {...STROKE} />
      <path d="M22 23 V17" {...STROKE} />
      <circle cx={22} cy={14} r={2.2} fill="#FFE27A" {...STROKE} />
      <circle cx={22} cy={10.3} r={1.9} fill="#FF9FB2" stroke={INK} strokeWidth={1.5} />
      <circle cx={25.6} cy={14} r={1.9} fill="#FF9FB2" stroke={INK} strokeWidth={1.5} />
      <circle cx={18.4} cy={14} r={1.9} fill="#FF9FB2" stroke={INK} strokeWidth={1.5} />
      <circle cx={22} cy={14} r={2.2} fill="#FFE27A" {...STROKE} />
    </Svg>
  );
}

export function CalendarIcon({ size }: { size?: number }) {
  return (
    <Svg name="calendar" size={size}>
      <rect x={5} y={7} width={22} height={20} rx={5} fill="#FFFDFB" {...STROKE} />
      <path d="M5 13 V12 a5 5 0 0 1 5 -5 h12 a5 5 0 0 1 5 5 v1 Z" fill="#F7A8B8" {...STROKE} />
      <path d="M11 4.5 v5 M21 4.5 v5" {...STROKE} />
      <path d="M16 23.5 c-3.5 -2.2 -4.6 -4.3 -3.2 -5.6 c1.2 -1.1 2.6 -0.3 3.2 0.7 c0.6 -1 2 -1.8 3.2 -0.7 c1.4 1.3 0.3 3.4 -3.2 5.6 Z" fill="#F27A93" stroke="none" />
    </Svg>
  );
}

export function SproutIcon({ size }: { size?: number }) {
  return (
    <Svg name="sprout" size={size}>
      <path d="M16 28 V16" {...STROKE} />
      <path d="M16 17 C 9 17 5 13 5 7 C 11 7 16 10 16 17 Z" fill="#A8E0A0" {...STROKE} />
      <path d="M16 15 C 17 9 21 5 27 5 C 27 11 23 15 16 15 Z" fill="#CDEFE3" {...STROKE} />
      <path d="M10 27.5 h12" {...STROKE} />
    </Svg>
  );
}

export function ClipboardIcon({ size }: { size?: number }) {
  return (
    <Svg name="clipboard" size={size}>
      <rect x={6} y={6} width={20} height={23} rx={4} fill="#FFF1C1" {...STROKE} />
      <rect x={11} y={3.5} width={10} height={5.5} rx={2.5} fill="#E3D9FF" {...STROKE} />
      <path d="M11 15 l1.6 1.6 l3 -3.2" {...STROKE} fill="none" />
      <path d="M18 15 h4 M11 22 l1.6 1.6 l3 -3.2 M18 22 h4" {...STROKE} fill="none" />
    </Svg>
  );
}

export function GearIcon({ size }: { size?: number }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <Svg name="gear" size={size}>
      {petals.map((a) => (
        <circle key={a} cx={16} cy={6.5} r={3.4} fill="#E3D9FF" {...STROKE} transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx={16} cy={16} r={8.5} fill="#E3D9FF" stroke="none" />
      <circle cx={16} cy={16} r={4.2} fill="#FFFDFB" {...STROKE} />
    </Svg>
  );
}

/** Nút mở menu: bông hoa 4 cánh */
export function MenuIcon({ size }: { size?: number }) {
  return (
    <Svg name="menu" size={size}>
      {[0, 90, 180, 270].map((a) => (
        <ellipse key={a} cx={16} cy={8.5} rx={5} ry={6} fill="#FFD6DE" {...STROKE} transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx={16} cy={16} r={4.5} fill="#FFE58A" {...STROKE} />
    </Svg>
  );
}

export function CloseIcon({ size }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size ?? 28} height={size ?? 28} aria-hidden="true" focusable="false" data-icon="close" data-testid="icon-close" className="icon">
      <path d="M10 10 L22 22 M22 10 L10 22" stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
    </svg>
  );
}

/** Đổi cây: mầm cây trong vòng mũi tên xoay */
export function PlantSwapIcon({ size }: { size?: number }) {
  return (
    <Svg name="plant-swap" size={size}>
      <path d="M26 13 A10.5 10.5 0 0 0 7.5 9" fill="none" {...STROKE} />
      <path d="M6 23 A10.5 10.5 0 0 0 24.5 23" fill="none" {...STROKE} />
      <path d="M7.5 4.5 V9.5 H12.5" fill="none" {...STROKE} />
      <path d="M24.5 27.5 V22.5 H19.5" fill="none" {...STROKE} />
      <path d="M16 22 V16" {...STROKE} />
      <path d="M16 17 C 12 17 10.5 14.5 10.5 12 C 14 12 16 14 16 17 Z" fill="#A8E0A0" {...STROKE} />
      <path d="M16 16 C 16.5 13 18.5 11 21.5 11 C 21.5 14 19.5 16 16 16 Z" fill="#CDEFE3" {...STROKE} />
    </Svg>
  );
}

/** Đổi chậu: chậu đất nung có mầm nhỏ */
export function PotIcon({ size }: { size?: number }) {
  return (
    <Svg name="pot" size={size}>
      <path d="M16 13 V7" {...STROKE} />
      <path d="M16 9 C 13 9 11.5 7 11.5 5 C 14.5 5 16 6.5 16 9 Z" fill="#A8E0A0" {...STROKE} />
      <path d="M16 8 C 16.5 5.5 18 4 20.5 4 C 20.5 6.5 19 8 16 8 Z" fill="#CDEFE3" {...STROKE} />
      <path d="M8 17 L10 27.5 Q16 29 22 27.5 L24 17 Z" fill="#F2A88A" {...STROKE} />
      <rect x={6} y={13} width={20} height={5} rx={2.5} fill="#E38E6E" {...STROKE} />
      <circle cx={13.5} cy={22} r={0.9} fill={INK} />
      <circle cx={18.5} cy={22} r={0.9} fill={INK} />
      <Blush x1={11.8} x2={20.2} y={23.6} />
    </Svg>
  );
}

/** Ghi chú: sổ nhỏ có bút chì */
export function NoteIcon({ size }: { size?: number }) {
  return (
    <Svg name="note" size={size}>
      <rect x={5} y={5} width={17} height={22} rx={3.5} fill="#D4ECFF" {...STROKE} />
      <path d="M9.5 11 h8 M9.5 15.5 h8 M9.5 20 h4.5" {...STROKE} />
      <path d="M19.5 25.5 L27 13 l-2.6 -1.6 L17 24 l-0.6 3.4 Z" fill="#FFE58A" {...STROKE} />
      <path d="M24.4 11.4 l1.1 -1.8 a1.5 1.5 0 0 1 2.6 1.6 l-1.1 1.8 Z" fill="#FFB8C8" {...STROKE} />
    </Svg>
  );
}

/** Ngày tiết kiệm năng lượng: hạt giống đội mũ ngủ, mắt nhắm, chữ Z to */
export function SleepSeedIcon({ size }: { size?: number }) {
  return (
    <Svg name="sleep-seed" size={size}>
      <ellipse cx={14} cy={20} rx={9.5} ry={8.5} fill="#D9A877" {...STROKE} strokeWidth={2.2} />
      <path d="M5.2 17.6 Q 6 8.5 15 9.2 Q 20.5 9.8 22.8 15.6 Q 14 13.2 5.2 17.6 Z" fill="#B9A7F0" {...STROKE} strokeWidth={2.2} />
      <path d="M22.8 15.6 Q 25.5 17.4 26.2 21" fill="none" {...STROKE} strokeWidth={2.2} />
      <circle cx={26.4} cy={22.6} r={2.3} fill="#FFE58A" {...STROKE} strokeWidth={1.8} />
      <path d="M9 21 q1.7 1.6 3.4 0 M15.6 21 q1.7 1.6 3.4 0" fill="none" {...STROKE} strokeWidth={2} />
      <ellipse cx={8.6} cy={24} rx={1.8} ry={1.1} fill="#FF9FB2" />
      <ellipse cx={19.4} cy={24} rx={1.8} ry={1.1} fill="#FF9FB2" />
      <path d="M22 3.5 h6 l-6 6.5 h6" fill="none" {...STROKE} strokeWidth={2.4} />
    </Svg>
  );
}

/** Thức dậy: mặt trời cười */
export function SunIcon({ size }: { size?: number }) {
  return (
    <Svg name="sun" size={size}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M16 2.5 V6" {...STROKE} transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx={16} cy={16} r={8} fill="#FFE58A" {...STROKE} />
      <path d="M12.5 15 q1.2 -1.4 2.4 0 M17.1 15 q1.2 -1.4 2.4 0" fill="none" {...STROKE} strokeWidth={1.6} />
      <path d="M14 18.5 q2 1.8 4 0" fill="none" {...STROKE} strokeWidth={1.6} />
      <Blush x1={11.8} x2={20.2} y={18.2} />
    </Svg>
  );
}

/** Quay lại: mũi tên bo tròn, nét đậm */
export function BackIcon({ size }: { size?: number }) {
  return (
    <Svg name="back" size={size}>
      <path d="M19 7 L10 16 L19 25" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Buổi sáng: mặt trời cười, má hồng */
export function MorningIcon({ size }: { size?: number }) {
  return (
    <Svg name="period-morning" size={size}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <path key={a} d="M16 2.8 V6.4" stroke="#F5A623" strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx={16} cy={16} r={8.2} fill="#FFE58A" {...STROKE} />
      <circle cx={13} cy={15} r={1.1} fill={INK} />
      <circle cx={19} cy={15} r={1.1} fill={INK} />
      <path d="M14 18.4 q2 1.8 4 0" fill="none" {...STROKE} strokeWidth={1.6} />
      <Blush x1={11.4} x2={20.6} y={18} />
    </Svg>
  );
}

/** Buổi chiều: mặt trời nấp sau đám mây */
export function AfternoonIcon({ size }: { size?: number }) {
  return (
    <Svg name="period-afternoon" size={size}>
      {[-90, -45, 0, 45].map((a) => (
        <path key={a} d="M20 3.2 V6.2" stroke="#F5A623" strokeWidth={2.4} strokeLinecap="round" transform={`rotate(${a} 20 12)`} />
      ))}
      <circle cx={20} cy={12} r={6.2} fill="#FFD27A" {...STROKE} />
      <path d="M6.5 26 a4.5 4.5 0 0 1 0.8 -8.9 a6 6 0 0 1 11.2 -1.6 a4.8 4.8 0 0 1 6.9 4.3 a3.6 3.6 0 0 1 -0.9 6.2 Z" fill="#FFFDFB" {...STROKE} />
      <circle cx={12.6} cy={21.4} r={1} fill={INK} />
      <circle cx={17.4} cy={21.4} r={1} fill={INK} />
      <path d="M13.8 23.6 q1.2 1.1 2.4 0" fill="none" {...STROKE} strokeWidth={1.4} />
      <ellipse cx={10.6} cy={23.6} rx={1.3} ry={0.8} fill="#FF9FB2" />
      <ellipse cx={19.4} cy={23.6} rx={1.3} ry={0.8} fill="#FF9FB2" />
    </Svg>
  );
}

/** Buổi tối: trăng khuyết to, ngủ, kèm sao nhỏ */
export function EveningIcon({ size }: { size?: number }) {
  return (
    <Svg name="period-evening" size={size}>
      <path d="M22 2.5 A13.5 13.5 0 1 0 22 29.5 A30 30 0 0 1 22 2.5 Z" fill="#FFD86B" {...STROKE} />
      <path d="M10.2 15.4 q1.3 1.2 2.6 0 M15 15.8 q1.3 1.2 2.6 0" fill="none" {...STROKE} strokeWidth={1.6} />
      <ellipse cx={11.2} cy={19.4} rx={1.5} ry={1} fill="#FF9FB2" />
      <ellipse cx={17.4} cy={19.6} rx={1.3} ry={0.9} fill="#FF9FB2" />
      <path d="M27 4.5 l0.8 1.7 l1.8 0.3 l-1.3 1.3 l0.3 1.8 l-1.6 -0.9 l-1.6 0.9 l0.3 -1.8 l-1.3 -1.3 l1.8 -0.3 Z" fill="#C9B8F0" stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <circle cx={28.6} cy={14} r={1.2} fill="#C9B8F0" />
    </Svg>
  );
}

const PERIOD_ICONS = { morning: MorningIcon, afternoon: AfternoonIcon, evening: EveningIcon } as const;

/** Icon buổi Sáng / Chiều / Tối (SVG tự vẽ, giống nhau trên mọi máy). */
export function PeriodIcon({ period, size = 26 }: { period: 'morning' | 'afternoon' | 'evening'; size?: number }) {
  const Icon = PERIOD_ICONS[period];
  return <Icon size={size} />;
}

/** Ngôi sao mặc định: tô vàng khi bật, viền nét khi tắt */
export function StarIcon({ size, filled }: { size?: number; filled?: boolean }) {
  return (
    <Svg name="star" size={size}>
      <path
        d="M16 4.2 l3.4 7 l7.6 1.1 l-5.5 5.3 l1.3 7.6 l-6.8 -3.6 l-6.8 3.6 l1.3 -7.6 l-5.5 -5.3 l7.6 -1.1 Z"
        fill={filled ? '#FFD86B' : '#FFFDFB'}
        {...STROKE}
      />
      {filled && <circle cx={13} cy={13} r={1.4} fill="#FFFDFB" opacity={0.8} />}
    </Svg>
  );
}

/** Lời cây nói: bong bóng thoại có ba chấm; `off` gạch chéo khi đang ẩn */
export function SpeechIcon({ size, off }: { size?: number; off?: boolean }) {
  return (
    <Svg name="speech" size={size}>
      <path d="M6 7 h20 a3 3 0 0 1 3 3 v10 a3 3 0 0 1 -3 3 h-11 l-5 4.5 v-4.5 h-4 a3 3 0 0 1 -3 -3 v-10 a3 3 0 0 1 3 -3 Z" fill="#FFFDFB" {...STROKE} />
      <circle cx={11} cy={15} r={1.6} fill={INK} />
      <circle cx={16} cy={15} r={1.6} fill={INK} />
      <circle cx={21} cy={15} r={1.6} fill={INK} />
      {off && <path d="M5 5 L27 27" stroke="#E86A7E" strokeWidth={2.6} strokeLinecap="round" />}
    </Svg>
  );
}

/** Tuỳ chọn hiển thị: ba thanh trượt có núm màu */
export function OptionsIcon({ size }: { size?: number }) {
  return (
    <Svg name="options" size={size}>
      <path d="M6 9 h20 M6 16 h20 M6 23 h20" {...STROKE} />
      <circle cx={12} cy={9} r={3.2} fill="#FFD6DE" {...STROKE} />
      <circle cx={20} cy={16} r={3.2} fill="#CDEFE3" {...STROKE} />
      <circle cx={14} cy={23} r={3.2} fill="#FFF1C1" {...STROKE} />
    </Svg>
  );
}
