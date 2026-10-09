import { useId, type ReactNode } from 'react';
import type { FaceStyle, Mood } from '../../Face';
import type { FaceAnchor } from '../../types';

/**
 * Bộ vẽ Đất sét 3D cho các dáng mở khoá (dáng 3, mở ở 20 ngày): khối tròn mũm mĩm tô gradient hình cầu
 * (sáng trên-trái → tối mép), đốm bóng trắng, bóng đổ mềm, viền mảnh sẫm màu thay cho viền nâu cứng.
 * Chỉ dùng phần tử + bộ lọc SVG (Safari bỏ qua filter CSS đặt trên phần tử bên trong SVG).
 */

/** Trộn hai màu hex theo tỉ lệ t (0 = a, 1 = b). */
export function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

export interface Clay {
  /** gradient đất sét cho màu `c` (phải có trong danh sách màu truyền vào `useClay`) */
  fill: (c: string) => string;
  /** viền mảnh sẫm màu */
  edge: (c: string) => string;
  /** bộ lọc bóng đổ mềm */
  shadow: string;
  defs: ReactNode;
}

/** Tạo gradient cho từng màu + bộ lọc bóng, id riêng mỗi cảnh (`useId`). */
export function useClay(colors: string[]): Clay {
  const base = `clay-${useId().replace(/[^\w-]/g, '')}`;
  const gid = (c: string) => `${base}-${c.slice(1)}`;
  return {
    fill: (c) => `url(#${gid(c)})`,
    edge: (c) => mix(c, '#2B1D16', 0.45),
    shadow: `url(#${base}-sh)`,
    defs: (
      <defs>
        {colors.map((c) => (
          <radialGradient key={c} id={gid(c)} cx="0.36" cy="0.3" r="0.82">
            <stop offset="0" stopColor={mix(c, '#FFFFFF', 0.45)} />
            <stop offset="0.5" stopColor={c} />
            <stop offset="1" stopColor={mix(c, '#2B1D16', 0.28)} />
          </radialGradient>
        ))}
        <filter id={`${base}-sh`} x="-30%" y="-30%" width="160%" height="170%" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="2.6" stdDeviation="1.8" floodColor="#5B4636" floodOpacity="0.32" />
        </filter>
      </defs>
    ),
  };
}

/** Đốm bóng trắng trên khối đất sét. */
export function Gloss({ cx, cy, rx, ry, rot = -30 }: { cx: number; cy: number; rx: number; ry: number; rot?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#FFFFFF" opacity={0.55} transform={`rotate(${rot} ${cx} ${cy})`} />;
}

const DARK = '#2B1D16';

/** Mặt đất sét: mắt hạt cườm bóng, má hồng loang, miệng khối tròn; cùng hệ toạ độ và `scale` như mặt sticker. */
export function ClayFace({ mood, x, y, scale, faceStyle = 'cute' }: { mood: Mood; faceStyle?: FaceStyle } & FaceAnchor) {
  const id = `clayface-${useId().replace(/[^\w-]/g, '')}`;
  const awake = mood !== 'sleep' && mood !== 'sad';
  const cool = faceStyle === 'cool' && awake;
  const lady = faceStyle === 'lady' && awake;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-testid="face" data-mood={mood} data-style={faceStyle} data-render="clay">
      <defs>
        <radialGradient id={`${id}-blush`}>
          <stop offset="0" stopColor="#FF7F9E" stopOpacity={0.85} />
          <stop offset="1" stopColor="#FF7F9E" stopOpacity={0} />
        </radialGradient>
      </defs>
      {faceStyle !== 'cool' && (
        <>
          <ellipse cx={-14} cy={6} rx={7} ry={4.5} fill={`url(#${id}-blush)`} />
          <ellipse cx={14} cy={6} rx={7} ry={4.5} fill={`url(#${id}-blush)`} />
        </>
      )}
      {cool ? (
        <g>
          <path d="M-19 -7 H19" stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${s * 2} -7 H${s * 17} Q${s * 17} 4 ${s * 10} 4 Q${s * 3} 4 ${s * 2} -7 Z`} fill="#1E1E1E" />
              <ellipse cx={s * 12} cy={-3.5} rx={2.6} ry={1.4} fill="#FFFFFF" opacity={0.7} />
            </g>
          ))}
        </g>
      ) : (
        <Eyes mood={mood} />
      )}
      {lady && (
        <path d={`M-11 ${mood === 'smile' ? -3 : -5} q-3 -1 -5 -4 M11 ${mood === 'smile' ? -3 : -5} q3 -1 5 -4`} stroke={DARK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
      )}
      <Mouth mood={mood} cool={cool} lady={lady} />
    </g>
  );
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'smile' || mood === 'sleep') {
    const d = mood === 'smile' ? 'q3.5 -6 7 0' : 'q3.5 4 7 0';
    return (
      <g stroke={DARK} strokeWidth={3.2} strokeLinecap="round" fill="none">
        <path d={`M-13 -1 ${d}`} />
        <path d={`M6 -1 ${d}`} />
      </g>
    );
  }
  return (
    <g>
      {[-9.5, 9.5].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy={-2} rx={3.6} ry={4.4} fill={DARK} />
          <circle cx={cx + 1.3} cy={-3.6} r={1.4} fill="#FFFFFF" />
          <circle cx={cx - 1.2} cy={0} r={0.6} fill="#FFFFFF" opacity={0.8} />
        </g>
      ))}
    </g>
  );
}

function Mouth({ mood, cool, lady }: { mood: Mood; cool: boolean; lady: boolean }) {
  const lip = lady ? '#E0475F' : DARK;
  if (cool) {
    return mood === 'smile'
      ? <path d="M-5 7 Q2 13 8 5 Z" fill="#FFFFFF" stroke={DARK} strokeWidth={2} strokeLinejoin="round" />
      : <path d="M-4 9 Q2 10 7 6" fill="none" stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />;
  }
  switch (mood) {
    case 'smile':
      return (
        <g>
          <path d="M-6 5 Q0 14 6 5 Z" fill={lady ? '#E0475F' : '#5A2A22'} stroke={lip} strokeWidth={1.4} strokeLinejoin="round" />
          {!lady && <ellipse cx={0} cy={9.2} rx={2.8} ry={1.6} fill="#FF8FA8" />}
        </g>
      );
    case 'talk':
      return (
        <g>
          <ellipse cx={0} cy={7} rx={3.6} ry={4.2} fill="#5A2A22" />
          <ellipse cx={0} cy={9} rx={2.2} ry={1.4} fill="#FF8FA8" />
        </g>
      );
    case 'sleep':
      return <ellipse cx={0} cy={7} rx={1.8} ry={2} fill="#5A2A22" />;
    case 'sad':
      return <path d="M-4 9 Q0 5 4 9" fill="none" stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />;
    default:
      return lady
        ? <path d="M-3.5 6 q1.75 -2 3.5 -0.5 q1.75 -1.5 3.5 0.5 q-1.75 3.2 -3.5 3.2 q-1.75 0 -3.5 -3.2 z" fill="#E0475F" />
        : <path d="M-4 6 Q0 10 4 6" fill="none" stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />;
  }
}
