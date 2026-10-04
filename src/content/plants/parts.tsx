import { INK } from '../Face';

export const SOIL_Y = 160;

export function Seed({ color, stripe }: { color: string; stripe?: string }) {
  return (
    <g data-part="seed">
      <ellipse cx={100} cy={148} rx={20} ry={15} fill={color} stroke={INK} strokeWidth={2} />
      {stripe && (
        <g stroke={stripe} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M92 137 q-3 11 0 22" />
          <path d="M108 137 q3 11 0 22" />
        </g>
      )}
      <ellipse cx={93} cy={142} rx={5} ry={3} fill="#fff" opacity={0.5} />
    </g>
  );
}

export function Sprout({ leaf, stem }: { leaf: string; stem: string }) {
  return (
    <g data-part="sprout">
      <path d="M100 160 Q98 148 100 136" stroke={stem} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d="M100 104 Q80 84 66 96 Q80 112 100 104 Z" fill={leaf} stroke={INK} strokeWidth={2} />
      <path d="M100 104 Q120 84 134 96 Q120 112 100 104 Z" fill={leaf} stroke={INK} strokeWidth={2} />
      <circle cx={100} cy={120} r={18} fill={leaf} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function LeafyStem({ top, leaf, stem }: { top: number; leaf: string; stem: string }) {
  const mid = (SOIL_Y + top) / 2;
  return (
    <g data-part="stem">
      <path d={`M100 ${SOIL_Y} Q96 ${mid} 100 ${top}`} stroke={stem} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d={`M99 ${mid + 14} Q72 ${mid - 4} 60 ${mid + 10} Q78 ${mid + 28} 99 ${mid + 14} Z`} fill={leaf} stroke={INK} strokeWidth={2} />
      <path d={`M101 ${mid - 2} Q128 ${mid - 20} 140 ${mid - 6} Q122 ${mid + 12} 101 ${mid - 2} Z`} fill={leaf} stroke={INK} strokeWidth={2} />
    </g>
  );
}

export function HeartLeaf({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 12 C-16 2 -14 -16 0 -9 C14 -16 16 2 0 12 Z" fill="#8FD08A" stroke={INK} strokeWidth={1.6} />
      <path d="M0 9 Q-2 0 -6 -6" stroke="#F2EFA0" strokeWidth={3} fill="none" strokeLinecap="round" />
    </g>
  );
}
