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

/** Ngày tiết kiệm năng lượng: mặt trăng ngủ zzz */
export function MoonIcon({ size }: { size?: number }) {
  return (
    <Svg name="moon" size={size}>
      <path d="M19 27 A11 11 0 1 1 15 6 A8.5 8.5 0 0 0 19 27 Z" fill="#E3D9FF" {...STROKE} />
      <path d="M8.5 16.5 q1.3 1.2 2.6 0 M13.2 18.5 q1.3 1.2 2.6 0" fill="none" {...STROKE} strokeWidth={1.6} />
      <ellipse cx={9.2} cy={20} rx={1.4} ry={0.9} fill="#FF9FB2" />
      <path d="M21 6 h4 l-4 4 h4" fill="none" {...STROKE} strokeWidth={1.7} />
      <path d="M25.5 12.5 h3 l-3 3 h3" fill="none" {...STROKE} strokeWidth={1.5} />
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
