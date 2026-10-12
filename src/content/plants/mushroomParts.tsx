import type { ReactNode } from 'react';
import { INK } from '../Face';

/*
 * Phần vẽ dùng chung cho 2 loài nấm (Nấm mặt trời, Nấm băng), chép từ src/dev/sketch/mushrooms.tsx.
 * Nấm mang mặt trên THÂN (không trên mũ); chân thân ở y = 160.
 */

/** thân nấm mập, nở nhẹ ở gốc; `hw` nửa bề ngang ở đỉnh, `top` đỉnh thân */
export function MushroomStem({ x = 100, hw, top, fill, shade }: { x?: number; hw: number; top: number; fill: string; shade: string }) {
  const hb = hw * 1.18, mid = (160 + top) / 2;
  return (
    <g>
      <path d={`M${x - hb} 160 Q${x - hw - 4} ${mid} ${x - hw} ${top} L${x + hw} ${top} Q${x + hw + 4} ${mid} ${x + hb} 160 Z`} fill={fill} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
      <path d={`M${x + hw * 0.55} ${top + 6} Q${x + hw * 0.8} ${mid} ${x + hb * 0.7} 157`} fill="none" stroke={shade} strokeWidth={hw * 0.25} strokeLinecap="round" />
    </g>
  );
}

/** viền mũ vòm: vành ở y, rộng 2·rw, cao h; mặt dưới cong nhẹ */
export function capPath(x: number, y: number, rw: number, h: number) {
  return `M${x - rw} ${y} C${x - rw} ${y - h * 1.33} ${x + rw} ${y - h * 1.33} ${x + rw} ${y} Q${x} ${y + h * 0.22} ${x - rw} ${y} Z`;
}

/** mũ vòm có phiến nấm bên dưới; `children` vẽ trên mũ (chấm, lớp màu), vệt bóng vẽ sau cùng */
export function MushroomCap({ x = 100, y, rw, h, fill, gill, children }: { x?: number; y: number; rw: number; h: number; fill: string; gill: string; children?: ReactNode }) {
  return (
    <g>
      <ellipse cx={x} cy={y + h * 0.06} rx={rw * 0.86} ry={h * 0.16} fill={gill} stroke={INK} strokeWidth={1.6} />
      <path d={capPath(x, y, rw, h)} fill={fill} stroke={INK} strokeWidth={2.2} strokeLinejoin="round" />
      {children}
      <ellipse cx={x - rw * 0.45} cy={y - h * 0.62} rx={rw * 0.16} ry={h * 0.1} fill="#fff" opacity={0.55} transform={`rotate(-25 ${x - rw * 0.45} ${y - h * 0.62})`} />
    </g>
  );
}

/** chấm tròn trên mũ: [x, y, r] */
export const capDots = (pts: [number, number, number][], fill: string) =>
  pts.map(([cx, cy, r]) => <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={r} ry={r * 0.82} fill={fill} stroke={INK} strokeWidth={1.2} />);
