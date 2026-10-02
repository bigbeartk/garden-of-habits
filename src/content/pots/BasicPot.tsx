import type { ReactNode } from 'react';
import { INK } from '../Face';

/** Chậu hình thang chuẩn: thân y 168–232, vành y 152–170, mặt đất y 160. */
export function BasicPot({ body, rim, soil = '#8B5E3C', children }: { body: string; rim: string; soil?: string; children?: ReactNode }) {
  return (
    <g data-part="pot">
      <path d="M46 166 L60 230 Q100 238 140 230 L154 166 Z" fill={body} stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      {children}
      <rect x={36} y={152} width={128} height={18} rx={9} fill={rim} stroke={INK} strokeWidth={2.5} />
      <ellipse cx={100} cy={157} rx={56} ry={4} fill={soil} />
    </g>
  );
}
